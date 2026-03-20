import { requestOcr } from "./backend";
import { CaptureRecord } from "../types/models";

export async function extractTextForRecord(
  backendUrl: string,
  record: CaptureRecord,
  imageBase64: string,
) {
  if (!record.localUri && !imageBase64) {
    throw new Error("No local image is available for OCR.");
  }

  const response = await requestOcr(backendUrl, {
    docId: record.docId,
    docName: record.docName,
    imageBase64,
    mimeType: "image/jpeg",
    timestamp: record.capturedAt,
    note: record.note,
  });

  if (!response.ok) {
    throw new Error(response.message || "OCR request failed.");
  }

  return response.ocrText ?? "";
}
