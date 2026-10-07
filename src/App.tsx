/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LeverState, MotorOutput, IRSensors, EscapeSubstate, RampConfig } from './types/sumo';
import { LandscapeCockpit } from './components/LandscapeCockpit';
import { DohyoSimulator } from './components/DohyoSimulator';
import { TelemetryRampChart } from './components/TelemetryRampChart';
import { HBridgeMappingModal } from './components/HBridgeMappingModal';
import { BluetoothConnectModal } from './components/BluetoothConnectModal';
import { bleManager, BleConnectionState } from './utils/bleManager';
import { useSumoPhysics } from './hooks/useSumoPhysics';
import { Compass, BookOpen, Bluetooth } from 'lucide-react';

const DEFAULT_RAMP_CONFIG: RampConfig = {
  accelStep: 16,
  decelStep: 24,
  tickIntervalMs: 10,
  frontEscapeDurationMs: 800, // 800ms marcha atrás a -100% PWM
  rearEscapeDurationMs: 800,  // 800ms avance a +100% PWM
  snapTolerance: 7
};

export default function App() {
  const [config, setConfig] = useState<RampConfig>(DEFAULT_RAMP_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBleModalOpen, setIsBleModalOpen] = useState(false);

  // Bluetooth Connection State
  const [bleState, setBleState] = useState<BleConnectionState>(bleManager.state);
  const [lastBleCmd, setLastBleCmd] = useState('0,0,0');

  useEffect(() => {
    bleManager.setOnStateChange((st) => setBleState(st));
  }, []);

  // Levers
  const [leverL, setLeverL] = useState<LeverState>({ raw: 0, targetPwm: 0, isSnapped: false, isTouched: false });
  const [leverC, setLeverC] = useState<LeverState>({ raw: 0, targetPwm: 0, isSnapped: false, isTouched: false });
  const [leverR, setLeverR] = useState<LeverState>({ raw: 0, targetPwm: 0, isSnapped: false, isTouched: false });

  // One-shot 90 Degree Turn State
  const [activeTurn90, setActiveTurn90] = useState<'LEFT' | 'RIGHT' | null>(null);

  const isOverrideActive = Math.abs(leverL.raw) > 2 || Math.abs(leverR.raw) > 2;

  // 2 Sensores IR de Línea: ADELANTE y ATRÁS
  const [irSensors, setIrSensors] = useState<IRSensors>({ front: false, rear: false });

  // Máquina de Estados Finita (FSM)
  const [escapeSubstate, setEscapeSubstate] = useState<EscapeSubstate>('IDLE');
  const escapeTimerRef = useRef<number>(0);

  // Motors
  const [motorL, setMotorL] = useState<MotorOutput>({
    targetPwm: 0, currentPwm: 0, dutyCyclePercent: 0, direction: 'STOP', in1: false, in2: false
  });
  const [motorR, setMotorR] = useState<MotorOutput>({
    targetPwm: 0, currentPwm: 0, dutyCyclePercent: 0, direction: 'STOP', in1: false, in2: false
  });

  // Rolling Telemetry
  const [telemetryHistory, setTelemetryHistory] = useState<
    Array<{ time: number; targetL: number; actualL: number; targetR: number; actualR: number }>
  >([]);

  const currentPwmLRef = useRef(0);
  const currentPwmRRef = useRef(0);
  const targetPwmLRef = useRef(0);
  const targetPwmRRef = useRef(0);

  // Send BLE command helper
  const transmitBle = useCallback((cmd: string) => {
    setLastBleCmd(cmd);
    bleManager.sendCommand(cmd);
  }, []);

  // One-shot 90 Degree Turn Handler
  const handleTurn90 = useCallback((direction: 'LEFT' | 'RIGHT') => {
    if (escapeSubstate !== 'IDLE' || activeTurn90 !== null) return;

    setActiveTurn90(direction);

    if (direction === 'LEFT') {
      targetPwmLRef.current = -220;
      targetPwmRRef.current = 220;
      transmitBle('TURN90_L');
    } else {
      targetPwmLRef.current = 220;
      targetPwmRRef.current = -220;
      transmitBle('TURN90_R');
    }
  }, [escapeSubstate, activeTurn90, transmitBle]);

  // Turn 90 Completed Callback
  const handleTurn90Complete = useCallback(() => {
    setActiveTurn90(null);
    targetPwmLRef.current = 0;
    targetPwmRRef.current = 0;
    transmitBle('0,0,0');
  }, [transmitBle]);

  // Disparo de Emergencia por Sensor IR (Adelante o Atrás)
  const triggerEmergencyEscape = useCallback((sensor: 'FRONT' | 'REAR') => {
    const now = Date.now();
    escapeTimerRef.current = now;

    setActiveTurn90(null);

    if (sensor === 'FRONT') {
      setEscapeSubstate('FRONT_ESCAPE_REVERSE');
      targetPwmLRef.current = -255;
      targetPwmRRef.current = -255;
      currentPwmLRef.current = -255;
      currentPwmRRef.current = -255;
      transmitBle('IR_ESCAPE_FRONT');
    } else if (sensor === 'REAR') {
      setEscapeSubstate('REAR_ESCAPE_FORWARD');
      targetPwmLRef.current = 255;
      targetPwmRRef.current = 255;
      currentPwmLRef.current = 255;
      currentPwmRRef.current = 255;
      transmitBle('IR_ESCAPE_REAR');
    }
  }, [transmitBle]);

  // Synchronized Sumo Physics Hook
  const {
    robotX,
    robotY,
    heading,
    resetPosition,
    nudgeForwardToEdge,
    nudgeBackwardToEdge
  } = useSumoPhysics({
    motorL,
    motorR,
    irSensors,
    onIRChange: setIrSensors,
    escapeSubstate,
    activeTurn90,
    onTurn90Complete: handleTurn90Complete,
    onEmergencyTriggered: triggerEmergencyEscape
  });

  // Cálculo de PWM objetivo según la App (sólo si no hay emergencia ni giro de 90 activo)
  useEffect(() => {
    if (escapeSubstate !== 'IDLE' || activeTurn90 !== null) return;

    let cmd = '0,0,0';
    if (isOverrideActive) {
      targetPwmLRef.current = Math.round((leverL.raw / 100) * 255);
      targetPwmRRef.current = Math.round((leverR.raw / 100) * 255);
      cmd = `${leverL.raw},0,${leverR.raw}`;
    } else {
      const centralPwm = Math.round((leverC.raw / 100) * 255);
      targetPwmLRef.current = centralPwm;
      targetPwmRRef.current = centralPwm;
      cmd = `0,${leverC.raw},0`;
    }

    transmitBle(cmd);
  }, [leverL.raw, leverC.raw, leverR.raw, isOverrideActive, escapeSubstate, activeTurn90, transmitBle]);

  // Lazo principal FSM y Slew-Rate Limiter (Soft Stop / Start)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // --- MÁQUINA DE ESTADOS SIN DELAY (CON MILLIS) ---
      if (escapeSubstate === 'FRONT_ESCAPE_REVERSE') {
        targetPwmLRef.current = -255;
        targetPwmRRef.current = -255;
        if (now - escapeTimerRef.current >= config.frontEscapeDurationMs) {
          if (!irSensors.front) {
            setEscapeSubstate('IDLE');
            targetPwmLRef.current = 0;
            targetPwmRRef.current = 0;
          }
        }
      } else if (escapeSubstate === 'REAR_ESCAPE_FORWARD') {
        targetPwmLRef.current = 255;
        targetPwmRRef.current = 255;
        if (now - escapeTimerRef.current >= config.rearEscapeDurationMs) {
          if (!irSensors.rear) {
            setEscapeSubstate('IDLE');
            targetPwmLRef.current = 0;
            targetPwmRRef.current = 0;
          }
        }
      }

      // --- CÁLCULO DE RAMPA (SLEW RATE & SOFT STOP) ---
      const calculateRampStep = (current: number, target: number) => {
        if (current === target) return current;
        const isDecel = Math.abs(target) < Math.abs(current) || (current > 0 && target < 0) || (current < 0 && target > 0);
        const step = isDecel ? config.decelStep : config.accelStep;

        if (current < target) return Math.min(target, current + step);
        else return Math.max(target, current - step);
      };

      const nextPwmL = calculateRampStep(currentPwmLRef.current, targetPwmLRef.current);
      const nextPwmR = calculateRampStep(currentPwmRRef.current, targetPwmRRef.current);

      currentPwmLRef.current = nextPwmL;
      currentPwmRRef.current = nextPwmR;

      const getHBridge = (pwm: number) => {
        if (pwm > 0) return { dir: 'FORWARD' as const, in1: true, in2: false };
        if (pwm < 0) return { dir: 'REVERSE' as const, in1: false, in2: true };
        return { dir: 'STOP' as const, in1: false, in2: false };
      };

      const hbL = getHBridge(nextPwmL);
      const hbR = getHBridge(nextPwmR);

      setMotorL({
        targetPwm: targetPwmLRef.current,
        currentPwm: nextPwmL,
        dutyCyclePercent: Math.round((Math.abs(nextPwmL) / 255) * 100),
        direction: hbL.dir,
        in1: hbL.in1,
        in2: hbL.in2,
      });

      setMotorR({
        targetPwm: targetPwmRRef.current,
        currentPwm: nextPwmR,
        dutyCyclePercent: Math.round((Math.abs(nextPwmR) / 255) * 100),
        direction: hbR.dir,
        in1: hbR.in1,
        in2: hbR.in2,
      });

      setTelemetryHistory((prev) => {
        const next = [
          ...prev,
          {
            time: now,
            targetL: targetPwmLRef.current,
            actualL: nextPwmL,
            targetR: targetPwmRRef.current,
            actualR: nextPwmR,
          },
        ];
        return next.slice(-50);
      });
    }, config.tickIntervalMs);

    return () => clearInterval(interval);
  }, [config, escapeSubstate, irSensors]);

  const handleLeverChange = (lever: 'L' | 'C' | 'R', val: number, isTouched: boolean) => {
    if (activeTurn90 !== null) {
      setActiveTurn90(null);
    }

    let tag = '';
    if (val === 100) tag = 'Fuerza Total (+100%)';
    else if (val === 50) tag = 'Paseo Suave (+50%)';
    else if (val === 0) tag = 'Punto Cero (0%)';
    else if (val === -50) tag = 'Atrás Suave (-50%)';
    else if (val === -100) tag = 'Atrás Total (-100%)';

    const stateObj: LeverState = {
      raw: val,
      targetPwm: Math.round((val / 100) * 255),
      isSnapped: tag !== '',
      snappedLabel: tag || undefined,
      isTouched,
    };

    if (lever === 'L') setLeverL(stateObj);
    else if (lever === 'C') setLeverC(stateObj);
    else if (lever === 'R') setLeverR(stateObj);
  };

  const handleQuickAction = (action: 'CRUISE_50' | 'FULL_100' | 'STOP') => {
    setActiveTurn90(null);

    if (action === 'CRUISE_50') {
      handleLeverChange('L', 0, false);
      handleLeverChange('R', 0, false);
      handleLeverChange('C', 50, false);
    } else if (action === 'FULL_100') {
      handleLeverChange('L', 0, false);
      handleLeverChange('R', 0, false);
      handleLeverChange('C', 100, false);
    } else if (action === 'STOP') {
      handleLeverChange('L', 0, false);
      handleLeverChange('R', 0, false);
      handleLeverChange('C', 0, false);
    }
  };

  const isSoftStopActive =
    (motorL.targetPwm === 0 && motorL.currentPwm !== 0) ||
    (motorR.targetPwm === 0 && motorR.currentPwm !== 0);

  return (
    <div className="min-h-screen bg-[#E9E1D0] text-[#1B1C1E] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#f8f5ee]/95 border-b border-[#d8cfbe] backdrop-blur px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0] shadow-sm">
            <Compass className="w-5 h-5 text-[#E9E1D0]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[#1B1C1E] tracking-tight">
                SumoBot Control
              </h1>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E9E1D0] text-[#004225] border border-[#d8cfbe]">
                ESP32 &middot; BLE &middot; FSM con millis()
              </span>
            </div>
            <p className="text-xs text-[#8A7F6A]">
              Control diferencial en landscape con visor dohyo sincronizado y giros de 90°
            </p>
          </div>
        </div>

        {/* Actions & Bluetooth Connection Status */}
        <div className="flex items-center gap-2">
          {/* BLUETOOTH CONNECTION BUTTON */}
          <button
            onClick={() => setIsBleModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
              bleState.isConnected
                ? 'bg-[#004225] text-[#E9E1D0] hover:bg-[#00341c]'
                : 'bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#1B1C1E] border border-[#d8cfbe]'
            }`}
          >
            <Bluetooth className={`w-3.5 h-3.5 ${bleState.isConnected ? 'animate-pulse text-[#E9E1D0]' : 'text-[#004225]'}`} />
            <span>
              {bleState.isConnected
                ? `${bleState.deviceName || 'ESP32'} Conectado`
                : 'Conectar Bluetooth'}
            </span>
          </button>

          {/* Button to view H-Bridge table and C++ code */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#004225] text-xs font-bold border border-[#d8cfbe] transition-all shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#004225]" />
            <span>Mapeo Puente H & Código C++</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col gap-5">
        {/* Cockpit WITH Live Dohyo Viewport right next to Levers! */}
        <LandscapeCockpit
          leverL={leverL}
          leverC={leverC}
          leverR={leverR}
          onLeverChange={handleLeverChange}
          onQuickAction={handleQuickAction}
          onTurn90={handleTurn90}
          activeTurn90={activeTurn90}
          isOverrideActive={isOverrideActive}
          isEmergencyLine={escapeSubstate !== 'IDLE'}
          config={config}
          robotX={robotX}
          robotY={robotY}
          heading={heading}
          irSensors={irSensors}
          escapeSubstate={escapeSubstate}
          onResetPosition={resetPosition}
        />

        {/* Detailed Dohyo Arena + Soft-Stop Telemetry Chart Below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <DohyoSimulator
            robotX={robotX}
            robotY={robotY}
            heading={heading}
            irSensors={irSensors}
            escapeSubstate={escapeSubstate}
            activeTurn90={activeTurn90}
            onResetPosition={resetPosition}
            onNudgeForward={nudgeForwardToEdge}
            onNudgeBackward={nudgeBackwardToEdge}
            onEmergencyTriggered={triggerEmergencyEscape}
            config={config}
          />

          <div className="flex flex-col justify-start">
            <TelemetryRampChart
              history={telemetryHistory}
              motorL={motorL}
              motorR={motorR}
              isSoftStopActive={isSoftStopActive}
              isEmergency={escapeSubstate !== 'IDLE'}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#d8cfbe] bg-[#f8f5ee]/60 px-4 py-3 text-center text-xs text-[#8A7F6A]">
        SumoBot Autonomous & Teleoperated Platform &middot; ESP32 BLE (GATT), Arduino & Puente H
      </footer>

      {/* Modal with H-Bridge Table & C++ Code */}
      <HBridgeMappingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        config={config}
        onConfigChange={setConfig}
      />

      {/* Modal for Web Bluetooth Pairing & Status */}
      <BluetoothConnectModal
        isOpen={isBleModalOpen}
        onClose={() => setIsBleModalOpen(false)}
        lastCommand={lastBleCmd}
      />
    </div>
  );
}
