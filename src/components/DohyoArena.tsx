import React from 'react';
import { IRSensors, EscapeSubstate } from '../types/sumo';
import { RotateCcw } from 'lucide-react';

interface DohyoArenaProps {
  robotX: number;
  robotY: number;
  heading: number;
  irSensors: IRSensors;
  escapeSubstate: EscapeSubstate;
  activeTurn90?: 'LEFT' | 'RIGHT' | null;
  size?: number;
  onReset?: () => void;
  compact?: boolean;
}

export const DohyoArena: React.FC<DohyoArenaProps> = ({
  robotX,
  robotY,
  heading,
  irSensors,
  escapeSubstate,
  activeTurn90,
  size = 320,
  onReset,
  compact = false
}) => {
  const BASE_SIZE = 340;
  const DOHYO_RADIUS = 145;
  const RING_BORDER_WIDTH = 12;
  const INNER_RADIUS = DOHYO_RADIUS - RING_BORDER_WIDTH;
  const scale = size / BASE_SIZE;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Outer border container */}
      <div
        className="relative rounded-full shadow-inner overflow-hidden border-4 border-[#d8cfbe]"
        style={{
          width: size,
          height: size,
          backgroundColor: '#1B1C1E'
        }}
      >
        {/* Scaled Dohyo arena elements */}
        <div
          className="absolute origin-top-left pointer-events-none"
          style={{
            width: BASE_SIZE,
            height: BASE_SIZE,
            transform: `scale(${scale})`
          }}
        >
          {/* White border circle */}
          <div
            className="absolute rounded-full border-[12px] border-white pointer-events-none"
            style={{
              top: (BASE_SIZE - DOHYO_RADIUS * 2) / 2,
              left: (BASE_SIZE - DOHYO_RADIUS * 2) / 2,
              width: DOHYO_RADIUS * 2,
              height: DOHYO_RADIUS * 2
            }}
          />

          {/* Inner Dohyo surface (#1B1C1E) */}
          <div
            className="absolute rounded-full bg-[#1B1C1E] pointer-events-none"
            style={{
              top: (BASE_SIZE - INNER_RADIUS * 2) / 2,
              left: (BASE_SIZE - INNER_RADIUS * 2) / 2,
              width: INNER_RADIUS * 2,
              height: INNER_RADIUS * 2
            }}
          />

          {/* Start marks in palette taupe #8A7F6A */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 pointer-events-none opacity-60">
            <div className="w-[3px] h-10 bg-[#8A7F6A] rounded-full" />
            <div className="w-[3px] h-10 bg-[#8A7F6A] rounded-full" />
          </div>

          {/* Cross compass lines */}
          <div className="absolute inset-0 pointer-events-none opacity-15 flex items-center justify-center">
            <div className="w-full h-[1px] border-t border-dashed border-[#E9E1D0]" />
            <div className="h-full w-[1px] border-l border-dashed border-[#E9E1D0] absolute" />
          </div>

          {/* SUMOBOT with 2 IR sensors (Front and Rear) */}
          <div
            className="absolute transition-transform duration-75 ease-linear pointer-events-none"
            style={{
              left: robotX,
              top: robotY,
              transform: `translate(-50%, -50%) rotate(${heading + 90}deg)`
            }}
          >
            {/* Robot chassis in #2F4F3E & #004225 */}
            <div className="relative w-12 h-14 bg-gradient-to-b from-[#2F4F3E] to-[#004225] rounded-xl border border-[#8A7F6A] shadow-md flex flex-col items-center justify-between p-1">
              {/* Front scoop / blade */}
              <div className="absolute -top-1.5 left-1 right-1 h-1.5 bg-[#8A7F6A] rounded-t-md shadow-xs flex items-center justify-center">
                <span className="text-[6px] font-bold text-[#1B1C1E] uppercase">FRONT</span>
              </div>

              {/* Silicone wheels */}
              <div className="absolute -left-1 top-2 bottom-2 w-1.5 bg-[#1B1C1E] rounded-full border border-[#8A7F6A]/50" />
              <div className="absolute -right-1 top-2 bottom-2 w-1.5 bg-[#1B1C1E] rounded-full border border-[#8A7F6A]/50" />

              {/* SENSOR ADELANTE (Front IR) */}
              <div className="w-full flex items-center justify-center pt-0.5">
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${
                    irSensors.front
                      ? 'bg-rose-500 border-white shadow-md shadow-rose-500 scale-125 animate-pulse'
                      : 'bg-[#E9E1D0] border-[#8A7F6A]'
                  }`}
                  title="Sensor ADELANTE"
                >
                  <div className={`w-1 h-1 rounded-full ${irSensors.front ? 'bg-white' : 'bg-[#004225]'}`} />
                </div>
              </div>

              {/* Robot Center Heading Degrees readout */}
              <div className="my-auto text-[7px] font-extrabold text-[#E9E1D0] flex flex-col items-center">
                <span>{Math.round(heading)}°</span>
              </div>

              {/* SENSOR ATRÁS (Rear IR) */}
              <div className="w-full flex items-center justify-center pb-0.5">
                <div
                  className={`w-3 h-3 rounded-full border flex items-center justify-center transition-all ${
                    irSensors.rear
                      ? 'bg-rose-500 border-white shadow-md shadow-rose-500 scale-125 animate-pulse'
                      : 'bg-[#E9E1D0] border-[#8A7F6A]'
                  }`}
                  title="Sensor ATRÁS"
                >
                  <div className={`w-1 h-1 rounded-full ${irSensors.rear ? 'bg-white' : 'bg-[#004225]'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact overlay badge with orientation degree (only if size is large enough) */}
        {compact && size >= 120 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1B1C1E]/80 backdrop-blur-xs text-[10px] font-mono text-[#E9E1D0] border border-[#8A7F6A]/40 flex items-center gap-1 z-10 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004225] animate-pulse" />
            <span>{Math.round(heading)}°</span>
          </div>
        )}

        {/* Reset button inside compact view (only if size is large enough) */}
        {compact && size >= 120 && onReset && (
          <button
            onClick={onReset}
            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-[#E9E1D0]/90 hover:bg-[#d8cfbe] text-[#004225] shadow-xs border border-[#d8cfbe] transition-all active:scale-90 z-10"
            title="Centrar Robot"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#004225]" />
          </button>
        )}
      </div>
    </div>
  );
};
