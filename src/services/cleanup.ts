import * as FileSystem from "expo-file-system/legacy";
import { CaptureRecord } from "../types/models";

export async function cleanupLocalFiles(records: CaptureRecord[]) {
  const updated = await Promise.all(
    records.map(async (record) => {
      try {
        if (!record.localUri || record.localDeletedAt) {
          return record;
        }

        const info = await FileSystem.getInfoAsync(record.localUri);
        if (info.exists) {
          await FileSystem.deleteAsync(record.localUri, { idempotent: true });
        }

        return {
          ...record,
          localDeletedAt: new Date().toISOString(),
          localUri: null,
        };
      } catch {
        return record;
      }
    }),
  );

  return updated;
}
