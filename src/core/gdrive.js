/* ============================================================
   LifeOS — Official Google Drive API v3 & GIS Service
   ============================================================ */

const DEFAULT_CLIENT_ID = '942767098516-gdrive-lifeos.apps.googleusercontent.com';
const FILE_NAME = 'lifeos_data.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

class GoogleDriveService {
  constructor() {
    this.accessToken = null;
    this.tokenClient = null;
    this.fileId = localStorage.getItem('lifeos_gdrive_file_id') || null;
    this.clientId = localStorage.getItem('lifeos_gdrive_client_id') || '';
  }

  setClientId(clientId) {
    this.clientId = (clientId || '').trim();
    localStorage.setItem('lifeos_gdrive_client_id', this.clientId);
  }

  getClientId() {
    return this.clientId || DEFAULT_CLIENT_ID;
  }

  async loadGIS() {
    if (window.google?.accounts?.oauth2) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  async authenticate() {
    await this.loadGIS();
    const activeClientId = this.getClientId();

    if (!activeClientId) {
      throw new Error('Wklej swój Google OAuth Client ID w oknie synchronizacji!');
    }

    return new Promise((resolve, reject) => {
      try {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Biblioteka logowania Google (GSI) nie została załadowana. Sprawdź połączenie z internetem.'));
          return;
        }

        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: SCOPE,
          error_callback: (err) => {
            console.error('Google OAuth Error:', err);
            reject(new Error(err.message || 'Nieprawidłowy Client ID lub brak domeny w Google Cloud Console'));
          },
          callback: async (response) => {
            if (response.error) {
              reject(new Error(response.error_description || response.error));
              return;
            }
            this.accessToken = response.access_token;
            localStorage.setItem('lifeos_gdrive_token', this.accessToken);
            resolve(this.accessToken);
          },
        });
        this.tokenClient.requestAccessToken({ prompt: 'select_account' });
      } catch (e) {
        reject(e);
      }
    });
  }

  async getValidToken() {
    if (this.accessToken) return this.accessToken;
    const stored = localStorage.getItem('lifeos_gdrive_token');
    if (stored) {
      this.accessToken = stored;
      return stored;
    }
    return await this.authenticate();
  }

  async findFileId(token) {
    if (this.fileId) return this.fileId;

    try {
      const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          this.fileId = data.files[0].id;
          localStorage.setItem('lifeos_gdrive_file_id', this.fileId);
          return this.fileId;
        }
      }
    } catch (e) {
      console.warn('LifeOS: Error searching Google Drive files', e);
    }

    return null;
  }

  async save(stateData) {
    const token = await this.getValidToken();
    let fileId = await this.findFileId(token);
    const content = JSON.stringify(stateData, null, 2);

    if (fileId) {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: content
      });

      if (res.status === 401) {
        this.accessToken = null;
        localStorage.removeItem('lifeos_gdrive_token');
        const newToken = await this.authenticate();
        return this.save(stateData);
      }

      if (res.ok) {
        return { success: true, fileId };
      }
    }

    const metadata = {
      name: FILE_NAME,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'application/json' }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    if (res.status === 401) {
      this.accessToken = null;
      localStorage.removeItem('lifeos_gdrive_token');
      const newToken = await this.authenticate();
      return this.save(stateData);
    }

    if (res.ok) {
      const data = await res.json();
      this.fileId = data.id;
      localStorage.setItem('lifeos_gdrive_file_id', this.fileId);
      return { success: true, fileId: this.fileId };
    }

    throw new Error(`Google Drive API error: ${res.status}`);
  }

  async load() {
    const token = await this.getValidToken();
    const fileId = await this.findFileId(token);

    if (!fileId) {
      throw new Error('Nie znaleziono pliku lifeos_data.json w Twoim Google Drive. Zapisz plik najpierw.');
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      this.accessToken = null;
      localStorage.removeItem('lifeos_gdrive_token');
      const newToken = await this.authenticate();
      return this.load();
    }

    if (res.ok) {
      const text = await res.text();
      return JSON.parse(text);
    }

    throw new Error(`Błąd odczytu z Google Drive (${res.status})`);
  }
}

export const gdriveService = new GoogleDriveService();
