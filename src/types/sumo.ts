export interface LeverState {
  raw: number; // -100 to +100
  targetPwm: number; // -255 to +255
  isSnapped: boolean;
  snappedLabel?: string;
  isTouched: boolean;
}

export interface MotorOutput {
  targetPwm: number;    // -255 to +255
  currentPwm: number;   // -255 to +255 after slew rate / ramp
  dutyCyclePercent: number; // 0 to 100%
  direction: 'FORWARD' | 'REVERSE' | 'BRAKE' | 'STOP';
  in1: boolean;
  in2: boolean;
}

export interface IRSensors {
  front: boolean; // Sensor Adelante: true = línea blanca detectada
  rear: boolean;  // Sensor Atrás: true = línea blanca detectada
}

export type RobotState = 'MANUAL' | 'OVERRIDE_LATERAL' | 'EMERGENCY_COUNTERATTACK';

export type EscapeSubstate = 'IDLE' | 'FRONT_ESCAPE_REVERSE' | 'REAR_ESCAPE_FORWARD';

export interface RampConfig {
  accelStep: number;           // PWM por ciclo (Aceleración controlada)
  decelStep: number;           // PWM por ciclo (Soft Stop al soltar)
  tickIntervalMs: number;      // Frecuencia de loop de rampa en ms (ej. 10ms)
  frontEscapeDurationMs: number;// Tiempo de retroceso forzado (-100% PWM), ej. 800ms
  rearEscapeDurationMs: number; // Tiempo de avance forzado (+100% PWM), ej. 800ms
  snapTolerance: number;        // Tolerancia magnética de muescas en %
}

export interface HBridgeStateEntry {
  maneuver: string;
  in1: number;
  in2: number;
  in3: number;
  in4: number;
  pwmL: number | string;
  pwmR: number | string;
  motionL: string;
  motionR: string;
  robotBehavior: string;
}
