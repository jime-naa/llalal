import React, { useMemo } from 'react';
import { MotorOutput } from '../types/sumo';
import { Activity, ShieldCheck } from 'lucide-react';

interface TelemetryRampChartProps {
  history: Array<{
    time: number;
    targetL: number;
    actualL: number;
    targetR: number;
    actualR: number;
  }>;
  motorL: MotorOutput;
  motorR: MotorOutput;
  isSoftStopActive: boolean;
  isEmergency: boolean;
}

export const TelemetryRampChart: React.FC<TelemetryRampChartProps> = ({
  history,
  motorL,
  motorR,
  isSoftStopActive,
  isEmergency
}) => {
  const chartWidth = 440;
  const chartHeight = 110;
  const midY = chartHeight / 2;

  const paths = useMemo(() => {
    if (history.length < 2) return { targetL: '', actualL: '', targetR: '', actualR: '' };

    const maxPoints = 50;
    const pts = history.slice(-maxPoints);
    const stepX = chartWidth / (maxPoints - 1);

    const makePath = (key: 'targetL' | 'actualL' | 'targetR' | 'actualR') => {
      return pts.reduce((acc, p, idx) => {
        const x = idx * stepX;
        const y = midY - (p[key] / 255) * (midY - 12);
        return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      }, '');
    };

    return {
      targetL: makePath('targetL'),
      actualL: makePath('actualL'),
      targetR: makePath('targetR'),
      actualR: makePath('actualR')
    };
  }, [history, chartWidth, midY]);

  return (
    <div className="bg-[#f8f5ee] rounded-3xl p-5 shadow-sm border border-[#d8cfbe] flex flex-col justify-between">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#e5dcce] pb-2.5 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#004225] flex items-center justify-center text-[#E9E1D0]">
            <Activity className="w-4 h-4 text-[#E9E1D0]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1B1C1E]">
              Curva de Suavizado (Soft Stop)
            </h3>
            <p className="text-[11px] text-[#8A7F6A]">
              Muestra cómo la velocidad baja gradualmente sin tirones bruscos.
            </p>
          </div>
        </div>

        <div>
          {isSoftStopActive ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E9E1D0] text-[#004225] border border-[#004225]/30 flex items-center gap-1 animate-pulse">
              <ShieldCheck className="w-3.5 h-3.5 text-[#004225]" />
              Frenando suavemente...
            </span>
          ) : (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E9E1D0] text-[#8A7F6A] border border-[#d8cfbe]">
              Estable
            </span>
          )}
        </div>
      </div>

      {/* Clean chart canvas with palette linen background #ede6d8 */}
      <div className="relative w-full h-[100px] bg-[#ede6d8] rounded-2xl border border-[#d8cfbe] overflow-hidden my-1">
        {/* Zero baseline */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-[#8A7F6A]/50 pointer-events-none"
          style={{ top: `${midY}px` }}
        />

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Target Left (#8A7F6A dashed) */}
          <path
            d={paths.targetL}
            fill="none"
            stroke="#8A7F6A"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          {/* Actual Left (#004225 Deep Forest Green) */}
          <path
            d={paths.actualL}
            fill="none"
            stroke="#004225"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Target Right (#8A7F6A dashed) */}
          <path
            d={paths.targetR}
            fill="none"
            stroke="#8A7F6A"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          {/* Actual Right (#2F4F3E Muted Sage Pine) */}
          <path
            d={paths.actualR}
            fill="none"
            stroke="#2F4F3E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Clean legend with palette colors */}
      <div className="flex items-center justify-between text-xs pt-2 mt-1 border-t border-[#e5dcce] text-[#1B1C1E]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#004225] inline-block" />
          <span className="font-medium text-[#1B1C1E]">Rueda Izquierda:</span>
          <span className="font-bold text-[#004225]">{motorL.dutyCyclePercent}%</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F4F3E] inline-block" />
          <span className="font-medium text-[#1B1C1E]">Rueda Derecha:</span>
          <span className="font-bold text-[#2F4F3E]">{motorR.dutyCyclePercent}%</span>
        </div>
      </div>
    </div>
  );
};
