import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Cloud,
  CloudUpload,
  RefreshCw,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  LogOut,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
} from '../lib/firebase.ts';
import {
  listDriveBackups,
  uploadBackupToDrive,
  downloadBackupFromDrive,
  deleteBackupFromDrive,
  DriveBackupFile,
  BackupPayload,
} from '../lib/drive.ts';
import { Preset, AppConfig } from '../types.ts';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresets: Preset[];
  currentConfig: AppConfig;
  onRestorePresets: (presets: Preset[], config?: AppConfig) => void;
}

export function GoogleDriveModal({
  isOpen,
  onClose,
  currentPresets,
  currentConfig,
  onRestorePresets,
}: GoogleDriveModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAccessToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Confirmation modal state for deletion
  const [fileToDelete, setFileToDelete] = useState<DriveBackupFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore confirmation state
  const [fileToRestore, setFileToRestore] = useState<DriveBackupFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const refreshBackupsList = useCallback(async (authToken: string) => {
    setIsLoadingBackups(true);
    setStatusMessage(null);
    try {
      const files = await listDriveBackups(authToken);
      setBackups(files);
    } catch (err) {
      console.error('Failed to list backups:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to list backups from Google Drive. Access token may have expired.',
      });
    } finally {
      setIsLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setTokenState(authToken);
        setAuthError(null);
        refreshBackupsList(authToken);
      },
      () => {
        // Logged out or needs fresh sign-in
        setUser(null);
        setTokenState(null);
      }
    );
    return () => unsubscribe();
  }, [refreshBackupsList]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setTokenState(res.accessToken);
        await refreshBackupsList(res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Google Sign In failed:', err);
      const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      setAuthError(message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setTokenState(null);
    setAccessToken(null);
    setBackups([]);
    setStatusMessage(null);
  };

  const handleBackupNow = async () => {
    if (!token) return;
    setIsUploading(true);
    setStatusMessage(null);
    try {
      const payload: BackupPayload = {
        version: 1,
        appName: 'TT Launcher Controller',
        exportedAt: new Date().toISOString(),
        presets: currentPresets,
        config: currentConfig,
      };
      const created = await uploadBackupToDrive(token, payload);
      setStatusMessage({
        type: 'success',
        text: `Successfully backed up to Google Drive as "${created.name}"`,
      });
      await refreshBackupsList(token);
    } catch (err) {
      console.error('Backup error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to upload backup to Google Drive. Check permissions or try signing in again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!fileToRestore || !token) return;
    setIsRestoring(true);
    setStatusMessage(null);
    try {
      const payload = await downloadBackupFromDrive(token, fileToRestore.id);
      if (payload && Array.isArray(payload.presets)) {
        onRestorePresets(payload.presets as Preset[], payload.config as AppConfig | undefined);
        setStatusMessage({
          type: 'success',
          text: `Restored ${payload.presets.length} presets from "${fileToRestore.name}"!`,
        });
        setFileToRestore(null);
      } else {
        throw new Error('Invalid backup file structure');
      }
    } catch (err) {
      console.error('Restore error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to download or restore backup from Google Drive.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || !token) return;
    setIsDeleting(true);
    setStatusMessage(null);
    try {
      await deleteBackupFromDrive(token, fileToDelete.id);
      setStatusMessage({
        type: 'success',
        text: `Deleted "${fileToDelete.name}" from Google Drive.`,
      });
      setFileToDelete(null);
      await refreshBackupsList(token);
    } catch (err) {
      console.error('Delete error:', err);
      setStatusMessage({
        type: 'error',
        text: 'Failed to delete file from Google Drive.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Google Drive Sync</h2>
              <p className="text-[11px] text-zinc-400">Backup & restore presets to your personal Drive</p>
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

          {/* Auth State */}
          {!user || !token ? (
            <div className="text-center py-6 px-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-300 shadow-inner">
                <HardDrive className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-200">Connect Google Drive</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Sign in with your Google account to securely backup your custom training drills and machine calibrations to Google Drive.
                </p>
              </div>

              {authError && (
                <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                  {authError}
                </p>
              )}

              {/* Official Google Sign In Button */}
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-800 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoadingAuth ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* User Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-300 font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {user.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => refreshBackupsList(token)}
                    disabled={isLoadingBackups}
                    title="Refresh backups list"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Action: Backup Now */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 via-zinc-900 to-zinc-900 border border-blue-900/40 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                    <CloudUpload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Backup Current Setup</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Saves {currentPresets.length} drill presets & mode limits
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBackupNow}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Save to Drive'}</span>
                </button>
              </div>

              {/* Existing Backups in Google Drive */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-zinc-300">
                    Saved Backups on Drive ({backups.length})
                  </h4>
                </div>

                {isLoadingBackups ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-zinc-400" />
                    Loading backups from Google Drive...
                  </div>
                ) : backups.length === 0 ? (
                  <div className="py-6 text-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                    No backups found on your Google Drive yet.
                    <br />
                    Click "Save to Drive" above to create your first backup.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {backups.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/70 hover:border-zinc-700/80 transition-all flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-medium text-zinc-200 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                            {file.modifiedTime && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(file.modifiedTime).toLocaleDateString()}{' '}
                                {new Date(file.modifiedTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                            {file.size && (
                              <span>{(parseInt(file.size, 10) / 1024).toFixed(1)} KB</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setFileToRestore(file)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-950/50 hover:text-emerald-300 hover:border-emerald-800 border border-zinc-700/60 text-xs text-zinc-300 cursor-pointer transition-colors"
                            title="Restore presets from this file"
                          >
                            <Download className="w-3 h-3" />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete file from Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Backed up files are stored securely in your Google Drive.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Confirmation Modal for Delete (MANDATORY per Workspace guidelines) */}
        {fileToDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-100">Delete from Google Drive?</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-zinc-100 font-semibold">{fileToDelete.name}</strong> from your
                Google Drive? This action cannot be undone.
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
                  {isDeleting ? 'Deleting...' : 'Delete File'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Restore */}
        {fileToRestore && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Download className="w-5 h-5" />
                <h3 className="text-sm font-bold text-zinc-100">Restore Presets?</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                This will import the drill presets and machine configuration from{' '}
                <strong className="text-zinc-100 font-semibold">{fileToRestore.name}</strong> into
                your app. Existing presets will be preserved and merged.
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
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white cursor-pointer transition-colors shadow-md disabled:opacity-50"
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
