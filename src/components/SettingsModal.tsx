import { useState } from 'react';
import { X, Save, RotateCcw, Check, Download } from 'lucide-react';
import { AppConfig, SliderLimit } from '../types.ts';
import { DEFAULT_CONFIG } from '../storage.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
}

export function SettingsModal({ isOpen, onClose, config, onSaveConfig }: SettingsModalProps) {
  const [draft, setDraft] = useState<AppConfig>(() => JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'topspin' | 'backspin' | 'counter' | 'common'>('topspin');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLimitChange = (
    section: 'topspin' | 'backspin' | 'counter' | 'common',
    key: string,
    field: keyof SliderLimit,
    value: string
  ) => {
    setDraft((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const num = field === 'unit' ? value : parseFloat(value) || 0;
      (next as any)[section][key][field] = num;
      return next;
    });
  };

  const handleSave = () => {
    onSaveConfig(draft);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset slider limits to default values?')) {
      setDraft(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    }
  };

  const renderLimitItem = (
    label: string,
    limit: SliderLimit,
    section: 'topspin' | 'backspin' | 'counter' | 'common',
    paramKey: string
  ) => {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
          <span>{label}</span>
          <span className="text-zinc-500 font-mono">Unit: {limit.unit}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Min</label>
            <input
              type="number"
              step="any"
              value={limit.min}
              onChange={(e) => handleLimitChange(section, paramKey, 'min', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Max</label>
            <input
              type="number"
              step="any"
              value={limit.max}
              onChange={(e) => handleLimitChange(section, paramKey, 'max', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Step</label>
            <input
              type="number"
              step="any"
              value={limit.step}
              onChange={(e) => handleLimitChange(section, paramKey, 'step', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-sm text-zinc-100">Slider Limits (Min / Max)</h2>
            <p className="text-xs text-zinc-500">Configure ranges per mode without code changes</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-zinc-800 bg-zinc-900/50 p-1 gap-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('topspin')}
            className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer ${
              activeTab === 'topspin' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
            }`}
          >
            Topspin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backspin')}
            className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer ${
              activeTab === 'backspin' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
            }`}
          >
            Backspin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('counter')}
            className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer ${
              activeTab === 'counter' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
            }`}
          >
            Flat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('common')}
            className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer ${
              activeTab === 'common' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400'
            }`}
          >
            Common
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {activeTab === 'topspin' && (
            <>
              {renderLimitItem('Topspin Intensity', draft.topspin.spin, 'topspin', 'spin')}
              {renderLimitItem('Ball Speed', draft.topspin.speed, 'topspin', 'speed')}
            </>
          )}

          {activeTab === 'backspin' && (
            <>
              {renderLimitItem('Backspin Intensity', draft.backspin.spin, 'backspin', 'spin')}
              {renderLimitItem('Ball Speed', draft.backspin.speed, 'backspin', 'speed')}
            </>
          )}

          {activeTab === 'counter' && (
            <>
              {renderLimitItem('Flat Ball Speed', draft.counter.speed, 'counter', 'speed')}
            </>
          )}

          {activeTab === 'common' && (
            <>
              {renderLimitItem('Elevation Angle', draft.common.elevation, 'common', 'elevation')}
              {renderLimitItem('Horizontal Oscillation', draft.common.oscillation, 'common', 'oscillation')}
              {renderLimitItem('Ball Interval', draft.common.interval, 'common', 'interval')}
            </>
          )}

          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <a
                href="/tt-launcher.zip"
                download="tt-launcher.zip"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Download Project ZIP (for Vercel)</span>
              </a>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Defaults</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>Save Limits</span>
          </button>
        </div>
      </div>
    </div>
  );
}
