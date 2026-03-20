import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Field } from "../components/Field";
import { SectionCard } from "../components/SectionCard";
import { theme } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { appendOcrTextToDoc } from "../services/backend";
import { formatDateTime } from "../utils/date";

export function OcrResultScreen({ onBackToCamera }: { onBackToCamera: () => void }) {
  const { state, updateHistoryRecord } = useAppContext();
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const relatedRecord = useMemo(
    () => state.history.find((record) => record.id === state.draftOcr?.historyId) ?? null,
    [state.draftOcr?.historyId, state.history],
  );

  const handleCopy = async () => {
    if (!state.draftOcr?.text) {
      return;
    }

    await Clipboard.setStringAsync(state.draftOcr.text);
    setFeedback("OCR text copied.");
  };

  const handleAppend = async () => {
    if (!state.draftOcr?.text) {
      return;
    }

    setIsSaving(true);
    setFeedback("");

    try {
      const response = await appendOcrTextToDoc(state.settings.backendUrl, {
        docId: state.draftOcr.docId,
        docName: state.draftOcr.docName,
        note: relatedRecord?.note,
        ocrText: state.draftOcr.text,
        timestamp: relatedRecord?.capturedAt ?? new Date().toISOString(),
      });

      if (!response.ok) {
        throw new Error(response.message || "Could not append OCR text.");
      }

      if (state.draftOcr.historyId) {
        updateHistoryRecord(state.draftOcr.historyId, {
          ocrText: state.draftOcr.text,
          uploadMessage: response.message || "OCR text appended to Google Doc.",
          uploadStatus: "uploaded",
          uploadedAt: new Date().toISOString(),
        });
      }
      setFeedback(response.message || "OCR text appended to Google Doc.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not append OCR text.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <Text style={styles.title}>OCR result</Text>
        {state.draftOcr ? (
          <>
            <Text style={styles.primaryText}>{state.draftOcr.docName}</Text>
            <Text style={styles.muted}>
              Last updated: {formatDateTime(state.draftOcr.updatedAt)}
            </Text>
          </>
        ) : (
          <Text style={styles.muted}>
            Preview OCR from the Camera screen or open an item with OCR text from History.
          </Text>
        )}
      </SectionCard>

      <SectionCard>
        <Field
          editable={false}
          label="Extracted text"
          multiline
          value={state.draftOcr?.text ?? ""}
        />
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <View style={styles.actionRow}>
          <Pressable
            disabled={!state.draftOcr?.text}
            onPress={handleCopy}
            style={[styles.secondaryButton, !state.draftOcr?.text && styles.disabled]}
          >
            <Text style={styles.secondaryButtonText}>Copy text</Text>
          </Pressable>
          <Pressable
            disabled={!state.draftOcr?.text || isSaving}
            onPress={handleAppend}
            style={[styles.primaryButton, (!state.draftOcr?.text || isSaving) && styles.disabled]}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? "Appending…" : "Append to doc"}
            </Text>
          </Pressable>
          <Pressable onPress={onBackToCamera} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back to camera</Text>
          </Pressable>
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
  feedback: {
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
  disabled: {
    opacity: 0.5,
  },
});
