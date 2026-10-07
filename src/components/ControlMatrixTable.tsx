import React, { useState } from 'react';
import { Table, Copy, Check, ShieldCheck } from 'lucide-react';

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
      description: 'Retirada limpia manteniendo la orientación frontal.',
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
      mode: 'Giro 90° Izq',
      action: '1 Toque Calibrado (260ms)',
      leverL: 'Auto',
      leverC: 'En pausa',
      leverR: 'Auto',
      motorL: '-86% (Atrás)',
      motorR: '+86% (Adelante)',
      description: 'Giro de precisión de 90° hacia la izquierda de un solo uso.',
      type: 'turn90'
    },
    {
      mode: 'Giro 90° Der',
      action: '1 Toque Calibrado (260ms)',
      leverL: 'Auto',
      leverC: 'En pausa',
      leverR: 'Auto',
      motorL: '+86% (Adelante)',
      motorR: '-86% (Atrás)',
      description: 'Giro de precisión de 90° hacia la derecha de un solo uso.',
      type: 'turn90'
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
      motorL: 'Contraataque forzado (800ms)',
      motorR: 'Contraataque forzado (800ms)',
      description: 'Ignora la app al instante, frena y recupera el centro con millis().',
      type: 'emergency'
    },
  ].filter((row) => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'CRUISE') return row.type === 'cruise';
    if (filterMode === 'OVERRIDE') return row.type === 'override' || row.type === 'turn90';
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
    <div className="bg-[#f8f5ee] rounded-3xl p-5 md:p-6 shadow-sm border border-[#d8cfbe]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dcce] pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0]">
            <ShieldCheck className="w-5 h-5 text-[#E9E1D0]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1B1C1E]">
              Matriz de Control y Comportamiento
            </h3>
            <p className="text-xs text-[#8A7F6A]">
              Guía clara de qué hace el robot según cómo muevas cada palanca o botón.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-[#E9E1D0] p-1 rounded-full text-xs border border-[#d8cfbe]">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'ALL' ? 'bg-[#004225] text-[#E9E1D0] shadow-xs' : 'text-[#2F4F3E] hover:text-[#004225]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterMode('CRUISE')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'CRUISE' ? 'bg-[#004225] text-[#E9E1D0] shadow-xs' : 'text-[#2F4F3E] hover:text-[#004225]'
              }`}
            >
              Línea Recta
            </button>
            <button
              onClick={() => setFilterMode('OVERRIDE')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'OVERRIDE' ? 'bg-[#004225] text-[#E9E1D0] shadow-xs' : 'text-[#2F4F3E] hover:text-[#004225]'
              }`}
            >
              Giros
            </button>
            <button
              onClick={() => setFilterMode('EMERGENCY')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                filterMode === 'EMERGENCY' ? 'bg-[#004225] text-[#E9E1D0] shadow-xs' : 'text-[#2F4F3E] hover:text-[#004225]'
              }`}
            >
              Emergencia
            </button>
          </div>

          <button
            onClick={copyAsMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#004225] text-xs font-semibold border border-[#d8cfbe] transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#004225]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar tabla'}</span>
          </button>
        </div>
      </div>

      {/* Clean table */}
      <div className="overflow-x-auto rounded-2xl border border-[#d8cfbe]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#ede6d8] text-[#1B1C1E] border-b border-[#d8cfbe] uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-4 py-3">Modo</th>
              <th className="px-3 py-3">Palanca L</th>
              <th className="px-3 py-3">Palanca Central</th>
              <th className="px-3 py-3">Palanca R</th>
              <th className="px-4 py-3">Motor Izquierdo</th>
              <th className="px-4 py-3">Motor Derecho</th>
              <th className="px-4 py-3">Comportamiento en Dohyo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5dcce] bg-[#f8f5ee]">
            {filteredData.map((row, idx) => {
              const isEmerg = row.type === 'emergency';
              const isTurn = row.type === 'turn90';
              return (
                <tr key={idx} className="hover:bg-[#f0ebe0] transition-colors">
                  <td className="px-4 py-3 font-semibold text-[#1B1C1E] whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isEmerg
                          ? 'bg-rose-100 text-rose-800'
                          : isTurn
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#E9E1D0] text-[#004225]'
                      }`}
                    >
                      {row.mode}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[#004225] whitespace-nowrap">{row.leverL}</td>
                  <td className="px-3 py-3 font-mono text-[#2F4F3E] whitespace-nowrap">{row.leverC}</td>
                  <td className="px-3 py-3 font-mono text-[#004225] whitespace-nowrap">{row.leverR}</td>
                  <td className="px-4 py-3 font-semibold text-[#1B1C1E] whitespace-nowrap">{row.motorL}</td>
                  <td className="px-4 py-3 font-semibold text-[#1B1C1E] whitespace-nowrap">{row.motorR}</td>
                  <td className="px-4 py-3 text-[#8A7F6A] min-w-[220px]">{row.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
