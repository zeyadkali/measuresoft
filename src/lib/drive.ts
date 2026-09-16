export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
}

export interface BackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  presets: unknown[];
  config: unknown;
}

/**
 * Lists all TT_Launcher_Backup files from Google Drive
 */
export async function listDriveBackups(token: string): Promise<DriveBackupFile[]> {
  const query = encodeURIComponent("name contains 'TT_Launcher_Backup' and trashed = false");
  const fields = encodeURIComponent('files(id, name, size, modifiedTime, createdTime)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Uploads a backup JSON file to Google Drive using multipart upload
 */
export async function uploadBackupToDrive(
  token: string,
  payload: BackupPayload,
  customFileName?: string
): Promise<DriveBackupFile> {
  const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = customFileName || `TT_Launcher_Backup_${dateStr}.json`;
  const fileContent = JSON.stringify(payload, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Table Tennis Launcher presets and machine settings backup',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to upload to Google Drive: ${res.status} ${errText}`);
  }

  return await res.json();
}

/**
 * Downloads and parses a backup file from Google Drive
 */
export async function downloadBackupFromDrive(
  token: string,
  fileId: string
): Promise<BackupPayload> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download backup: ${res.status} ${errText}`);
  }

  const content = await res.json();
  return content as BackupPayload;
}

/**
 * Deletes a file from Google Drive
 */
export async function deleteBackupFromDrive(token: string, fileId: string): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const errText = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${res.status} ${errText}`);
  }
}
