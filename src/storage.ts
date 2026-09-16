import { AppConfig, LauncherSettings, Preset, ConnectionConfig } from './types.ts';

export const DEFAULT_CONFIG: AppConfig = {
  topspin: {
    spin: { min: 1, max: 10, step: 1, unit: 'lvl' },
    speed: { min: 20, max: 120, step: 5, unit: 'km/h' },
  },
  backspin: {
    spin: { min: 1, max: 8, step: 1, unit: 'lvl' },
    speed: { min: 15, max: 90, step: 5, unit: 'km/h' },
  },
  counter: {
    speed: { min: 25, max: 110, step: 5, unit: 'km/h' },
  },
  common: {
    elevation: { min: -10, max: 35, step: 1, unit: '°' },
    oscillation: { min: -40, max: 40, step: 5, unit: '°' },
    interval: { min: 0.8, max: 4.0, step: 0.1, unit: 's' },
  },
};

export const DEFAULT_LAUNCHER_SETTINGS: LauncherSettings = {
  activeMode: 'topspin',
  topspin: {
    spin: 5,
    speed: 65,
  },
  backspin: {
    spin: 4,
    speed: 40,
  },
  counter: {
    speed: 70,
  },
  elevation: 10,
  oscillation: 0,
  interval: 1.8,
};

export const INITIAL_PRESETS: Preset[] = [
  {
    id: 'p1',
    name: 'Forehand Topspin Loop',
    mode: 'topspin',
    spin: 6,
    speed: 70,
    elevation: 12,
    oscillation: 15,
    interval: 1.8,
    createdAt: 1710000000000,
  },
  {
    id: 'p2',
    name: 'Backspin Chop Return',
    mode: 'backspin',
    spin: 5,
    speed: 35,
    elevation: 8,
    oscillation: -10,
    interval: 2.2,
    createdAt: 1710000100000,
  },
  {
    id: 'p3',
    name: 'Fast Counter Block',
    mode: 'counter',
    speed: 80,
    elevation: 14,
    oscillation: 0,
    interval: 1.4,
    createdAt: 1710000200000,
  },
];

export const DEFAULT_CONNECTION: ConnectionConfig = {
  method: 'simulated',
  wifiHost: '192.168.4.1',
  wifiPort: 80,
  deviceName: 'ESP32_TT_Launcher',
};

const STORAGE_KEYS = {
  CONFIG: 'tt_cfg',
  SETTINGS: 'tt_set',
  PRESETS: 'tt_pre',
  CONNECTION: 'tt_con',
};

export function loadStoredConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      topspin: {
        spin: { ...DEFAULT_CONFIG.topspin.spin, ...parsed?.topspin?.spin },
        speed: { ...DEFAULT_CONFIG.topspin.speed, ...parsed?.topspin?.speed },
      },
      backspin: {
        spin: { ...DEFAULT_CONFIG.backspin.spin, ...parsed?.backspin?.spin },
        speed: { ...DEFAULT_CONFIG.backspin.speed, ...parsed?.backspin?.speed },
      },
      counter: {
        speed: { ...DEFAULT_CONFIG.counter.speed, ...parsed?.counter?.speed },
      },
      common: {
        elevation: { ...DEFAULT_CONFIG.common.elevation, ...parsed?.common?.elevation },
        oscillation: { ...DEFAULT_CONFIG.common.oscillation, ...parsed?.common?.oscillation },
        interval: { ...DEFAULT_CONFIG.common.interval, ...parsed?.common?.interval },
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveStoredConfig(config: AppConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch {}
}

export function loadStoredSettings(): LauncherSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_LAUNCHER_SETTINGS;
    return { ...DEFAULT_LAUNCHER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LAUNCHER_SETTINGS;
  }
}

export function saveStoredSettings(settings: LauncherSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {}
}

export function loadStoredPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!raw) return INITIAL_PRESETS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRESETS;
  }
}

export function saveStoredPresets(presets: Preset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  } catch {}
}

export function loadConnectionConfig(): ConnectionConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONNECTION);
    if (!raw) return DEFAULT_CONNECTION;
    return { ...DEFAULT_CONNECTION, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONNECTION;
  }
}

export function saveConnectionConfig(cfg: ConnectionConfig) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONNECTION, JSON.stringify(cfg));
  } catch {}
}

export function clampValue(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
