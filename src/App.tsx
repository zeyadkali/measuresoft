import { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Bookmark,
  Wifi,
  RotateCw,
  Gauge,
  Compass,
  Clock,
  ChevronUp,
  Cloud,
} from 'lucide-react';
import { LauncherMode, AppConfig, LauncherSettings, Preset, ConnectionStatus, ConnectionConfig } from './types.ts';
import {
  loadStoredConfig,
  saveStoredConfig,
  loadStoredSettings,
  saveStoredSettings,
  loadStoredPresets,
  saveStoredPresets,
  loadConnectionConfig,
  saveConnectionConfig,
  clampValue,
} from './storage.ts';
import { ModeSelector } from './components/ModeSelector.tsx';
import { TouchSlider } from './components/TouchSlider.tsx';
import { BigActionButtons } from './components/BigActionButtons.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { PresetsModal } from './components/PresetsModal.tsx';
import { ConnectionModal } from './components/ConnectionModal.tsx';
import { GoogleDriveModal } from './components/GoogleDriveModal.tsx';
import { PWAInstallButton } from './components/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';

export default function App() {
  const [config, setConfig] = useState<AppConfig>(() => loadStoredConfig());
  const [settings, setSettings] = useState<LauncherSettings>(() => loadStoredSettings());
  const [presets, setPresets] = useState<Preset[]>(() => loadStoredPresets());
  const [connConfig, setConnConfig] = useState<ConnectionConfig>(() => loadConnectionConfig());
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('connected');

  const [isRunning, setIsRunning] = useState(false);
  const [ballsLaunched, setBallsLaunched] = useState(0);
  const [lastPacket, setLastPacket] = useState('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);

  const handleRestoreFromDrive = (restoredPresets: Preset[], restoredConfig?: AppConfig) => {
    if (restoredPresets && restoredPresets.length > 0) {
      setPresets((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newItems = restoredPresets.filter((p) => !existingIds.has(p.id));
        return [...prev, ...newItems];
      });
    }
    if (restoredConfig) {
      setConfig(restoredConfig);
      saveStoredConfig(restoredConfig);
    }
  };

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredPresets(presets);
  }, [presets]);

  useEffect(() => {
    saveConnectionConfig(connConfig);
  }, [connConfig]);

  const currentPacket = useMemo(() => {
    const activeSpin =
      settings.activeMode === 'topspin'
        ? settings.topspin.spin
        : settings.activeMode === 'backspin'
        ? settings.backspin.spin
        : 0;

    const activeSpeed =
      settings.activeMode === 'topspin'
        ? settings.topspin.speed
        : settings.activeMode === 'backspin'
        ? settings.backspin.speed
        : settings.counter.speed;

    const payload = {
      cmd: isRunning ? 'RUN' : 'STOP',
      mode: settings.activeMode,
      speed: activeSpeed,
      spin: activeSpin,
      elevation: settings.elevation,
      oscillation: settings.oscillation,
      interval: settings.interval,
    };

    return JSON.stringify(payload);
  }, [settings, isRunning]);

  useEffect(() => {
    setLastPacket(currentPacket);
  }, [currentPacket]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = Math.max(500, settings.interval * 1000);
    const timer = setInterval(() => {
      setBallsLaunched((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, settings.interval]);

  const handleModeChange = (mode: LauncherMode) => {
    setSettings((prev) => ({
      ...prev,
      activeMode: mode,
    }));
  };

  const handleTopSpinChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      topspin: {
        ...prev.topspin,
        spin: clampValue(val, config.topspin.spin.min, config.topspin.spin.max),
      },
    }));
  };

  const handleTopSpeedChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      topspin: {
        ...prev.topspin,
        speed: clampValue(val, config.topspin.speed.min, config.topspin.speed.max),
      },
    }));
  };

  const handleBackSpinChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      backspin: {
        ...prev.backspin,
        spin: clampValue(val, config.backspin.spin.min, config.backspin.spin.max),
      },
    }));
  };

  const handleBackSpeedChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      backspin: {
        ...prev.backspin,
        speed: clampValue(val, config.backspin.speed.min, config.backspin.speed.max),
      },
    }));
  };

  const handleCounterSpeedChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      counter: {
        speed: clampValue(val, config.counter.speed.min, config.counter.speed.max),
      },
    }));
  };

  const handleElevationChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      elevation: clampValue(val, config.common.elevation.min, config.common.elevation.max),
    }));
  };

  const handleOscillationChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      oscillation: clampValue(val, config.common.oscillation.min, config.common.oscillation.max),
    }));
  };

  const handleIntervalChange = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      interval: clampValue(val, config.common.interval.min, config.common.interval.max),
    }));
  };

  const handleToggleRun = () => {
    setIsRunning((prev) => !prev);
  };

  const handleEmergencyStop = () => {
    setIsRunning(false);
    setLastPacket(JSON.stringify({ cmd: 'ESTOP', stopped: true }));
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);

    setSettings((prev) => ({
      ...prev,
      topspin: {
        spin: clampValue(prev.topspin.spin, newConfig.topspin.spin.min, newConfig.topspin.spin.max),
        speed: clampValue(prev.topspin.speed, newConfig.topspin.speed.min, newConfig.topspin.speed.max),
      },
      backspin: {
        spin: clampValue(prev.backspin.spin, newConfig.backspin.spin.min, newConfig.backspin.spin.max),
        speed: clampValue(prev.backspin.speed, newConfig.backspin.speed.min, newConfig.backspin.speed.max),
      },
      counter: {
        speed: clampValue(prev.counter.speed, newConfig.counter.speed.min, newConfig.counter.speed.max),
      },
      elevation: clampValue(prev.elevation, newConfig.common.elevation.min, newConfig.common.elevation.max),
      oscillation: clampValue(prev.oscillation, newConfig.common.oscillation.min, newConfig.common.oscillation.max),
      interval: clampValue(prev.interval, newConfig.common.interval.min, newConfig.common.interval.max),
    }));
  };

  const handleApplyPreset = (p: Preset) => {
    setSettings((prev) => {
      const next: LauncherSettings = {
        ...prev,
        activeMode: p.mode,
        elevation: clampValue(p.elevation, config.common.elevation.min, config.common.elevation.max),
        oscillation: clampValue(p.oscillation, config.common.oscillation.min, config.common.oscillation.max),
        interval: clampValue(p.interval, config.common.interval.min, config.common.interval.max),
      };

      if (p.mode === 'topspin') {
        next.topspin = {
          speed: clampValue(p.speed, config.topspin.speed.min, config.topspin.speed.max),
          spin: clampValue(p.spin ?? 5, config.topspin.spin.min, config.topspin.spin.max),
        };
      } else if (p.mode === 'backspin') {
        next.backspin = {
          speed: clampValue(p.speed, config.backspin.speed.min, config.backspin.speed.max),
          spin: clampValue(p.spin ?? 4, config.backspin.spin.min, config.backspin.spin.max),
        };
      } else if (p.mode === 'counter') {
        next.counter = {
          speed: clampValue(p.speed, config.counter.speed.min, config.counter.speed.max),
        };
      }

      return next;
    });
  };

  const handleSaveNewPreset = (name: string) => {
    const currentSpeed =
      settings.activeMode === 'topspin'
        ? settings.topspin.speed
        : settings.activeMode === 'backspin'
        ? settings.backspin.speed
        : settings.counter.speed;

    const currentSpin =
      settings.activeMode === 'topspin'
        ? settings.topspin.spin
        : settings.activeMode === 'backspin'
        ? settings.backspin.spin
        : undefined;

    const newPreset: Preset = {
      id: `p_${Date.now()}`,
      name,
      mode: settings.activeMode,
      speed: currentSpeed,
      spin: currentSpin,
      elevation: settings.elevation,
      oscillation: settings.oscillation,
      interval: settings.interval,
      createdAt: Date.now(),
    };

    setPresets((prev) => [newPreset, ...prev]);
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConnect = () => {
    setConnStatus('connecting');
    setTimeout(() => setConnStatus('connected'), 600);
  };

  const handleDisconnect = () => {
    setIsRunning(false);
    setConnStatus('disconnected');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center relative">
      <OfflineIndicator />
      <main className="w-full max-w-md mx-auto flex flex-col min-h-screen px-4 py-3">
        <header className="flex items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/favicon.svg"
              alt="Measuresoft TT Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-contain shadow-lg shadow-orange-600/10 border border-zinc-800/80 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-zinc-100 leading-tight">TT Launcher</h1>
              </div>
              <p className="text-[11px] font-medium text-orange-400/90 tracking-wide">by measuresoft</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsConnectionOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-zinc-100 cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connStatus === 'connected'
                    ? 'bg-emerald-500'
                    : connStatus === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              <Wifi className="w-3.5 h-3.5 text-zinc-400" />
              <span>{connStatus === 'connected' ? 'Connected' : connStatus === 'connecting' ? 'Connecting' : 'Offline'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDriveOpen(true)}
              aria-label="Google Drive Sync"
              title="Google Drive Sync"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-blue-400 hover:border-blue-500/40 cursor-pointer transition-colors"
            >
              <Cloud className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPresetsOpen(true)}
              aria-label="Presets"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Settings"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="pt-3">
          <ModeSelector
            activeMode={settings.activeMode}
            onSelectMode={handleModeChange}
            disabled={isRunning}
          />
        </section>

        <section className="space-y-2.5 pt-3 pb-24 flex-1">
          {settings.activeMode === 'topspin' && (
            <>
              <TouchSlider
                id="topspin-spin"
                label="Topspin Intensity"
                value={settings.topspin.spin}
                limit={config.topspin.spin}
                onChange={handleTopSpinChange}
                icon={<RotateCw className="w-4 h-4" />}
              />
              <TouchSlider
                id="topspin-speed"
                label="Ball Speed"
                value={settings.topspin.speed}
                limit={config.topspin.speed}
                onChange={handleTopSpeedChange}
                icon={<Gauge className="w-4 h-4" />}
              />
            </>
          )}

          {settings.activeMode === 'backspin' && (
            <>
              <TouchSlider
                id="backspin-spin"
                label="Backspin Intensity"
                value={settings.backspin.spin}
                limit={config.backspin.spin}
                onChange={handleBackSpinChange}
                icon={<RotateCw className="w-4 h-4" />}
              />
              <TouchSlider
                id="backspin-speed"
                label="Ball Speed"
                value={settings.backspin.speed}
                limit={config.backspin.speed}
                onChange={handleBackSpeedChange}
                icon={<Gauge className="w-4 h-4" />}
              />
            </>
          )}

          {settings.activeMode === 'counter' && (
            <TouchSlider
              id="counter-speed"
              label="Ball Speed"
              value={settings.counter.speed}
              limit={config.counter.speed}
              onChange={handleCounterSpeedChange}
              icon={<Gauge className="w-4 h-4" />}
            />
          )}

          <div className="pt-1">
            <TouchSlider
              id="common-elevation"
              label="Elevation Angle"
              value={settings.elevation}
              limit={config.common.elevation}
              onChange={handleElevationChange}
              icon={<ChevronUp className="w-4 h-4" />}
            />
          </div>

          <TouchSlider
            id="common-oscillation"
            label="Horizontal Oscillation"
            value={settings.oscillation}
            limit={config.common.oscillation}
            onChange={handleOscillationChange}
            icon={<Compass className="w-4 h-4" />}
          />

          <TouchSlider
            id="common-interval"
            label="Ball Interval"
            value={settings.interval}
            limit={config.common.interval}
            onChange={handleIntervalChange}
            icon={<Clock className="w-4 h-4" />}
          />
        </section>

        <section className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80">
          <BigActionButtons
            isRunning={isRunning}
            onToggleRun={handleToggleRun}
            onEmergencyStop={handleEmergencyStop}
            ballsLaunched={ballsLaunched}
          />
        </section>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          config={config}
          onSaveConfig={handleSaveConfig}
        />

        <PresetsModal
          isOpen={isPresetsOpen}
          onClose={() => setIsPresetsOpen(false)}
          presets={presets}
          currentSettings={settings}
          onApplyPreset={handleApplyPreset}
          onSaveNewPreset={handleSaveNewPreset}
          onDeletePreset={handleDeletePreset}
          onOpenDrive={() => setIsDriveOpen(true)}
        />

        <ConnectionModal
          isOpen={isConnectionOpen}
          onClose={() => setIsConnectionOpen(false)}
          status={connStatus}
          config={connConfig}
          onUpdateConfig={setConnConfig}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          lastCommand={lastPacket}
        />

        <GoogleDriveModal
          isOpen={isDriveOpen}
          onClose={() => setIsDriveOpen(false)}
          currentPresets={presets}
          currentConfig={config}
          onRestorePresets={handleRestoreFromDrive}
        />
      </main>
    </div>
  );
}
