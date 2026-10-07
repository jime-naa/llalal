import React, { useState } from 'react';
import { generateCppFirmware } from '../utils/firmwareGenerator';
import { RampConfig } from '../types/sumo';
import { Code2, Copy, Check, Download } from 'lucide-react';

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
    <div className="bg-[#f8f5ee] rounded-3xl p-5 md:p-6 shadow-sm border border-[#d8cfbe] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5dcce] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0]">
            <Code2 className="w-5 h-5 text-[#E9E1D0]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1B1C1E]">
              Código Fuente C++ para tu ESP32
            </h3>
            <p className="text-xs text-[#8A7F6A]">
              Listo para compilar en Arduino IDE, sin bloqueos y con frenado suave.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#004225] hover:bg-[#00341c] text-[#E9E1D0] text-xs font-semibold transition-all shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Archivo (.ino)</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#004225] text-xs font-semibold border border-[#d8cfbe] transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#004225]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar archivo actual'}</span>
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5dcce] pb-3">
        {Object.entries(fileMap).map(([key, file]) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#004225] text-[#E9E1D0] shadow-xs'
                  : 'bg-[#E9E1D0] text-[#2F4F3E] hover:text-[#004225] hover:bg-[#d8cfbe]'
              }`}
            >
              <span>{file.name}</span>
            </button>
          );
        })}
      </div>

      {/* Code Editor Preview */}
      <div className="rounded-2xl border border-[#333] bg-[#1B1C1E] text-[#E9E1D0] font-mono text-xs overflow-hidden shadow-inner">
        <div className="flex items-center justify-between px-4 py-2 bg-[#141517] border-b border-stone-800 text-[11px] text-[#8A7F6A]">
          <span>{currentFile.title}</span>
          <span>{currentFile.name}</span>
        </div>
        <pre className="p-4 overflow-x-auto max-h-[500px] leading-relaxed selection:bg-[#004225]/60 text-stone-200">
          <code>{currentFile.code}</code>
        </pre>
      </div>
    </div>
  );
};
