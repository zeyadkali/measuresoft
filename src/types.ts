export type LauncherMode = 'topspin' | 'backspin' | 'counter';

export interface SliderLimit {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface AppConfig {
  topspin: {
    spin: SliderLimit;
    speed: SliderLimit;
  };
  backspin: {
    spin: SliderLimit;
    speed: SliderLimit;
  };
  counter: {
    speed: SliderLimit;
  };
  common: {
    elevation: SliderLimit;
    oscillation: SliderLimit;
    interval: SliderLimit;
  };
}

export interface LauncherSettings {
  activeMode: LauncherMode;
  topspin: {
    spin: number;
    speed: number;
  };
  backspin: {
    spin: number;
    speed: number;
  };
  counter: {
    speed: number;
  };
  elevation: number;
  oscillation: number;
  interval: number;
}

export interface Preset {
  id: string;
  name: string;
  mode: LauncherMode;
  speed: number;
  spin?: number;
  elevation: number;
  oscillation: number;
  interval: number;
  createdAt: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface ConnectionConfig {
  method: 'bluetooth' | 'wifi' | 'simulated';
  wifiHost: string;
  wifiPort: number;
  deviceName: string;
}

export interface MachineTelemetry {
  lastPacketSent: string;
  lastSentTime: number | null;
  ballsLaunched: number;
  batteryLevel: number;
  firmwareVersion: string;
}
