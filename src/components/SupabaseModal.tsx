import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  X,
  Database,
  CloudUpload,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Key,
  Copy,
  Check,
  Code,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  isSupabaseConfigured,
  listSupabaseBackups,
  uploadSupabaseBackup,
  deleteSupabaseBackup,
  SupabaseBackupRecord,
} from '../lib/supabase.ts';
import { Preset, AppConfig } from '../types.ts';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresets: Preset[];
  currentConfig: AppConfig;
  onRestorePresets: (presets: Preset[], config?: AppConfig) => void;
}

export function SupabaseModal({
  isOpen,
  onClose,
  currentPresets,
  currentConfig,
  onRestorePresets,
}: SupabaseModalProps) {
  const [configured, setConfigured] = useState(isSupabaseConfigured());
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showSqlHelper, setShowSqlHelper] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [backups, setBackups] = useState<SupabaseBackupRecord[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Deletion modal
  const [fileToDelete, setFileToDelete] = useState<SupabaseBackupRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore confirmation
  const [fileToRestore, setFileToRestore] = useState<SupabaseBackupRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const sqlSchema = `-- Run this in your Supabase SQL Editor:
create table if not exists tt_backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid,
  name text not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and public/anon policy:
alter table tt_backups enable row level security;

create policy "Allow all actions for anon" on tt_backups
  for all using (true) with check (true);
`;

  const refreshBackups = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setConfigured(false);
      return;
    }
    setIsLoadingBackups(true);
    setStatusMessage(null);
    try {
      const records = await listSupabaseBackups();
      setBackups(records);
      setConfigured(true);
    } catch (err: unknown) {
      console.error('Failed to list backups from Supabase:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatusMessage({
        type: 'error',
        text: `Error connecting to Supabase: ${msg}. Make sure you created the 'tt_backups' table.`,
      });
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setSupabaseUrl(creds.url);
      setSupabaseKey(creds.key);
      const isConfig = isSupabaseConfigured();
      setConfigured(isConfig);
      if (isConfig) {
        refreshBackups();
      } else {
        setShowConfigForm(true);
      }
    }
  }, [isOpen, refreshBackups]);

  if (!isOpen) return null;

  const handleSaveCredentials = (e: FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) return;
    saveSupabaseCredentials(supabaseUrl, supabaseKey);
    setConfigured(true);
    setShowConfigForm(false);
    setStatusMessage({
      type: 'success',
      text: 'Supabase credentials saved successfully!',
    });
    refreshBackups();
  };

  const handleDisconnect = () => {
    clearSupabaseCredentials();
    setSupabaseUrl('');
    setSupabaseKey('');
    setConfigured(false);
    setShowConfigForm(true);
    setBackups([]);
    setStatusMessage(null);
  };

  const handleBackupNow = async () => {
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const dateStr = new Date().toLocaleString();
      const name = `TT Drill Setup (${dateStr})`;
      const backupPayload = {
        version: 1,
        appName: 'TT Launcher Controller',
        exportedAt: new Date().toISOString(),
        presets: currentPresets,
        config: currentConfig,
      };

      const result = await uploadSupabaseBackup(name, backupPayload);
      setStatusMessage({
        type: 'success',
        text: `Successfully saved "${result.name}" to Supabase!`,
      });
      await refreshBackups();
    } catch (err: unknown) {
      console.error('Upload backup failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setStatusMessage({
        type: 'error',
        text: `Failed to save to Supabase: ${msg}. Make sure the 'tt_backups' table exists and RLS is configured.`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRestore = () => {
    if (!fileToRestore) return;
    setIsRestoring(true);
    try {
      const payload = fileToRestore.data;
      if (payload && Array.isArray(payload.presets)) {
        onRestorePresets(payload.presets as Preset[], payload.config as AppConfig | undefined);
        setStatusMessage({
          type: 'success',
          text: `Restored ${payload.presets.length} presets from "${fileToRestore.name}"!`,
        });
        setFileToRestore(null);
      } else {
        throw new Error('Invalid backup data format');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Restore error';
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${msg}`,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupabaseBackup(fileToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `Deleted backup "${fileToDelete.name}".`,
      });
      setFileToDelete(null);
      await refreshBackups();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete error';
      setStatusMessage({
        type: 'error',
        text: `Failed to delete: ${msg}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Supabase Cloud Sync</h2>
              <p className="text-[11px] text-zinc-400">Sync & backup presets to PostgreSQL database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Connection Status / Settings toggle */}
          {configured && !showConfigForm && (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-semibold text-zinc-200 truncate">
                    Connected to Supabase
                  </p>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">{supabaseUrl}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={refreshBackups}
                  disabled={isLoadingBackups}
                  title="Refresh backups"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfigForm(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Edit Keys
                </button>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          {showConfigForm && (
            <form onSubmit={handleSaveCredentials} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Credentials</span>
                </h3>
                {configured && (
                  <button
                    type="button"
                    onClick={() => setShowConfigForm(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Project URL</label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-400">Anon Public API Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {configured ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Disconnect
                  </button>
                ) : <span />}

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          )}

          {/* Backup Now Action Button */}
          {configured && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-900 border border-emerald-900/40 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Backup Current Setup</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Saves {currentPresets.length} drill presets & calibration limits to Supabase
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupNow}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Saving...' : 'Save to Cloud'}</span>
              </button>
            </div>
          )}

          {/* Backups List */}
          {configured && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-300">
                Saved Supabase Backups ({backups.length})
              </h4>

              {isLoadingBackups ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-zinc-400" />
                  Loading backups from Supabase...
                </div>
              ) : backups.length === 0 ? (
                <div className="py-6 text-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                  No backups found in Supabase yet.
                  <br />
                  Click "Save to Cloud" above to create your first backup.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {backups.map((record) => (
                    <div
                      key={record.id}
                      className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 hover:border-zinc-700/80 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-zinc-200 truncate">{record.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(record.created_at).toLocaleDateString()}{' '}
                          {new Date(record.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' • '}
                          {(record.data?.presets as unknown[])?.length || 0} presets
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setFileToRestore(record)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950/50 hover:text-emerald-300 hover:border-emerald-800 border border-zinc-700/60 text-xs text-zinc-300 cursor-pointer transition-colors"
                          title="Restore presets from this backup"
                        >
                          <Download className="w-3 h-3" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFileToDelete(record)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Delete backup"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SQL Setup Helper Accordion */}
          <div className="border border-zinc-800/80 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSqlHelper(!showSqlHelper)}
              className="w-full flex items-center justify-between p-3 bg-zinc-900/40 hover:bg-zinc-900/80 text-xs text-zinc-300 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase SQL Table Setup (Copy & Run)</span>
              </span>
              {showSqlHelper ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>

            {showSqlHelper && (
              <div className="p-3 bg-zinc-950/80 space-y-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Paste this into Supabase SQL Editor:</span>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono overflow-x-auto whitespace-pre">
                  {sqlSchema}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Backed up directly to your Supabase project.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Delete confirmation modal */}
        {fileToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-100">Delete Supabase Backup?</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Are you sure you want to delete{' '}
                <strong className="text-zinc-100 font-semibold">{fileToDelete.name}</strong> from
                Supabase?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restore confirmation modal */}
        {fileToRestore && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Download className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-100">Restore Presets?</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This will restore drill setups and mode limits from{' '}
                <strong className="text-zinc-100 font-semibold">{fileToRestore.name}</strong> into your
                app. Existing presets will be merged safely.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFileToRestore(null)}
                  disabled={isRestoring}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isRestoring}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer transition-colors shadow-md disabled:opacity-50"
                >
                  {isRestoring ? 'Restoring...' : 'Restore Presets'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
