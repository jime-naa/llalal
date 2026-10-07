import React from 'react';
import { RampConfig } from '../types/sumo';
import { Sliders, RotateCcw } from 'lucide-react';

interface RampParametersTunerProps {
  config: RampConfig;
  onChange: (newConfig: RampConfig) => void;
  onReset: () => void;
}

export const RampParametersTuner: React.FC<RampParametersTunerProps> = ({
  config,
  onChange,
  onReset,
}) => {
  const update = (key: keyof RampConfig, val: number) => {
    onChange({ ...config, [key]: val });
  };

  return (
    <div className="bg-[#f8f5ee] rounded-3xl p-5 md:p-6 shadow-sm border border-[#d8cfbe]">
      <div className="flex items-center justify-between border-b border-[#e5dcce] pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0]">
            <Sliders className="w-5 h-5 text-[#E9E1D0]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1B1C1E]">
              Ajustes de Suavidad y Tiempos
            </h3>
            <p className="text-xs text-[#8A7F6A]">
              Personaliza qué tan suave frena el robot o cuánto retrocede al ver la línea.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-[#2F4F3E] hover:text-[#004225] bg-[#E9E1D0] hover:bg-[#d8cfbe] px-3 py-1.5 rounded-full font-semibold border border-[#d8cfbe] transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Soft Stop Decel Step */}
        <div className="bg-[#f0ebe0] p-4 rounded-2xl border border-[#d8cfbe] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#1B1C1E] font-bold">Frenado Suave (Soft Stop)</span>
            <span className="font-mono font-bold bg-[#E9E1D0] text-[#004225] px-2 py-0.5 rounded-full text-[11px] border border-[#d8cfbe]">
              {config.decelStep} paso
            </span>
          </div>
          <p className="text-[11px] text-[#8A7F6A] mb-3">
            Qué tan rápido baja a cero cuando sueltas la palanca.
          </p>
          <input
            type="range"
            min="6"
            max="60"
            step="2"
            value={config.decelStep}
            onChange={(e) => update('decelStep', Number(e.target.value))}
            className="accent-[#004225] w-full cursor-pointer"
          />
        </div>

        {/* Accel Step */}
        <div className="bg-[#f0ebe0] p-4 rounded-2xl border border-[#d8cfbe] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#1B1C1E] font-bold">Aceleración Suave (Soft Start)</span>
            <span className="font-mono font-bold bg-[#E9E1D0] text-[#004225] px-2 py-0.5 rounded-full text-[11px] border border-[#d8cfbe]">
              {config.accelStep} paso
            </span>
          </div>
          <p className="text-[11px] text-[#8A7F6A] mb-3">
            Aceleración gradual para arrancar sin patinar.
          </p>
          <input
            type="range"
            min="6"
            max="50"
            step="2"
            value={config.accelStep}
            onChange={(e) => update('accelStep', Number(e.target.value))}
            className="accent-[#004225] w-full cursor-pointer"
          />
        </div>

        {/* Front Escape Duration */}
        <div className="bg-[#f0ebe0] p-4 rounded-2xl border border-[#d8cfbe] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#1B1C1E] font-bold">Retroceso Frontal (IR)</span>
            <span className="font-mono font-bold bg-[#E9E1D0] text-[#004225] px-2 py-0.5 rounded-full text-[11px] border border-[#d8cfbe]">
              {config.frontEscapeDurationMs} ms
            </span>
          </div>
          <p className="text-[11px] text-[#8A7F6A] mb-3">
            Tiempo de marcha atrás a -100% PWM al ver borde adelante.
          </p>
          <input
            type="range"
            min="300"
            max="1500"
            step="50"
            value={config.frontEscapeDurationMs}
            onChange={(e) => update('frontEscapeDurationMs', Number(e.target.value))}
            className="accent-[#004225] w-full cursor-pointer"
          />
        </div>

        {/* Rear Escape Duration */}
        <div className="bg-[#f0ebe0] p-4 rounded-2xl border border-[#d8cfbe] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#1B1C1E] font-bold">Avance Trasero (IR)</span>
            <span className="font-mono font-bold bg-[#E9E1D0] text-[#004225] px-2 py-0.5 rounded-full text-[11px] border border-[#d8cfbe]">
              {config.rearEscapeDurationMs} ms
            </span>
          </div>
          <p className="text-[11px] text-[#8A7F6A] mb-3">
            Tiempo de empuje adelante a +100% PWM al ver borde atrás.
          </p>
          <input
            type="range"
            min="300"
            max="1500"
            step="50"
            value={config.rearEscapeDurationMs}
            onChange={(e) => update('rearEscapeDurationMs', Number(e.target.value))}
            className="accent-[#004225] w-full cursor-pointer"
          />
        </div>

        {/* Snap Tolerance */}
        <div className="bg-[#f0ebe0] p-4 rounded-2xl border border-[#d8cfbe] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#1B1C1E] font-bold">Imán de Muescas (Snap)</span>
            <span className="font-mono font-bold bg-[#E9E1D0] text-[#004225] px-2 py-0.5 rounded-full text-[11px] border border-[#d8cfbe]">
              ±{config.snapTolerance}%
            </span>
          </div>
          <p className="text-[11px] text-[#8A7F6A] mb-3">
            Tolerancia magnética para encajar en 0%, 50% y 100%.
          </p>
          <input
            type="range"
            min="2"
            max="15"
            step="1"
            value={config.snapTolerance}
            onChange={(e) => update('snapTolerance', Number(e.target.value))}
            className="accent-[#004225] w-full cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
