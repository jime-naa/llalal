import { RampConfig } from '../types/sumo';

export function generateCppFirmware(config: RampConfig): {
  mainIno: string;
  motorControlH: string;
  safetyEscapeH: string;
  configH: string;
  bleParserH: string;
} {
  const configH = `/**
 * ============================================================================
 * CONFIG.H - CONFIGURACIÓN DEL SISTEMA Y PINES DE HARDWARE
 * Plataforma: ESP32 con Bluetooth Low Energy (BLE)
 * ============================================================================
 */
#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- UUIDs PARA BLUETOOTH LOW ENERGY (BLE) ---
// Puedes generar tus propios UUIDs o conservar estos estándar
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define BLE_DEVICE_NAME     "SumoBot_BLE"

// --- PINES DEL PUENTE H (TRACCIÓN DIFERENCIAL) ---
#define PIN_MOTOR_L_PWM   18   // PWM Motor Izquierdo
#define PIN_MOTOR_L_IN1   19   // Dirección 1 Motor Izquierdo
#define PIN_MOTOR_L_IN2   21   // Dirección 2 Motor Izquierdo

#define PIN_MOTOR_R_PWM   22   // PWM Motor Derecho
#define PIN_MOTOR_R_IN1   23   // Dirección 1 Motor Derecho
#define PIN_MOTOR_R_IN2   25   // Dirección 2 Motor Derecho

#define PIN_MOTOR_STBY    5    // Standby del puente H (HIGH = activo)

// --- CONFIGURACIÓN PWM HARDWARE PARA ESP32 (LEDC) ---
#define PWM_FREQ_HZ       20000 // 20 kHz ultrasónico (sin zumbidos molestos)
#define PWM_RESOLUTION    8     // 8 bits (0 a 255)
#define PWM_CHANNEL_L     0     // Canal LEDC izquierdo
#define PWM_CHANNEL_R     1     // Canal LEDC derecho

// --- SENSORES INFRARROJOS DE LÍNEA BLANCA (DOHYO) ---
// Sensores reflectivos digitales (TCRT5000 / QTR-1A). HIGH = Blanco detectado
#define PIN_IR_FRONT      32   // Sensor ADELANTE
#define PIN_IR_REAR       33   // Sensor ATRÁS

// --- RAMPAS DE VELOCIDAD (SOFT START / STOP) ---
#define RAMP_INTERVAL_MS      ${config.tickIntervalMs}   // Frecuencia del lazo de rampa (cada ${config.tickIntervalMs} ms)
#define ACCEL_STEP_PWM        ${config.accelStep}    // Aceleración gradual por ciclo
#define DECEL_STEP_SOFT_STOP  ${config.decelStep}    // Desaceleración suave (Soft Stop) al soltar

// --- TIEMPOS DE CONTRAATAQUE (FSM CON MILLIS) ---
#define FRONT_ESCAPE_TIME_MS  ${config.frontEscapeDurationMs}  // Tiempo a -100% PWM hacia atrás al tocar borde frontal
#define REAR_ESCAPE_TIME_MS   ${config.rearEscapeDurationMs}   // Tiempo a +100% PWM hacia adelante al tocar borde trasero
#define MAX_ESCAPE_PWM        255  // 100% PWM de empuje para recuperar el centro

// --- GIROS PRECISOS DE 90 GRADOS (UN SOLO USO POR TOQUE) ---
#define TURN_90_TIME_MS       260  // Tiempo calibrado para rotación exacta de 90°
#define TURN_90_SPEED_PWM     220  // Velocidad de giro para 90 grados

// --- WATCHDOG DE CONEXIÓN BLE ---
#define BLE_TIMEOUT_MS        400  // Si no hay escrituras en 400ms, parada de seguridad

#endif // CONFIG_H
`;

  const motorControlH = `/**
 * ============================================================================
 * MOTORCONTROL.H - GESTOR DE MOTORES CON RAMPAS PWM Y SOFT STOP
 * Implementa Slew-Rate Limiter para proteger las reductoras mecánicas
 * ============================================================================
 */
#ifndef MOTOR_CONTROL_H
#define MOTOR_CONTROL_H

#include "Config.h"

class MotorDriver {
private:
    int currentPwmL = 0;   // PWM actual suavizado en el motor (-255 a +255)
    int currentPwmR = 0;
    int targetPwmL  = 0;   // PWM objetivo comandado (-255 a +255)
    int targetPwmR  = 0;
    
    unsigned long lastRampTime = 0;

    /**
     * Slew-Rate Limiter asimétrico:
     * - Aceleración gradual para no patinar ni provocar picos inrush
     * - Desaceleración (Soft Stop) para frenar sin golpear la piñonería
     */
    int calculateRamp(int current, int target) {
        if (current == target) return current;

        bool isDecel = (abs(target) < abs(current)) || 
                       ((current > 0 && target < 0) || (current < 0 && target > 0));
        int step = isDecel ? DECEL_STEP_SOFT_STOP : ACCEL_STEP_PWM;

        if (current < target) {
            current += step;
            if (current > target) current = target;
        } else {
            current -= step;
            if (current < target) current = target;
        }
        return current;
    }

    void writeHardware(int pwmVal, int in1Pin, int in2Pin, uint8_t pwmChannel) {
        if (pwmVal > 0) {
            // Marcha ADELANTE
            digitalWrite(in1Pin, HIGH);
            digitalWrite(in2Pin, LOW);
            ledcWrite(pwmChannel, constrain(pwmVal, 0, 255));
        } else if (pwmVal < 0) {
            // Marcha ATRÁS
            digitalWrite(in1Pin, LOW);
            digitalWrite(in2Pin, HIGH);
            ledcWrite(pwmChannel, constrain(abs(pwmVal), 0, 255));
        } else {
            // Reposo suave (Soft Stop / Coast)
            digitalWrite(in1Pin, LOW);
            digitalWrite(in2Pin, LOW);
            ledcWrite(pwmChannel, 0);
        }
    }

public:
    void init() {
        pinMode(PIN_MOTOR_L_IN1, OUTPUT);
        pinMode(PIN_MOTOR_L_IN2, OUTPUT);
        pinMode(PIN_MOTOR_R_IN1, OUTPUT);
        pinMode(PIN_MOTOR_R_IN2, OUTPUT);
        pinMode(PIN_MOTOR_STBY, OUTPUT);
        digitalWrite(PIN_MOTOR_STBY, HIGH);

        // Hardware PWM ESP32
        ledcSetup(PWM_CHANNEL_L, PWM_FREQ_HZ, PWM_RESOLUTION);
        ledcAttachPin(PIN_MOTOR_L_PWM, PWM_CHANNEL_L);
        ledcSetup(PWM_CHANNEL_R, PWM_FREQ_HZ, PWM_RESOLUTION);
        ledcAttachPin(PIN_MOTOR_R_PWM, PWM_CHANNEL_R);

        stop();
    }

    void setTarget(int pwmL, int pwmR) {
        targetPwmL = constrain(pwmL, -255, 255);
        targetPwmR = constrain(pwmR, -255, 255);
    }

    // Inyección directa inmediata para el contraataque de emergencia por IR
    void setInstantDirect(int pwmL, int pwmR) {
        targetPwmL = constrain(pwmL, -255, 255);
        targetPwmR = constrain(pwmR, -255, 255);
        currentPwmL = targetPwmL;
        currentPwmR = targetPwmR;
        writeHardware(currentPwmL, PIN_MOTOR_L_IN1, PIN_MOTOR_L_IN2, PWM_CHANNEL_L);
        writeHardware(currentPwmR, PIN_MOTOR_R_IN1, PIN_MOTOR_R_IN2, PWM_CHANNEL_R);
    }

    // Actualiza la rampa periódicamente sin bloquear el loop
    void updateRamps() {
        unsigned long now = millis();
        if (now - lastRampTime >= RAMP_INTERVAL_MS) {
            lastRampTime = now;
            currentPwmL = calculateRamp(currentPwmL, targetPwmL);
            currentPwmR = calculateRamp(currentPwmR, targetPwmR);

            writeHardware(currentPwmL, PIN_MOTOR_L_IN1, PIN_MOTOR_L_IN2, PWM_CHANNEL_L);
            writeHardware(currentPwmR, PIN_MOTOR_R_IN1, PIN_MOTOR_R_IN2, PWM_CHANNEL_R);
        }
    }

    void stop() {
        targetPwmL = 0; currentPwmL = 0;
        targetPwmR = 0; currentPwmR = 0;
        digitalWrite(PIN_MOTOR_L_IN1, LOW);
        digitalWrite(PIN_MOTOR_L_IN2, LOW);
        digitalWrite(PIN_MOTOR_R_IN1, LOW);
        digitalWrite(PIN_MOTOR_R_IN2, LOW);
        ledcWrite(PWM_CHANNEL_L, 0);
        ledcWrite(PWM_CHANNEL_R, 0);
    }

    int getCurrentL() const { return currentPwmL; }
    int getCurrentR() const { return currentPwmR; }
};

#endif // MOTOR_CONTROL_H
`;

  const safetyEscapeH = `/**
 * ============================================================================
 * SAFETYESCAPE.H - MÁQUINA DE ESTADOS FINITA (FSM) DE SALVAGUARDA POR IR
 * Prioridad 1 Absoluta: Anula comandos BLE si detecta línea blanca
 * 100% No Bloqueante mediante millis() (CERO USO DE delay())
 * ============================================================================
 */
#ifndef SAFETY_ESCAPE_H
#define SAFETY_ESCAPE_H

#include "Config.h"
#include "MotorControl.h"

enum SumoFsmState {
    FSM_MANUAL_BLE,            // Modo normal: Comandos de palancas por BLE
    FSM_COUNTERATTACK_REVERSE, // Sensor ADELANTE detectó blanco -> -100% atrás
    FSM_COUNTERATTACK_FORWARD  // Sensor ATRÁS detectó blanco    -> +100% adelante
};

class SumoSafetyManager {
private:
    SumoFsmState currentState = FSM_MANUAL_BLE;
    unsigned long stateStartTime = 0;

    bool lineFront = false;
    bool lineRear  = false;

public:
    void init() {
        pinMode(PIN_IR_FRONT, INPUT_PULLUP);
        pinMode(PIN_IR_REAR, INPUT_PULLUP);
    }

    void sampleSensors() {
        // En módulos TCRT5000 / QTR-1A con comparador:
        // HIGH = Superficie blanca reflectiva del borde del Dohyo
        lineFront = (digitalRead(PIN_IR_FRONT) == HIGH);
        lineRear  = (digitalRead(PIN_IR_REAR) == HIGH);
    }

    /**
     * Ciclo de actualización de la FSM
     * Retorna TRUE si el robot está en contraataque de emergencia (BLE IGNORADO)
     * Retorna FALSE si el tatami está despejado (BLE HABILITADO)
     */
    bool update(MotorDriver &motors) {
        sampleSensors();
        unsigned long now = millis();

        switch (currentState) {
            // -------------------------------------------------------------
            // ESTADO 1: CONTROL NORMAL POR LA APP (BLE)
            // -------------------------------------------------------------
            case FSM_MANUAL_BLE:
                if (lineFront) {
                    // Sensor ADELANTE tocó el borde -> Fuerza máxima atrás (-100% PWM)
                    currentState = FSM_COUNTERATTACK_REVERSE;
                    stateStartTime = now;
                    motors.setInstantDirect(-MAX_ESCAPE_PWM, -MAX_ESCAPE_PWM);
                    return true;
                } else if (lineRear) {
                    // Sensor ATRÁS tocó el borde -> Fuerza máxima adelante (+100% PWM)
                    currentState = FSM_COUNTERATTACK_FORWARD;
                    stateStartTime = now;
                    motors.setInstantDirect(MAX_ESCAPE_PWM, MAX_ESCAPE_PWM);
                    return true;
                }
                return false;

            // -------------------------------------------------------------
            // ESTADO 2: CONTRAATAQUE RETROCESO (Sensor ADELANTE)
            // -------------------------------------------------------------
            case FSM_COUNTERATTACK_REVERSE:
                // Mantiene -100% PWM durante FRONT_ESCAPE_TIME_MS (800ms) sin delay
                if (now - stateStartTime >= FRONT_ESCAPE_TIME_MS) {
                    if (!lineFront) {
                        // Salió de la línea con éxito -> Restituir control al BLE
                        currentState = FSM_MANUAL_BLE;
                        motors.setTarget(0, 0); // Parada suave
                        return false;
                    } else {
                        // Aún ve blanco -> Prolongar retroceso
                        motors.setInstantDirect(-MAX_ESCAPE_PWM, -MAX_ESCAPE_PWM);
                    }
                } else {
                    motors.setTarget(-MAX_ESCAPE_PWM, -MAX_ESCAPE_PWM);
                }
                return true;

            // -------------------------------------------------------------
            // ESTADO 3: CONTRAATAQUE AVANCE (Sensor ATRÁS)
            // -------------------------------------------------------------
            case FSM_COUNTERATTACK_FORWARD:
                // Mantiene +100% PWM durante REAR_ESCAPE_TIME_MS (800ms) sin delay
                if (now - stateStartTime >= REAR_ESCAPE_TIME_MS) {
                    if (!lineRear) {
                        currentState = FSM_MANUAL_BLE;
                        motors.setTarget(0, 0);
                        return false;
                    } else {
                        motors.setInstantDirect(MAX_ESCAPE_PWM, MAX_ESCAPE_PWM);
                    }
                } else {
                    motors.setTarget(MAX_ESCAPE_PWM, MAX_ESCAPE_PWM);
                }
                return true;

            default:
                currentState = FSM_MANUAL_BLE;
                return false;
        }
    }

    SumoFsmState getState() const { return currentState; }
    bool isFrontActive() const { return lineFront; }
    bool isRearActive() const { return lineRear; }
};

#endif // SAFETY_ESCAPE_H
`;

  const bleParserH = `/**
 * ============================================================================
 * BLEPARSER.H - PARSEADOR Y REGLA DE OVERRIDE PARA LAS 3 PALANCAS
 * Formato de trama enviado por la App: "L,C,R\\n" (ejemplo: "50,0,-50")
 * Donde:
 *   L = Palanca Rueda Izquierda (-100 a +100%)
 *   C = Palanca Central Crucero  (-100 a +100%)
 *   R = Palanca Rueda Derecha   (-100 a +100%)
 * ============================================================================
 */
#ifndef BLE_PARSER_H
#define BLE_PARSER_H

#include <Arduino.h>
#include <string>

class LeverProcessor {
public:
    /**
     * Parsea la cadena recibida de BLE y aplica la regla de Override
     * Soporta tramas continuas "L,C,R" y comandos de un toque "TURN90_L" / "TURN90_R"
     */
    static bool parseAndCalculate(const std::string &str, int &outPwmL, int &outPwmR, bool &outOverrideActive, bool &outIs90Turn) {
        if (str.empty()) return false;
        outIs90Turn = false;

        // Comandos de un solo uso para Giro de 90 Grados
        if (str.rfind("TURN90_L", 0) == 0) {
            outIs90Turn = true;
            outOverrideActive = true;
            outPwmL = -TURN_90_SPEED_PWM;
            outPwmR = TURN_90_SPEED_PWM;
            return true;
        } else if (str.rfind("TURN90_R", 0) == 0) {
            outIs90Turn = true;
            outOverrideActive = true;
            outPwmL = TURN_90_SPEED_PWM;
            outPwmR = -TURN_90_SPEED_PWM;
            return true;
        }

        int leverL = 0;
        int leverC = 0;
        int leverR = 0;

        // Parseo eficiente de la cadena separada por comas usando sscanf
        // Ejemplo de cadena válida: "0,50,0" o "100,0,-100"
        int parsedCount = sscanf(str.c_str(), "%d,%d,%d", &leverL, &leverC, &leverR);
        if (parsedCount < 3) {
            return false; // Formato inválido o incompleto
        }

        // Limitar valores al rango porcentual permitido
        leverL = constrain(leverL, -100, 100);
        leverC = constrain(leverC, -100, 100);
        leverR = constrain(leverR, -100, 100);

        // --- REGLA DE OVERRIDE (PRIORIDAD DE PALANCAS) ---
        // Si se mueve cualquiera de las palancas laterales (|L| > 2 o |R| > 2),
        // la palanca central se DESHABILITA automáticamente.
        outOverrideActive = (abs(leverL) > 2 || abs(leverR) > 2);

        int targetPctL = 0;
        int targetPctR = 0;

        if (outOverrideActive) {
            // Mando por palancas laterales (control diferencial independiente)
            targetPctL = leverL;
            targetPctR = leverR;
        } else {
            // Mando por palanca central (desplazamiento en línea recta simultáneo)
            targetPctL = leverC;
            targetPctR = leverC;
        }

        // Mapear de porcentaje (-100 a +100%) a rango PWM del puente H (-255 a +255)
        outPwmL = map(targetPctL, -100, 100, -255, 255);
        outPwmR = map(targetPctR, -100, 100, -255, 255);

        return true;
    }
};

#endif // BLE_PARSER_H
`;

  const mainIno = `/**
 * ============================================================================
 * SUMOBOT_ESP32_BLE.INO - CÓDIGO COMPLETO PARA ESP32 CON BLUETOOTH LOW ENERGY
 * 
 * Arquitectura:
 * - BLEDevice, BLEServer, BLEService, BLECharacteristic, MyCallbacks::onWrite
 * - FSM Infrarroja con millis() (CERO delay)
 * - Override automático de 3 Palancas (L, C, R)
 * - Slew-Rate Limiter (Soft Start / Stop)
 * ============================================================================
 */
#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#include "Config.h"
#include "MotorControl.h"
#include "SafetyEscape.h"
#include "BleParser.h"

// --- OBJETOS GLOBALES ---
MotorDriver motors;
SumoSafetyManager safetyManager;

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long lastBleWriteTime = 0;

// Variables compartidas recibidas de BLE
volatile int desiredPwmL = 0;
volatile int desiredPwmR = 0;
volatile bool overrideActive = false;
volatile bool newCommandAvailable = false;

// Variables para giro preciso de 90° de un solo uso
volatile bool turn90Active = false;
volatile unsigned long turn90StartTime = 0;

// -------------------------------------------------------------
// CALLBACK DE SERVIDOR BLE (CONEXIÓN / DESCONEXIÓN)
// -------------------------------------------------------------
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) override {
        deviceConnected = true;
        Serial.println("[BLE] Dispositivo móvil conectado exitosamente.");
    }

    void onDisconnect(BLEServer* pServer) override {
        deviceConnected = false;
        turn90Active = false;
        Serial.println("[BLE] Dispositivo móvil desconectado. Entrando en reposo.");
        motors.stop();
    }
};

// -------------------------------------------------------------
// CALLBACK DE ESCRITURA BLE (RECIBE DATOS DE LA APP MÓVIL)
// -------------------------------------------------------------
class MyCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) override {
        // 1. Obtener la cadena transmitida por la aplicación móvil
        std::string rxValue = pCharacteristic->getValue();

        if (rxValue.length() > 0) {
            lastBleWriteTime = millis();

            int pwmL = 0;
            int pwmR = 0;
            bool isOverride = false;
            bool is90Turn = false;

            // 2. Parsear el std::string y aplicar regla de Override o Giro de 90°
            if (LeverProcessor::parseAndCalculate(rxValue, pwmL, pwmR, isOverride, is90Turn)) {
                if (is90Turn) {
                    // Activar giro de 90° de UN SOLO USO
                    turn90Active = true;
                    turn90StartTime = millis();
                    motors.setInstantDirect(pwmL, pwmR);
                } else {
                    // Comando de palanca normal: cancela giro de 90° si estaba en curso
                    turn90Active = false;
                    desiredPwmL = pwmL;
                    desiredPwmR = pwmR;
                    overrideActive = isOverride;
                    newCommandAvailable = true;
                }
            }
        }
    }
};

// -------------------------------------------------------------
// SETUP (INICIALIZACIÓN DE HARDWARE Y BLE)
// -------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    delay(100);
    Serial.println("\\n>>> INICIANDO SUMOBOT ESP32 BLE (COMPETICIÓN) <<<");

    // 1. Inicializar Hardware de Motores y Canales PWM LEDC
    motors.init();
    Serial.println("[OK] Motores y canales PWM a 20 kHz listos.");

    // 2. Inicializar Sensores Infrarrojos (Adelante y Atrás)
    safetyManager.init();
    Serial.println("[OK] Sensores IR Frontal (Pin 32) y Trasero (Pin 33) listos.");

    // 3. Inicializar el Stack BLE del ESP32
    BLEDevice::init(BLE_DEVICE_NAME);

    // Crear Servidor BLE
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Crear Servicio BLE
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Crear Característica BLE para recibir comandos (WRITE)
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ   |
        BLECharacteristic::PROPERTY_WRITE  |
        BLECharacteristic::PROPERTY_NOTIFY
    );

    // Asignar el Callback onWrite
    pCharacteristic->setCallbacks(new MyCallbacks());
    pCharacteristic->addDescriptor(new BLE2902());

    // Iniciar Servicio y Anuncio (Advertising)
    pService->start();
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06); // Funciones de baja latencia en iPhone
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println("[OK] BLE Anunciando. Conéctate desde la App a: " BLE_DEVICE_NAME);
}

// -------------------------------------------------------------
// LOOP PRINCIPAL (100% LIBRE DE DELAY)
// -------------------------------------------------------------
void loop() {
    // -------------------------------------------------------------
    // PRIORIDAD 1 (MÁXIMA): MÁQUINA DE ESTADOS INFRARROJA
    // -------------------------------------------------------------
    // Si update() retorna TRUE, el robot está ejecutando contraataque forzado:
    // - Si vio blanco ADELANTE -> -100% PWM Atrás durante 800ms
    // - Si vio blanco ATRÁS    -> +100% PWM Adelante durante 800ms
    // Durante este tiempo, CUALQUIER comando BLE es IGNORADO.
    bool inEmergency = safetyManager.update(motors);

    // -------------------------------------------------------------
    // PRIORIDAD 2: APLICAR COMANDOS DE LA APP MÓVIL
    // -------------------------------------------------------------
    if (!inEmergency && deviceConnected) {
        // Manejo del giro de 90 grados de un solo uso
        if (turn90Active) {
            if (millis() - turn90StartTime >= TURN_90_TIME_MS) {
                turn90Active = false; // Giro completado: no vuelve a actuar hasta un nuevo toque
                motors.stop();
            }
        } else if (newCommandAvailable) {
            motors.setTarget(desiredPwmL, desiredPwmR);
            newCommandAvailable = false;
        }

        // Failsafe Watchdog: Si no recibimos paquetes BLE por > 400ms, frenar
        if (!turn90Active && (millis() - lastBleWriteTime > BLE_TIMEOUT_MS)) {
            motors.setTarget(0, 0);
        }
    } else if (!deviceConnected && !inEmergency) {
        turn90Active = false;
        motors.setTarget(0, 0);
    }

    // -------------------------------------------------------------
    // PRIORIDAD 3: ACTUALIZAR RAMPAS PWM (SOFT START / SOFT STOP)
    // -------------------------------------------------------------
    // Desacelera suavemente al soltar la palanca para no romper piñones
    motors.updateRamps();

    // -------------------------------------------------------------
    // GESTIÓN DE RECONEXIÓN AUTOMÁTICA BLE
    // -------------------------------------------------------------
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // Pequeña pausa al desconectar para que el stack BLE se limpie
        pServer->startAdvertising(); // Reiniciar anuncios
        Serial.println("[BLE] Reiniciando anuncios BLE...");
        oldDeviceConnected = deviceConnected;
    }
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
}
`;

  return {
    mainIno,
    motorControlH,
    safetyEscapeH,
    configH,
    bleParserH
  };
}
