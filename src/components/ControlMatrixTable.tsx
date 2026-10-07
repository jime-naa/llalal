import React, { useState } from 'react';
import { Table, Copy, Check, Heart } from 'lucide-react';

export const ControlMatrixTable: React.FC = () => {
  const [filterMode, setFilterMode] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const filteredData = [
    {
      mode: 'Crucero Suave',
      action: 'Avance recto al 50%',
      leverL: '0%',
      leverC: '+50% (Muesca)',
      leverR: '0%',
      motorL: '+50% (Adelante)',
      motorR: '+50% (Adelante)',
      description: 'Acercamiento tranquilo sin patinar las ruedas.',
      type: 'cruise'
    },
    {
      mode: 'Crucero Total',
      action: 'Ataque frontal al 100%',
      leverL: '0%',
      leverC: '+100% (Muesca)',
      leverR: '0%',
      motorL: '+100% (Adelante)',
      motorR: '+100% (Adelante)',
      description: 'Máxima fuerza de empuje para sacar al rival del dohyo.',
      type: 'cruise'
    },
    {
      mode: 'Crucero Reversa',
      action: 'Retroceso recto al 50%',
      leverL: '0%',
      leverC: '-50% (Muesca)',
      leverR: '0%',
      motorL: '-50% (Atrás)',
      motorR: '-50% (Atrás)',
      description: 'Retirada limpia manteniendo la dirección frontal.',
      type: 'cruise'
    },
    {
      mode: 'Giro Rápido Izq',
      action: 'Rotación sobre su eje (360°)',
      leverL: '-100%',
      leverC: 'En pausa',
      leverR: '+100%',
      motorL: '-100% (Atrás)',
      motorR: '+100% (Adelante)',
      description: 'Rueda izquierda marcha atrás y derecha adelante.',
      type: 'override'
    },
    {
      mode: 'Giro Rápido Der',
      action: 'Rotación sobre su eje (360°)',
      leverL: '+100%',
      leverC: 'En pausa',
      leverR: '-100%',
      motorL: '+100% (Adelante)',
      motorR: '-100% (Atrás)',
      description: 'Rueda izquierda adelante y derecha marcha atrás.',
      type: 'override'
    },
    {
      mode: 'Curva en Carrera',
      action: 'Viraje suave hacia la derecha',
      leverL: '+100%',
      leverC: 'En pausa',
      leverR: '+40%',
      motorL: '+100% (Adelante)',
      motorR: '+40% (Adelante)',
      description: 'Permite rodear al contrincante sin detener el avance.',
      type: 'override'
    },
    {
      mode: 'Soltar Palancas',
      action: 'Resorte virtual a cero',
      leverL: '0%',
      leverC: '0%',
      leverR: '0%',
      motorL: 'Frenado suave (Soft Stop)',
      motorR: 'Frenado suave (Soft Stop)',
      description: 'Baja progresivamente la potencia para no dañar los engranes.',
      type: 'stop'
    },
    {
      mode: 'Emergencia Borde',
      action: 'Sensor IR detecta línea blanca',
      leverL: 'Bloqueada',
      leverC: 'Bloqueada',
      leverR: 'Bloqueada',
      motorL: 'Freno dinámico -> Reversa -> Giro',
      motorR: 'Freno dinámico -> Reversa -> Giro',
      description: 'Ignora la app al instante, frena, da marcha atrás y gira al centro.',
      type: 'emergency'
    },
  ].filter((row) => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'CRUISE') return row.type === 'cruise';
    if (filterMode === 'OVERRIDE') return row.type === 'override';
    if (filterMode === 'EMERGENCY') return row.type === 'emergency' || row.type === 'stop';
    return true;
  });

  const copyAsMarkdown = () => {
    let md = '| Modo | Acción | Palanca L | Palanca Central | Palanca R | Motor Izquierdo | Motor Derecho | Explicación |\n';
    md += '|---|---|---|---|---|---|---|---|\n';
    filteredData.forEach((r) => {
      md += `| ${r.mode} | ${r.action} | ${r.leverL} | ${r.leverC} | ${r.leverR} | ${r.motorL} | ${r.motorR} | ${r.description} |\n`;
    });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/95 rounded-3xl p-5 md:p-6 shadow-sm border border-rose-100/80">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-50 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Heart className="w-5 h-5 fill-rose-300 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">
              Matriz de Control y Comportamiento
            </h3>
            <p className="text-xs text-stone-400">
              Guía clara de qué hace el robot según cómo muevas cada palanca.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Friendly filters */}
          <div className="flex items-center bg-stone-100 p-1 rounded-full text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterMode('CRUISE')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'CRUISE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Línea Recta
            </button>
            <button
              onClick={() => setFilterMode('OVERRIDE')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'OVERRIDE' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Giros Laterales
            </button>
            <button
              onClick={() => setFilterMode('EMERGENCY')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'EMERGENCY' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Emergencia & Parada
            </button>
          </div>

          <button
            onClick={copyAsMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200/60 transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar tabla'}</span>
          </button>
        </div>
      </div>

      {/* Clean table */}
      <div className="overflow-x-auto rounded-2xl border border-rose-50">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50/80 text-stone-500 border-b border-rose-50 uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="px-4 py-3">Modo</th>
              <th className="px-3 py-3">Palanca L</th>
              <th className="px-3 py-3">Palanca Central</th>
              <th className="px-3 py-3">Palanca R</th>
              <th className="px-4 py-3">Motor Izquierdo</th>
              <th className="px-4 py-3">Motor Derecho</th>
              <th className="px-4 py-3">¿Qué hace el robot?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-50/60 bg-white">
            {filteredData.map((row, idx) => {
              const isEmerg = row.type === 'emergency';
              const isOver = row.type === 'override';
              return (
                <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-stone-800 whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        isEmerg
                          ? 'bg-rose-100 text-rose-700'
                          : isOver
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.mode}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-rose-600 whitespace-nowrap">{row.leverL}</td>
                  <td className="px-3 py-3 font-medium text-purple-600 whitespace-nowrap">{row.leverC}</td>
                  <td className="px-3 py-3 font-medium text-rose-600 whitespace-nowrap">{row.leverR}</td>
                  <td className="px-4 py-3 text-stone-700 font-medium whitespace-nowrap">{row.motorL}</td>
                  <td className="px-4 py-3 text-stone-700 font-medium whitespace-nowrap">{row.motorR}</td>
                  <td className="px-4 py-3 text-stone-500 min-w-[220px]">{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
