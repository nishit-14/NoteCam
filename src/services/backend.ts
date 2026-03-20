import * as FileSystem from "expo-file-system/legacy";
import { BackendUploadPayload } from "../types/models";

interface BackendResponse {
  ok: boolean;
  message?: string;
  ocrText?: string;
}

async function postJson<T>(backendUrl: string, body: Record<string, unknown>) {
  if (!backendUrl.trim()) {
    throw new Error("Set the Apps Script backend URL in Settings before uploading.");
  }

  const response = await fetch(backendUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function fileToBase64(uri: string) {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function uploadImageToDoc(backendUrl: string, payload: BackendUploadPayload) {
  return postJson<BackendResponse>(backendUrl, {
    action: "uploadImage",
    ...payload,
  });
}

export async function uploadExtractedTextToDoc(
  backendUrl: string,
  payload: Omit<BackendUploadPayload, "includeOcr">,
) {
  return postJson<BackendResponse>(backendUrl, {
    action: "uploadExtractedText",
    ...payload,
  });
}

export async function requestOcr(backendUrl: string, payload: Omit<BackendUploadPayload, "includeOcr">) {
  return postJson<BackendResponse>(backendUrl, {
    action: "extractOcr",
    ...payload,
  });
}

export async function appendOcrTextToDoc(
  backendUrl: string,
  payload: { docId: string; docName: string; ocrText: string; timestamp: string; note?: string },
) {
  return postJson<BackendResponse>(backendUrl, {
    action: "appendOcrText",
    ...payload,
  });
}
