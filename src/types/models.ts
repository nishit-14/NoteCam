export interface SavedDoc {
  id: string;
  name: string;
  docId: string;
  createdAt: string;
}

export type UploadStatus = "pending" | "uploaded" | "failed";

export interface CaptureRecord {
  id: string;
  docId: string;
  docName: string;
  note: string;
  localUri: string | null;
  capturedAt: string;
  uploadedAt?: string;
  uploadStatus: UploadStatus;
  uploadMessage?: string;
  ocrText?: string;
  localDeletedAt?: string;
}

export interface AppSettings {
  backendUrl: string;
  googleDriveAccessToken: string;
  googleDriveTokenExpiresAt: string | null;
  googleIosClientId: string;
}

export interface OcrDraft {
  historyId: string;
  docId: string;
  docName: string;
  text: string;
  updatedAt: string;
}

export interface AppState {
  docs: SavedDoc[];
  activeDocId: string | null;
  defaultDocId: string | null;
  history: CaptureRecord[];
  settings: AppSettings;
  draftOcr: OcrDraft | null;
}

export interface BackendUploadPayload {
  docId: string;
  docName: string;
  imageBase64: string;
  mimeType: string;
  timestamp: string;
  note?: string;
  includeOcr?: boolean;
}

export interface GoogleDocFile {
  id: string;
  name: string;
  modifiedTime?: string;
}
