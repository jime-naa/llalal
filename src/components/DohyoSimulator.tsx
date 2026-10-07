import React from 'react';
import { IRSensors, EscapeSubstate, RampConfig } from '../types/sumo';
import { DohyoArena } from './DohyoArena';
import { RotateCcw, ShieldAlert } from 'lucide-react';

interface DohyoSimulatorProps {
  robotX: number;
  robotY: number;
  heading: number;
  irSensors: IRSensors;
  escapeSubstate: EscapeSubstate;
  activeTurn90: 'LEFT' | 'RIGHT' | null;
  onResetPosition: () => void;
  onNudgeForward: () => void;
  onNudgeBackward: () => void;
  onEmergencyTriggered: (sensor: 'FRONT' | 'REAR') => void;
  config: RampConfig;
}

export const DohyoSimulator: React.FC<DohyoSimulatorProps> = ({
  robotX,
  robotY,
  heading,
  irSensors,
  escapeSubstate,
  activeTurn90,
  onResetPosition,
  onNudgeForward,
  onNudgeBackward,
  onEmergencyTriggered,
  config
}) => {
  return (
    <div className="bg-[#f8f5ee] rounded-3xl p-5 shadow-sm border border-[#d8cfbe] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5dcce] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#004225]" />
          <h3 className="text-sm font-bold text-[#1B1C1E]">
            Dohyo de Práctica & FSM Infrarroja
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {activeTurn90 && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#004225] text-[#E9E1D0] animate-pulse">
              Girando 90° {activeTurn90 === 'LEFT' ? 'Izquierda ↺' : 'Derecha ↻'}
            </span>
          )}
          <button
            onClick={onResetPosition}
            className="flex items-center gap-1 text-xs text-[#2F4F3E] hover:text-[#004225] bg-[#E9E1D0] hover:bg-[#d8cfbe] px-3 py-1 rounded-full font-medium border border-[#d8cfbe] transition-all"
          >
            <RotateCcw className="w-3 h-3 text-[#2F4F3E]" />
            <span>Al Centro</span>
          </button>
        </div>
      </div>

      {/* Dohyo Arena Display */}
      <div className="my-2 flex justify-center">
        <DohyoArena
          robotX={robotX}
          robotY={robotY}
          heading={heading}
          irSensors={irSensors}
          escapeSubstate={escapeSubstate}
          activeTurn90={activeTurn90}
          size={320}
          onReset={onResetPosition}
        />
      </div>

      {/* FSM Status & Simulation Buttons */}
      <div className="pt-3 border-t border-[#e5dcce] flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs text-[#8A7F6A]">
            {escapeSubstate === 'IDLE' && (
              <span className="flex items-center gap-1.5 text-[#2F4F3E] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#004225]" />
                Tatami despejado &middot; Orientación: {Math.round(heading)}°
              </span>
            )}
            {escapeSubstate === 'FRONT_ESCAPE_REVERSE' && (
              <span className="flex items-center gap-1.5 text-rose-600 font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Línea ADELANTE &rarr; -100% ATRÁS ({config.frontEscapeDurationMs}ms)
              </span>
            )}
            {escapeSubstate === 'REAR_ESCAPE_FORWARD' && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                Línea ATRÁS &rarr; +100% ADELANTE ({config.rearEscapeDurationMs}ms)
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-[#8A7F6A] bg-[#E9E1D0] px-2 py-0.5 rounded-full border border-[#d8cfbe]">
            FSM sin delay()
          </span>
        </div>

        {/* Quick Simulation Triggers for Front and Rear */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onNudgeForward();
              onEmergencyTriggered('FRONT');
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#1B1C1E] border border-[#d8cfbe] transition-all active:scale-95"
          >
            <span>🚨 Probar Línea ADELANTE</span>
          </button>

          <button
            onClick={() => {
              onNudgeBackward();
              onEmergencyTriggered('REAR');
            }}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#1B1C1E] border border-[#d8cfbe] transition-all active:scale-95"
          >
            <span>🚨 Probar Línea ATRÁS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
