import React, { useState } from 'react';
import { generateCppFirmware } from '../utils/firmwareGenerator';
import { RampConfig } from '../types/sumo';
import { Code2, Copy, Check, Download, Heart, Sparkles, BookOpen } from 'lucide-react';

interface FirmwareViewerProps {
  config: RampConfig;
}

export const FirmwareViewer: React.FC<FirmwareViewerProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<'ino' | 'motor' | 'escape' | 'config' | 'protocol'>('ino');
  const [copied, setCopied] = useState(false);

  const firmware = generateCppFirmware(config);

  const fileMap = {
    ino: { name: 'SumoBot_ESP32_BLE.ino', code: firmware.mainIno, title: 'Programa Principal (BLE)' },
    motor: { name: 'MotorControl.h', code: firmware.motorControlH, title: 'Control de Motores y Rampas' },
    escape: { name: 'SafetyEscape.h', code: firmware.safetyEscapeH, title: 'Salvaguarda de Línea (IR)' },
    config: { name: 'Config.h', code: firmware.configH, title: 'Configuración y UUIDs BLE' },
    protocol: { name: 'BleParser.h', code: firmware.bleParserH, title: 'Parseador BLE de 3 Palancas' },
  };

  const currentFile = fileMap[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const combined = `// ==========================================================================\n// SUMOBOT ESP32 BLE FIRMWARE\n// ==========================================================================\n\n` +
      `// --- ARCHIVO: Config.h ---\n${firmware.configH}\n\n` +
      `// --- ARCHIVO: BleParser.h ---\n${firmware.bleParserH}\n\n` +
      `// --- ARCHIVO: MotorControl.h ---\n${firmware.motorControlH}\n\n` +
      `// --- ARCHIVO: SafetyEscape.h ---\n${firmware.safetyEscapeH}\n\n` +
      `// --- ARCHIVO: SumoBot_ESP32_BLE.ino ---\n${firmware.mainIno}\n`;

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SumoBot_ESP32_BLE.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/95 rounded-3xl p-5 md:p-6 shadow-sm border border-rose-100/80 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Code2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-800">
              Código Fuente C++ para tu ESP32
            </h3>
            <p className="text-xs text-stone-400">
              Listo para compilar en Arduino IDE, sin bloqueos y con frenado suave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition-all shadow-sm shadow-pink-200 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Archivo (.ino)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar este archivo'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(Object.keys(fileMap) as Array<keyof typeof fileMap>).map((key) => {
          const item = fileMap[key];
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-rose-100 text-rose-700 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      {/* Code Editor Box */}
      <div className="rounded-2xl border border-stone-200 bg-[#1e212b] text-stone-100 font-mono text-xs overflow-hidden shadow-inner">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#171922] border-b border-stone-700/60 text-[11px] text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 font-sans font-medium text-stone-300">
              {currentFile.title} ({currentFile.name})
            </span>
          </div>
          <span className="text-[10px] text-stone-500">C++ / Arduino</span>
        </div>

        <pre className="p-4 text-stone-300 overflow-x-auto max-h-[380px] leading-relaxed selection:bg-rose-500/40">
          <code>{currentFile.code}</code>
        </pre>
      </div>

      {/* Gentle, thoughtful explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-2">
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-1">
            <Sparkles className="w-4 h-4" />
            <span>1. Palancas y Prioridad</span>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            La palanca central se pausa automáticamente en cuanto tocas una palanca lateral, evitando que choquen comandos entre ir recto y girar.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs mb-1">
            <Heart className="w-4 h-4" />
            <span>2. Frenado Suave (Soft Stop)</span>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            Al soltar la palanca a cero, el motor no se clava de golpe; desacelera suavemente para proteger los piñones y engranes metálicos.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
            <BookOpen className="w-4 h-4" />
            <span>3. Salva-Vidas del Dohyo</span>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed">
            Si el sensor ve la línea blanca, el robot reacciona al instante sin colgarse (<code className="font-mono text-amber-800">sin delay()</code>), retrocede y gira hacia el centro.
          </p>
        </div>
      </div>
    </div>
  );
};
