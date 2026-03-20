import * as WebBrowser from "expo-web-browser";
import { GoogleDocFile } from "../types/models";

WebBrowser.maybeCompleteAuthSession();

export function isGoogleTokenExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return true;
  }

  return new Date(expiresAt).getTime() <= Date.now();
}

export async function fetchGoogleDocs(accessToken: string) {
  if (!accessToken) {
    throw new Error("Connect your Google account first.");
  }

  const params = new URLSearchParams({
    fields: "files(id,name,modifiedTime)",
    orderBy: "modifiedTime desc",
    pageSize: "25",
    q: "mimeType='application/vnd.google-apps.document' and trashed=false",
  });
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new Error("Google session expired. Reconnect your Google account.");
  }

  if (!response.ok) {
    throw new Error(`Google Drive request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as { files?: GoogleDocFile[] };
  return data.files ?? [];
}
