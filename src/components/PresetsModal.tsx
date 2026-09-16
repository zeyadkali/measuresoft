import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Cloud } from 'lucide-react';
import { Preset, LauncherSettings } from '../types.ts';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: Preset[];
  currentSettings: LauncherSettings;
  onApplyPreset: (preset: Preset) => void;
  onSaveNewPreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onOpenDrive?: () => void;
}

export function PresetsModal({
  isOpen,
  onClose,
  presets,
  onApplyPreset,
  onSaveNewPreset,
  onDeletePreset,
  onOpenDrive,
}: PresetsModalProps) {
  const [name, setName] = useState('');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveNewPreset(trimmed);
    setName('');
  };

  const handleApply = (p: Preset) => {
    onApplyPreset(p);
    setAppliedId(p.id);
    setTimeout(() => {
      setAppliedId(null);
      onClose();
    }, 300);
  };

  const getModeLabel = (mode: Preset['mode']) => {
    if (mode === 'topspin') return 'Topspin';
    if (mode === 'backspin') return 'Backspin';
    return 'Flat';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-sm text-zinc-100">Saved Drills</h2>
            <p className="text-xs text-zinc-500">Save and load training setups</p>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenDrive && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDrive();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-300 hover:text-blue-200 text-xs font-medium cursor-pointer transition-colors"
                title="Google Drive Sync"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Drive Sync</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3 border-b border-zinc-800 bg-zinc-900/40">
          <form onSubmit={handleSave} className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Drill name (e.g., Forehand Loop)..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </form>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {presets.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No saved drills yet.
            </div>
          ) : (
            presets.map((p) => {
              const isApplied = appliedId === p.id;
              return (
                <div
                  key={p.id}
                  className="bg-zinc-900/70 border border-zinc-800/90 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-xs text-zinc-200 truncate">{p.name}</div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{getModeLabel(p.mode)}</span>
                      <span>•</span>
                      <span>Spd {p.speed}</span>
                      {p.spin !== undefined && (
                        <>
                          <span>•</span>
                          <span>Spin {p.spin}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDeletePreset(p.id)}
                      aria-label="Delete"
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                      }`}
                    >
                      {isApplied ? <Check className="w-3.5 h-3.5" /> : 'Load'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
