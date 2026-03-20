import * as FileSystem from "expo-file-system/legacy";

export async function ensureCaptureDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("App storage is not available on this device.");
  }

  const captureDir = `${FileSystem.documentDirectory}captures`;
  const info = await FileSystem.getInfoAsync(captureDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(captureDir, { intermediates: true });
  }

  return captureDir;
}

export async function moveCaptureToAppStorage(tempUri: string) {
  const directory = await ensureCaptureDirectory();
  const destination = `${directory}/capture-${Date.now()}.jpg`;
  await FileSystem.moveAsync({ from: tempUri, to: destination });
  return destination;
}

export async function deleteLocalCapture(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}
