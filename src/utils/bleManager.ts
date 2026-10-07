/**
 * Web Bluetooth API Manager for ESP32 BLE SumoBot
 * Service UUID: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
 * Characteristic UUID: beb5483e-36e1-4688-b7f5-ea07361b26a8
 */

export const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const BLE_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export interface BleConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  deviceName: string | null;
  rssi?: number;
  isSimulated: boolean;
  lastSentCommand?: string;
  errorMessage?: string;
}

class BleManager {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private onStateChangeCallback: ((state: BleConnectionState) => void) | null = null;

  public state: BleConnectionState = {
    isConnected: false,
    isConnecting: false,
    deviceName: null,
    isSimulated: false,
  };

  public setOnStateChange(cb: (state: BleConnectionState) => void) {
    this.onStateChangeCallback = cb;
  }

  private updateState(partial: Partial<BleConnectionState>) {
    this.state = { ...this.state, ...partial };
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.state);
    }
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public async connectRealBle(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      this.updateState({
        errorMessage: 'Este navegador no soporta Web Bluetooth API. Puedes usar el modo simulado o abrir en Chrome/Edge.',
      });
      return false;
    }

    try {
      this.updateState({ isConnecting: true, errorMessage: undefined });

      const navBluetooth = (navigator as any).bluetooth;

      // Request device by name prefix or service
      this.device = await navBluetooth.requestDevice({
        filters: [
          { namePrefix: 'SumoBot' },
          { name: 'SumoBot_BLE' }
        ],
        optionalServices: [BLE_SERVICE_UUID]
      });

      this.device.addEventListener('gattserverdisconnected', () => {
        this.updateState({
          isConnected: false,
          isConnecting: false,
          deviceName: null,
          isSimulated: false
        });
      });

      // Connect GATT
      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(BLE_SERVICE_UUID);
      this.characteristic = await service.getCharacteristic(BLE_CHARACTERISTIC_UUID);

      this.updateState({
        isConnected: true,
        isConnecting: false,
        deviceName: this.device.name || 'SumoBot_BLE',
        isSimulated: false
      });

      return true;
    } catch (err: any) {
      console.warn('Bluetooth connection error or cancelled:', err);
      this.updateState({
        isConnecting: false,
        errorMessage: err.message || 'Conexión cancelada o fallida.'
      });
      return false;
    }
  }

  public connectSimulated(name: string = 'ESP32_SumoBot_Sim') {
    this.updateState({ isConnecting: true, errorMessage: undefined });
    setTimeout(() => {
      this.updateState({
        isConnected: true,
        isConnecting: false,
        deviceName: name,
        isSimulated: true,
        rssi: -58
      });
    }, 400);
  }

  public disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try {
        this.device.gatt.disconnect();
      } catch (e) {
        // ignore
      }
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;

    this.updateState({
      isConnected: false,
      isConnecting: false,
      deviceName: null,
      isSimulated: false
    });
  }

  public async sendCommand(cmd: string): Promise<boolean> {
    this.updateState({ lastSentCommand: cmd });

    if (this.state.isSimulated) {
      return true;
    }

    if (!this.state.isConnected || !this.characteristic) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(cmd.endsWith('\n') ? cmd : cmd + '\n');
      await this.characteristic.writeValueWithoutResponse(data);
      return true;
    } catch (err) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(cmd.endsWith('\n') ? cmd : cmd + '\n');
        await this.characteristic.writeValue(data);
        return true;
      } catch (err2) {
        console.error('Error sending BLE command:', err2);
        return false;
      }
    }
  }
}

export const bleManager = new BleManager();
