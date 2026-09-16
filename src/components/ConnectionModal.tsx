import { useState } from 'react';
import { X, Wifi, Bluetooth, Radio, Check, Copy } from 'lucide-react';
import { ConnectionConfig, ConnectionStatus } from '../types.ts';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  config: ConnectionConfig;
  onUpdateConfig: (cfg: ConnectionConfig) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  lastCommand: string;
}

export function ConnectionModal({
  isOpen,
  onClose,
  status,
  config,
  onUpdateConfig,
  onConnect,
  onDisconnect,
  lastCommand,
}: ConnectionModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(lastCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-sm text-zinc-100">Machine Connection (ESP32)</h2>
            <p className="text-xs text-zinc-500">Manage Bluetooth and Wi-Fi link</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'connected'
                    ? 'bg-emerald-500'
                    : status === 'connecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-zinc-500'
                }`}
              />
              <span className="font-semibold text-zinc-200">
                {status === 'connected' ? 'Connected to Machine' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>

            {status === 'connected' ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-400 font-semibold cursor-pointer"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
              >
                Connect
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-zinc-400 font-medium">Connection Protocol:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, method: 'bluetooth' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  config.method === 'bluetooth'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bluetooth className="w-4 h-4" />
                <span>Bluetooth</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, method: 'wifi' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  config.method === 'wifi'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Wifi className="w-4 h-4" />
                <span>Wi-Fi</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateConfig({ ...config, method: 'simulated' })}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                  config.method === 'simulated'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Simulator</span>
              </button>
            </div>
          </div>

          {config.method === 'wifi' && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-zinc-500 mb-1">IP Address</label>
                  <input
                    type="text"
                    value={config.wifiHost}
                    onChange={(e) => onUpdateConfig({ ...config, wifiHost: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-zinc-200"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-zinc-500 mb-1">Port</label>
                  <input
                    type="number"
                    value={config.wifiPort}
                    onChange={(e) => onUpdateConfig({ ...config, wifiPort: parseInt(e.target.value) || 80 })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-zinc-200"
                  />
                </div>
              </div>
            </div>
          )}

          {config.method === 'bluetooth' && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5">
              <label className="block text-zinc-500">Device Name</label>
              <input
                type="text"
                value={config.deviceName}
                onChange={(e) => onUpdateConfig({ ...config, deviceName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Outgoing Command Packet:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-400 break-all">
              {lastCommand}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
