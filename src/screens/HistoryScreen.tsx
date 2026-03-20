import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { theme } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { formatDateTime } from "../utils/date";

export function HistoryScreen({ onOpenOcr }: { onOpenOcr: () => void }) {
  const { state, deleteAllHistory, deleteHistoryRecord, deleteLocalImage, setDraftOcr } =
    useAppContext();

  const sortedHistory = [...state.history].sort(
    (a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <Text style={styles.title}>Upload history</Text>
        <Text style={styles.muted}>
          Saved locally for reference. Local image files are cleaned up separately.
        </Text>
        {sortedHistory.length > 0 ? (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Delete all history?",
                "This removes every history entry. Any local images still attached to them will be deleted too.",
                [
                  { style: "cancel", text: "Cancel" },
                  {
                    style: "destructive",
                    text: "Delete all",
                    onPress: () => {
                      void deleteAllHistory();
                    },
                  },
                ],
              );
            }}
            style={styles.dangerButton}
          >
            <Text style={styles.dangerButtonText}>Delete all history</Text>
          </Pressable>
        ) : null}
      </SectionCard>

      {sortedHistory.length === 0 ? (
        <SectionCard>
          <Text style={styles.muted}>No captures yet.</Text>
        </SectionCard>
      ) : (
        sortedHistory.map((record) => (
          <SectionCard key={record.id}>
            <Text style={styles.primaryText}>{record.docName}</Text>
            <Text style={styles.muted}>Captured: {formatDateTime(record.capturedAt)}</Text>
            <Text style={styles.muted}>Uploaded: {formatDateTime(record.uploadedAt)}</Text>
            <Text style={styles.muted}>Status: {record.uploadStatus}</Text>
            <Text style={styles.muted}>
              Local file: {record.localUri ? "Present" : `Deleted ${formatDateTime(record.localDeletedAt)}`}
            </Text>
            {record.note ? <Text style={styles.note}>Note: {record.note}</Text> : null}
            {record.uploadMessage ? <Text style={styles.note}>{record.uploadMessage}</Text> : null}
            {record.ocrText ? (
              <>
                <Text numberOfLines={4} style={styles.ocrPreview}>
                  {record.ocrText}
                </Text>
                <Pressable
                  onPress={() => {
                    setDraftOcr({
                      docId: record.docId,
                      docName: record.docName,
                      historyId: record.id,
                      text: record.ocrText ?? "",
                      updatedAt: new Date().toISOString(),
                    });
                    onOpenOcr();
                  }}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Open OCR text</Text>
                </Pressable>
              </>
            ) : null}
            {record.localUri ? (
              <Pressable
                onPress={() => {
                  Alert.alert(
                    "Delete local image?",
                    "This removes only the app's local copy. It will not remove anything from Google Docs.",
                    [
                      { style: "cancel", text: "Cancel" },
                      {
                        style: "destructive",
                        text: "Delete local image",
                        onPress: () => {
                          void deleteLocalImage(record.id);
                        },
                      },
                    ],
                  );
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Delete local image</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Delete history entry?",
                  "This removes the history item. If a local image still exists, it will be deleted too.",
                  [
                    { style: "cancel", text: "Cancel" },
                    {
                      style: "destructive",
                      text: "Delete entry",
                      onPress: () => {
                        void deleteHistoryRecord(record.id);
                      },
                    },
                  ],
                );
              }}
              style={styles.dangerButton}
            >
              <Text style={styles.dangerButtonText}>Delete history entry</Text>
            </Pressable>
          </SectionCard>
        ))
      )}
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
    marginBottom: 6,
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginBottom: 4,
  },
  note: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: 6,
  },
  ocrPreview: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: 10,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 93, 122, 0.08)",
    borderColor: theme.colors.danger,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 10,
  },
  dangerButtonText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: "700",
  },
});
