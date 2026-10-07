import React, { useState, useEffect } from 'react';
import { bleManager, BleConnectionState, BLE_SERVICE_UUID, BLE_CHARACTERISTIC_UUID } from '../utils/bleManager';
import { Bluetooth, X, Check, AlertCircle, RefreshCw, Radio, Sparkles, Smartphone } from 'lucide-react';

interface BluetoothConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastCommand: string;
}

export const BluetoothConnectModal: React.FC<BluetoothConnectModalProps> = ({
  isOpen,
  onClose,
  lastCommand
}) => {
  const [bleState, setBleState] = useState<BleConnectionState>(bleManager.state);
  const isWebBleSupported = bleManager.isWebBluetoothSupported();

  useEffect(() => {
    bleManager.setOnStateChange((st) => setBleState(st));
  }, []);

  if (!isOpen) return null;

  const handleConnectReal = async () => {
    await bleManager.connectRealBle();
  };

  const handleConnectSimulated = () => {
    bleManager.connectSimulated('SumoBot_ESP32 (Simulado)');
  };

  const handleDisconnect = () => {
    bleManager.disconnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#f8f5ee] rounded-3xl border border-[#d8cfbe] shadow-2xl flex flex-col overflow-hidden text-[#1B1C1E]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5dcce] bg-[#f0ebe0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#004225] flex items-center justify-center text-[#E9E1D0] shadow-sm">
              <Bluetooth className="w-5 h-5 text-[#E9E1D0]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1B1C1E]">
                Conexión Bluetooth (ESP32 BLE)
              </h3>
              <p className="text-xs text-[#8A7F6A]">
                Enlace inalámbrico directo entre la app y el robot
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#d8cfbe] text-[#1B1C1E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Connection Status Card */}
          <div className="bg-[#ede6d8] rounded-2xl p-4 border border-[#d8cfbe] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  bleState.isConnected
                    ? 'bg-[#004225] shadow-sm shadow-[#004225] animate-pulse'
                    : bleState.isConnecting
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-stone-400'
                }`}
              />
              <div>
                <span className="text-xs font-bold text-[#1B1C1E] block">
                  {bleState.isConnected
                    ? `Conectado a ${bleState.deviceName || 'SumoBot_BLE'}`
                    : bleState.isConnecting
                    ? 'Escaneando y conectando...'
                    : 'Desconectado'}
                </span>
                <span className="text-[11px] text-[#8A7F6A]">
                  {bleState.isSimulated
                    ? 'Modo simulado activo (Pruebas en navegador)'
                    : bleState.isConnected
                    ? 'Transmisión BLE en tiempo real (GATT activa)'
                    : 'Listo para buscar tu ESP32'}
                </span>
              </div>
            </div>

            {bleState.isConnected && (
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-full bg-[#1B1C1E] hover:bg-[#2b2c30] text-[#E9E1D0] text-xs font-semibold transition-all active:scale-95"
              >
                Desconectar
              </button>
            )}
          </div>

          {/* Error notice if any */}
          {bleState.errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{bleState.errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConnectReal}
              disabled={bleState.isConnecting || bleState.isConnected}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#004225] hover:bg-[#00341c] text-[#E9E1D0] font-bold text-sm shadow-sm transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Bluetooth className="w-4 h-4 text-[#E9E1D0]" />
              <span>
                {bleState.isConnecting ? 'Buscando dispositivo...' : 'Buscar y Conectar ESP32 Real'}
              </span>
            </button>

            {!bleState.isConnected && (
              <button
                onClick={handleConnectSimulated}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-[#E9E1D0] hover:bg-[#d8cfbe] text-[#004225] font-semibold text-xs border border-[#d8cfbe] transition-all active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#004225]" />
                <span>Activar Modo Simulado (Probar sin ESP32 físico)</span>
              </button>
            )}
          </div>

          {/* Live Command Stream Preview */}
          <div className="bg-[#f0ebe0] rounded-2xl p-3.5 border border-[#d8cfbe] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2F4F3E] flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#004225]" />
                Trama Transmitida en Vivo:
              </span>
              <span className="text-[10px] font-mono text-[#8A7F6A]">Formato: L,C,R</span>
            </div>
            <div className="bg-[#1B1C1E] text-[#E9E1D0] rounded-xl px-3 py-2 font-mono text-xs flex items-center justify-between">
              <span>{lastCommand || '0,0,0'}</span>
              <span className="text-[10px] text-[#8A7F6A]">
                {bleState.isConnected ? 'ENVIADO' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* UUIDs Reference */}
          <div className="border-t border-[#e5dcce] pt-3 text-[11px] text-[#8A7F6A] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span>Service UUID:</span>
              <span className="font-mono text-[#1B1C1E]">{BLE_SERVICE_UUID}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Characteristic UUID:</span>
              <span className="font-mono text-[#1B1C1E]">{BLE_CHARACTERISTIC_UUID}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
