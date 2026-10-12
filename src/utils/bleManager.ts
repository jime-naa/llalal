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
  private isWriting = false;
  private queuedCommand: string | null = null;

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

  public isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  public isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
  }

  public async connectRealBle(acceptAll: boolean = false): Promise<boolean> {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.updateState({
        errorMessage: 'Web Bluetooth requiere una conexión HTTPS segura (o localhost). Tu navegador bloquea Bluetooth si la URL no empieza por https://.',
      });
      return false;
    }

    if (!this.isWebBluetoothSupported()) {
      if (this.isIOS()) {
        this.updateState({
          errorMessage: 'En iPhone/iPad (iOS), Safari y Chrome no soportan Web Bluetooth por restricciones de Apple. Para conectar tu ESP32, descarga la app gratuita "Bluefy - Web BLE Browser" en la App Store y abre esta web allí.',
        });
      } else {
        this.updateState({
          errorMessage: 'Este navegador no soporta Web Bluetooth API. En móvil Android usa Google Chrome. En PC usa Google Chrome o Microsoft Edge.',
        });
      }
      return false;
    }

    try {
      this.updateState({ isConnecting: true, errorMessage: undefined });

      const navBluetooth = (navigator as any).bluetooth;
      const targetService = BLE_SERVICE_UUID.toLowerCase();

      // Request device with flexible filters or acceptAllDevices
      const requestOptions: any = {
        optionalServices: [
          targetService,
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
        ]
      };

      if (acceptAll) {
        requestOptions.acceptAllDevices = true;
      } else {
        requestOptions.filters = [
          { services: [targetService] },
          { name: 'SumoBot_BLE' },
          { namePrefix: 'SumoBot' },
          { namePrefix: 'Sumo' },
          { namePrefix: 'ESP32' },
          { namePrefix: 'ESP' }
        ];
      }

      this.device = await navBluetooth.requestDevice(requestOptions);

      this.device.addEventListener('gattserverdisconnected', () => {
        this.updateState({
          isConnected: false,
          isConnecting: false,
          deviceName: null,
          isSimulated: false,
          errorMessage: 'El ESP32 se desconectó. Verifica la batería o presiona Reconectar.'
        });
      });

      // Connect GATT server with retry
      let gattServer: any = null;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          gattServer = await this.device.gatt.connect();
          break;
        } catch (connErr) {
          if (attempt === 2) throw connErr;
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
      this.server = gattServer;

      // Discover primary service
      let service: any;
      try {
        service = await this.server.getPrimaryService(targetService);
      } catch {
        try {
          const services = await this.server.getPrimaryServices();
          service = services.find((s: any) => s.uuid.toLowerCase() === targetService) || services[0];
        } catch {
          // ignore
        }
      }

      if (!service) {
        throw new Error('No se encontró el servicio BLE en el ESP32. Verifica que el firmware esté corriendo en el microcontrolador.');
      }

      // Discover characteristic
      const targetChar = BLE_CHARACTERISTIC_UUID.toLowerCase();
      try {
        this.characteristic = await service.getCharacteristic(targetChar);
      } catch {
        try {
          const chars = await service.getCharacteristics();
          this.characteristic =
            chars.find((c: any) => c.uuid.toLowerCase() === targetChar) ||
            chars.find((c: any) => c.properties && (c.properties.write || c.properties.writeWithoutResponse)) ||
            chars[0];
        } catch {
          // ignore
        }
      }

      if (!this.characteristic) {
        throw new Error('Característica de escritura BLE no encontrada en el ESP32.');
      }

      this.updateState({
        isConnected: true,
        isConnecting: false,
        deviceName: this.device.name || 'SumoBot_BLE',
        isSimulated: false,
        errorMessage: undefined
      });

      return true;
    } catch (err: any) {
      console.warn('Bluetooth connection error or cancelled:', err);
      let msg = err.message || 'Conexión cancelada o fallida.';
      if (err.name === 'NotFoundError') {
        msg = 'No se encontró el ESP32. En Android, asegúrate de encender Bluetooth y también Ubicación (GPS) en la barra de ajustes rápidos.';
      } else if (err.name === 'SecurityError') {
        msg = 'Permiso de Bluetooth denegado. Concede permiso a Chrome para buscar dispositivos cercanos.';
      } else if (err.name === 'NetworkError') {
        msg = 'Error de enlace GATT con el ESP32. Pulsa el botón EN/RST en tu ESP32 e inténtalo de nuevo.';
      }

      this.updateState({
        isConnecting: false,
        errorMessage: msg
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
    }, 250);
  }

  public disconnect() {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // ignore
      }
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isWriting = false;
    this.queuedCommand = null;

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

    if (this.isWriting) {
      // Keep only the latest command in queue to prevent backpressure
      this.queuedCommand = cmd;
      return true;
    }

    this.isWriting = true;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(cmd.endsWith('\n') ? cmd : cmd + '\n');
      try {
        await this.characteristic.writeValueWithoutResponse(data);
      } catch {
        await this.characteristic.writeValue(data);
      }
    } catch (err) {
      console.warn('BLE transmission error:', err);
    } finally {
      this.isWriting = false;
      if (this.queuedCommand !== null) {
        const nextCmd = this.queuedCommand;
        this.queuedCommand = null;
        this.sendCommand(nextCmd);
      }
    }

    return true;
  }
}

export const bleManager = new BleManager();
