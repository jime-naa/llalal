import React, { useState } from 'react';
import { generateCppFirmware } from '../utils/firmwareGenerator';
import { RampConfig } from '../types/sumo';
import { X, Copy, Check, Download, Table, Code2 } from 'lucide-react';

interface HBridgeMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RampConfig;
}

export const H_BRIDGE_MAPPING_ROWS = [
  {
    maneuver: 'Avance Recto 100% (Crucero)',
    in1: 'HIGH (1)', in2: 'LOW (0)',
    in3: 'HIGH (1)', in4: 'LOW (0)',
    pwmL: '255 (100%)', pwmR: '255 (100%)',
    motionL: 'Adelante', motionR: 'Adelante',
    result: 'Embestida frontal a máximo torque en línea recta'
  },
  {
    maneuver: 'Avance Tranquilo 50% (Muesca)',
    in1: 'HIGH (1)', in2: 'LOW (0)',
    in3: 'HIGH (1)', in4: 'LOW (0)',
    pwmL: '128 (50%)', pwmR: '128 (50%)',
    motionL: 'Adelante', motionR: 'Adelante',
    result: 'Aproximación controlada sin patinamiento de ruedas'
  },
  {
    maneuver: 'Retroceso Táctico 50% (Muesca)',
    in1: 'LOW (0)', in2: 'HIGH (1)',
    in3: 'LOW (0)', in4: 'HIGH (1)',
    pwmL: '128 (50%)', pwmR: '128 (50%)',
    motionL: 'Atrás', motionR: 'Atrás',
    result: 'Retirada suave manteniendo orientación frontal'
  },
  {
    maneuver: 'Giro Rápido Izquierda (Spin Turn)',
    in1: 'LOW (0)', in2: 'HIGH (1)',
    in3: 'HIGH (1)', in4: 'LOW (0)',
    pwmL: '255 (100%)', pwmR: '255 (100%)',
    motionL: 'Atrás (-100%)', motionR: 'Adelante (+100%)',
    result: 'Rotación rápida 360° sobre el centro del robot (antihorario)'
  },
  {
    maneuver: 'Giro Rápido Derecha (Spin Turn)',
    in1: 'HIGH (1)', in2: 'LOW (0)',
    in3: 'LOW (0)', in4: 'HIGH (1)',
    pwmL: '255 (100%)', pwmR: '255 (100%)',
    motionL: 'Adelante (+100%)', motionR: 'Atrás (-100%)',
    result: 'Rotación rápida 360° sobre el centro del robot (horario)'
  },
  {
    maneuver: 'EMERGENCIA IR ADELANTE (800ms)',
    in1: 'LOW (0)', in2: 'HIGH (1)',
    in3: 'LOW (0)', in4: 'HIGH (1)',
    pwmL: '255 (100%)', pwmR: '255 (100%)',
    motionL: 'Atrás (-100%)', motionR: 'Atrás (-100%)',
    result: '¡Línea detectada al frente! Fuerza máxima atrás para salir del borde'
  },
  {
    maneuver: 'EMERGENCIA IR ATRÁS (800ms)',
    in1: 'HIGH (1)', in2: 'LOW (0)',
    in3: 'HIGH (1)', in4: 'LOW (0)',
    pwmL: '255 (100%)', pwmR: '255 (100%)',
    motionL: 'Adelante (+100%)', motionR: 'Adelante (+100%)',
    result: '¡Línea detectada atrás! Fuerza máxima adelante para recuperar el centro'
  },
  {
    maneuver: 'Frenado Dinámico Activo (Hard Brake)',
    in1: 'HIGH (1)', in2: 'HIGH (1)',
    in3: 'HIGH (1)', in4: 'HIGH (1)',
    pwmL: '255', pwmR: '255',
    motionL: 'Freno', motionR: 'Freno',
    result: 'Cortocircuito de devanados: detención instantánea contra inercia'
  },
  {
    maneuver: 'Soft Stop / Reposo (Palancas sueltas)',
    in1: 'LOW (0)', in2: 'LOW (0)',
    in3: 'LOW (0)', in4: 'LOW (0)',
    pwmL: 'Rampa -> 0', pwmR: 'Rampa -> 0',
    motionL: 'Desaceleración', motionR: 'Desaceleración',
    result: 'Descenso suave del duty cycle para proteger engranes y evitar back-EMF'
  }
];

export const HBridgeMappingModal: React.FC<HBridgeMappingModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'code'>('table');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const firmware = generateCppFirmware(config);

  const fullCode = `// ==========================================================================\n` +
    `// SUMOBOT ESP32 - FIRMWARE CON FSM DE CONTRAATAQUE (MILLIS) & PUENTE H\n` +
    `// ==========================================================================\n\n` +
    `// --- ARCHIVO: Config.h ---\n${firmware.configH}\n\n` +
    `// --- ARCHIVO: MotorControl.h (Rampas Soft Stop) ---\n${firmware.motorControlH}\n\n` +
    `// --- ARCHIVO: SafetyEscape.h (FSM Infrarroja sin delay) ---\n${firmware.safetyEscapeH}\n\n` +
    `// --- ARCHIVO: BleParser.h (Parseo de std::string de 3 palancas) ---\n${firmware.bleParserH}\n\n` +
    `// --- ARCHIVO: SumoBot_ESP32_BLE.ino ---\n${firmware.mainIno}\n`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([fullCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SumoBot_ESP32_Firmware.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#f8f5ee] rounded-3xl border border-[#d8cfbe] shadow-2xl flex flex-col overflow-hidden text-[#1B1C1E]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5dcce] bg-[#f0ebe0]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#E9E1D0] p-1 rounded-full border border-[#d8cfbe]">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'table'
                    ? 'bg-[#004225] text-[#E9E1D0] shadow-xs'
                    : 'text-[#2F4F3E] hover:text-[#004225]'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Mapeo Puente H</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'code'
                    ? 'bg-[#004225] text-[#E9E1D0] shadow-xs'
                    : 'text-[#2F4F3E] hover:text-[#004225]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Código C++ (ESP32)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'code' && (
              <>
                <button
                  onClick={handleDownloadCode}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#004225] hover:bg-[#00341c] text-[#E9E1D0] transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .ino</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#1B1C1E] border border-[#d8cfbe] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#004225]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#d8cfbe] text-[#1B1C1E] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'table' ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1B1C1E]">
                    Tabla de Mapeo de Estados para el Driver de Motores (Puente H)
                  </h3>
                  <p className="text-xs text-[#8A7F6A]">
                    Lógica digital de pines (IN1..IN4) y modulación PWM para cada maniobra del robot de sumo.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#d8cfbe]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#ede6d8] text-[#1B1C1E] border-b border-[#d8cfbe] font-bold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-3">Maniobra</th>
                      <th className="px-2.5 py-3 text-center">IN1</th>
                      <th className="px-2.5 py-3 text-center">IN2</th>
                      <th className="px-2.5 py-3 text-center">IN3</th>
                      <th className="px-2.5 py-3 text-center">IN4</th>
                      <th className="px-3 py-3">PWM L / R</th>
                      <th className="px-3.5 py-3">Sentidos</th>
                      <th className="px-4 py-3">Comportamiento en Dohyo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5dcce] bg-[#f8f5ee]">
                    {H_BRIDGE_MAPPING_ROWS.map((row, idx) => {
                      const isEmergency = row.maneuver.includes('EMERGENCIA');
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-[#f0ebe0] transition-colors ${
                            isEmergency ? 'bg-[#004225]/5 font-semibold' : ''
                          }`}
                        >
                          <td className="px-3.5 py-2.5 font-bold text-[#1B1C1E] whitespace-nowrap">
                            {row.maneuver}
                          </td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-[#004225] font-bold">{row.in1}</td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-[#004225] font-bold">{row.in2}</td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-[#2F4F3E] font-bold">{row.in3}</td>
                          <td className="px-2.5 py-2.5 text-center font-mono text-[#2F4F3E] font-bold">{row.in4}</td>
                          <td className="px-3 py-2.5 font-mono whitespace-nowrap text-[#1B1C1E]">{row.pwmL}</td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap text-[#8A7F6A]">
                            <span className="text-[#004225] font-semibold">L: {row.motionL}</span> | <span className="text-[#2F4F3E] font-semibold">R: {row.motionR}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-[#8A7F6A] min-w-[240px]">
                            {row.result}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1C1E]">
                    Firmware C++ Estructurado para ESP32 / Arduino (Listo para compilar)
                  </h3>
                  <p className="text-xs text-[#8A7F6A]">
                    Incluye la máquina de estados con millis(), contraataque por sensor ADELANTE y ATRÁS, y rampas Soft Stop.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#333] bg-[#1B1C1E] text-[#E9E1D0] font-mono text-xs overflow-hidden shadow-inner">
                <pre className="p-4 overflow-x-auto max-h-[58vh] leading-relaxed selection:bg-[#004225]/60 text-stone-200">
                  <code>{fullCode}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
