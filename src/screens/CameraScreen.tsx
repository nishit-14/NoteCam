import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { Field } from "../components/Field";
import { SectionCard } from "../components/SectionCard";
import { theme } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { fileToBase64, uploadExtractedTextToDoc } from "../services/backend";
import { moveCaptureToAppStorage } from "../services/captureStore";
import { extractTextForRecord } from "../services/ocr";

export function CameraScreen({ onOpenOcr }: { onOpenOcr: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [facing] = useState<"back" | "front">("back");
  const [zoom, setZoom] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("");
  const [busyAction, setBusyAction] = useState<"capture" | "upload" | "ocr" | null>(null);
  const { state, addHistoryRecord, updateHistoryRecord, setDraftOcr } = useAppContext();

  const activeDoc = useMemo(
    () => state.docs.find((doc) => doc.id === state.activeDocId) ?? null,
    [state.activeDocId, state.docs],
  );

  const activeRecord = useMemo(
    () => state.history.find((record) => record.id === activeRecordId) ?? null,
    [activeRecordId, state.history],
  );

  const resetPreview = () => {
    setPreviewUri(null);
    setNote("");
    setStatusText("");
    setActiveRecordId(null);
  };

  const adjustZoom = (delta: number) => {
    setZoom((current) => {
      const next = current + delta;
      return Math.max(0, Math.min(1, Number(next.toFixed(2))));
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !activeDoc) {
      return;
    }

    setBusyAction("capture");
    setStatusText("");

    try {
      const photo = (await cameraRef.current.takePictureAsync({
        quality: 0.7,
      })) as CameraCapturedPicture | undefined;

      if (!photo?.uri) {
        throw new Error("No image was captured.");
      }

      const localUri = await moveCaptureToAppStorage(photo.uri);
      const capturedAt = new Date().toISOString();
      const historyId = addHistoryRecord({
        capturedAt,
        docId: activeDoc.docId,
        docName: activeDoc.name,
        localUri,
        note: "",
        uploadStatus: "pending",
      });

      setActiveRecordId(historyId);
      setPreviewUri(localUri);
      setStatusText("Image captured and stored locally.");
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "Capture failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const syncRecordNote = () => {
    if (activeRecordId) {
      updateHistoryRecord(activeRecordId, { note: note.trim() });
    }
  };

  const handleUpload = async () => {
    if (!previewUri || !activeDoc || !activeRecordId) {
      return;
    }

    setBusyAction("upload");
    setStatusText("");
    syncRecordNote();

    try {
      const imageBase64 = await fileToBase64(previewUri);
      const response = await uploadExtractedTextToDoc(state.settings.backendUrl, {
        docId: activeDoc.docId,
        docName: activeDoc.name,
        imageBase64,
        mimeType: "image/jpeg",
        note: note.trim(),
        timestamp: activeRecord?.capturedAt ?? new Date().toISOString(),
      });

      if (!response.ok) {
        throw new Error(response.message || "Upload failed.");
      }

      updateHistoryRecord(activeRecordId, {
        note: note.trim(),
        ocrText: response.ocrText,
        uploadMessage: response.message || "Uploaded to Google Doc.",
        uploadStatus: "uploaded",
        uploadedAt: new Date().toISOString(),
      });
      if (response.ocrText) {
        setDraftOcr({
          docId: activeDoc.docId,
          docName: activeDoc.name,
          historyId: activeRecordId,
          text: response.ocrText,
          updatedAt: new Date().toISOString(),
        });
      }
      setStatusText(response.message || "Upload completed.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      updateHistoryRecord(activeRecordId, {
        note: note.trim(),
        uploadMessage: message,
        uploadStatus: "failed",
      });
      setStatusText(message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRunOcr = async () => {
    if (!previewUri || !activeRecord) {
      return;
    }

    setBusyAction("ocr");
    setStatusText("");
    syncRecordNote();

    try {
      const imageBase64 = await fileToBase64(previewUri);
      const extractedText = await extractTextForRecord(
        state.settings.backendUrl,
        {
          ...activeRecord,
          note: note.trim(),
        },
        imageBase64,
      );

      updateHistoryRecord(activeRecord.id, {
        note: note.trim(),
        ocrText: extractedText,
      });
      setDraftOcr({
        docId: activeRecord.docId,
        docName: activeRecord.docName,
        historyId: activeRecord.id,
        text: extractedText,
        updatedAt: new Date().toISOString(),
      });
      setStatusText(extractedText ? "OCR text extracted." : "OCR completed with no text.");
      onOpenOcr();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "OCR failed.");
    } finally {
      setBusyAction(null);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access required</Text>
        <Text style={styles.muted}>Allow camera access so NoteCam can capture lecture photos.</Text>
        <Pressable onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  if (!activeDoc) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>No target doc selected</Text>
        <Text style={styles.muted}>Pick a Google Doc on the Docs screen before taking photos.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <Text style={styles.title}>Target doc</Text>
        <Text style={styles.primaryText}>{activeDoc.name}</Text>
        <Text style={styles.muted}>{activeDoc.docId}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.title}>{previewUri ? "Preview" : "Camera"}</Text>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} />
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView facing={facing} ref={cameraRef} style={styles.camera} zoom={zoom} />
            <View style={styles.zoomOverlay}>
              <Pressable onPress={() => adjustZoom(-0.1)} style={styles.zoomButton}>
                <Text style={styles.zoomButtonText}>-</Text>
              </Pressable>
              <Text style={styles.zoomLabel}>Zoom {Math.round(zoom * 100)}%</Text>
              <Pressable onPress={() => adjustZoom(0.1)} style={styles.zoomButton}>
                <Text style={styles.zoomButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Field
          label="Optional note/title"
          onChangeText={setNote}
          placeholder="Week 3 whiteboard notes"
          value={note}
        />
        {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

        <View style={styles.actionRow}>
          {!previewUri ? (
            <Pressable
              disabled={busyAction !== null}
              onPress={handleCapture}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {busyAction === "capture" ? "Capturing…" : "Capture image"}
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                disabled={busyAction !== null}
                onPress={handleUpload}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  {busyAction === "upload" ? "Extracting + uploading…" : "Upload extracted text"}
                </Text>
              </Pressable>
              <Pressable
                disabled={busyAction !== null}
                onPress={handleRunOcr}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {busyAction === "ocr" ? "Running OCR…" : "Preview extracted text"}
                </Text>
              </Pressable>
              <Pressable
                disabled={busyAction !== null}
                onPress={resetPreview}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </Pressable>
            </>
          )}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 24,
  },
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  primaryText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  cameraWrap: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    height: 360,
    width: "100%",
  },
  zoomOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(7, 8, 24, 0.9)",
    bottom: 12,
    borderRadius: 999,
    borderColor: "rgba(47, 230, 255, 0.25)",
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
  },
  zoomButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  zoomButtonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  zoomLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  preview: {
    backgroundColor: theme.colors.input,
    borderRadius: 16,
    height: 360,
    marginBottom: 12,
    width: "100%",
  },
  statusText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginBottom: 12,
  },
  actionRow: {
    gap: 10,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: theme.colors.accent,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: theme.colors.accentText,
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
