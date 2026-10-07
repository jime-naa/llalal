import React from 'react';
import { RampConfig } from '../types/sumo';
import { Sliders, RotateCcw, Heart } from 'lucide-react';

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
    <div className="bg-white/95 rounded-3xl p-5 md:p-6 shadow-sm border border-rose-100/80">
      <div className="flex items-center justify-between border-b border-rose-50 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Sliders className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">
              Ajustes de Suavidad y Tiempos
            </h3>
            <p className="text-xs text-stone-400">
              Personaliza qué tan suave frena el robot o cuánto retrocede al ver la línea.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-full font-medium transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Soft Stop Decel Step */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-rose-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-800 font-bold">Frenado Suave (Soft Stop)</span>
            <span className="font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[11px]">
              {config.decelStep} paso
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Qué tan rápido baja a cero cuando sueltas la palanca.
          </p>
          <input
            type="range"
            min="5"
            max="50"
            step="1"
            value={config.decelStep}
            onChange={(e) => update('decelStep', Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Accel Step */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-rose-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-800 font-bold">Aceleración Inicial</span>
            <span className="font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[11px]">
              {config.accelStep} paso
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Evita que las ruedas patinen en seco al arrancar a fondo.
          </p>
          <input
            type="range"
            min="5"
            max="35"
            step="1"
            value={config.accelStep}
            onChange={(e) => update('accelStep', Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Front Escape Duration */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-rose-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-800 font-bold">Retroceso Línea Adelante</span>
            <span className="font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-[11px]">
              {config.frontEscapeDurationMs} ms
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Tiempo a -100% PWM al detectar borde adelante.
          </p>
          <input
            type="range"
            min="200"
            max="1500"
            step="50"
            value={config.frontEscapeDurationMs}
            onChange={(e) => update('frontEscapeDurationMs', Number(e.target.value))}
            className="w-full accent-pink-500 cursor-pointer"
          />
        </div>

        {/* Rear Escape Duration */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-rose-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-800 font-bold">Avance Línea Atrás</span>
            <span className="font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[11px]">
              {config.rearEscapeDurationMs} ms
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Tiempo a +100% PWM al detectar borde atrás.
          </p>
          <input
            type="range"
            min="200"
            max="1500"
            step="50"
            value={config.rearEscapeDurationMs}
            onChange={(e) => update('rearEscapeDurationMs', Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Magnetic Snap Tolerance */}
        <div className="bg-stone-50/70 p-4 rounded-2xl border border-rose-50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-stone-800 font-bold">Imán de las Muescas</span>
            <span className="font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[11px]">
              &plusmn;{config.snapTolerance}%
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mb-3">
            Zona de atracción táctil para enganchar al 50% o 100%.
          </p>
          <input
            type="range"
            min="3"
            max="12"
            step="1"
            value={config.snapTolerance}
            onChange={(e) => update('snapTolerance', Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
