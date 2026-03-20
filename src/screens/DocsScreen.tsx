import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { Field } from "../components/Field";
import { theme } from "../constants/theme";
import { useAppContext } from "../context/AppContext";
import { GoogleImportSection } from "../components/GoogleImportSection";
import { fetchGoogleDocs, isGoogleTokenExpired } from "../services/googleDocs";
import { formatDateTime } from "../utils/date";

export function DocsScreen({ onOpenCamera }: { onOpenCamera: () => void }) {
  const { isHydrated, state, addDoc, saveSettings, setActiveDoc, setDefaultDoc } = useAppContext();
  const [name, setName] = useState("");
  const [docId, setDocId] = useState("");
  const [googleDocs, setGoogleDocs] = useState<Array<{ id: string; name: string; modifiedTime?: string }>>([]);
  const [googleStatus, setGoogleStatus] = useState("");
  const [isLoadingGoogleDocs, setIsLoadingGoogleDocs] = useState(false);

  const activeDoc = useMemo(
    () => state.docs.find((doc) => doc.id === state.activeDocId) ?? null,
    [state.activeDocId, state.docs],
  );

  const hasGoogleSession =
    !!state.settings.googleDriveAccessToken &&
    !isGoogleTokenExpired(state.settings.googleDriveTokenExpiresAt);

  const handleAddDoc = () => {
    if (!name.trim() || !docId.trim()) {
      return;
    }

    addDoc({ name, docId });
    setName("");
    setDocId("");
  };

  useEffect(() => {
    if (!hasGoogleSession) {
      setGoogleDocs([]);
      return;
    }

    let active = true;

    async function loadGoogleDocs() {
      setIsLoadingGoogleDocs(true);
      try {
        const files = await fetchGoogleDocs(state.settings.googleDriveAccessToken);
        if (!active) {
          return;
        }

        setGoogleDocs(files);
        setGoogleStatus(files.length > 0 ? "Imported from your Google account." : "No Google Docs found.");
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Could not load Google Docs right now.";
        setGoogleStatus(message);
        if (message.includes("expired")) {
          saveSettings({
            googleDriveAccessToken: "",
            googleDriveTokenExpiresAt: null,
          });
        }
      } finally {
        if (active) {
          setIsLoadingGoogleDocs(false);
        }
      }
    }

    void loadGoogleDocs();

    return () => {
      active = false;
    };
  }, [
    hasGoogleSession,
    saveSettings,
    state.settings.googleDriveAccessToken,
    state.settings.googleDriveTokenExpiresAt,
  ]);

  if (!isHydrated) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading saved docs…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <Text style={styles.sectionTitle}>Current target</Text>
        <Text style={styles.primaryText}>{activeDoc?.name ?? "No active Google Doc selected"}</Text>
        <Text style={styles.secondaryText}>
          {activeDoc ? `Doc ID: ${activeDoc.docId}` : "Add a Google Doc below to get started."}
        </Text>
        <Pressable onPress={onOpenCamera} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Open camera</Text>
        </Pressable>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Add Google Doc</Text>
        <Field label="Doc name" onChangeText={setName} placeholder="Biology 201" value={name} />
        <Field
          autoCapitalize="none"
          label="Google Doc ID"
          onChangeText={setDocId}
          placeholder="1AbC..."
          value={docId}
        />
        <Pressable onPress={handleAddDoc} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save doc</Text>
        </Pressable>
      </SectionCard>

      <GoogleImportSection
        hasGoogleSession={hasGoogleSession}
        googleStatus={googleStatus}
        googleTokenExpiresAt={state.settings.googleDriveTokenExpiresAt}
        googleIosClientId={state.settings.googleIosClientId}
        onConnected={(accessToken, expiresInSeconds) => {
          saveSettings({
            googleDriveAccessToken: accessToken,
            googleDriveTokenExpiresAt: new Date(
              Date.now() + expiresInSeconds * 1000,
            ).toISOString(),
          });
          setGoogleStatus("Google account connected. Loading your recent docs…");
        }}
        onDisconnect={() => {
          saveSettings({
            googleDriveAccessToken: "",
            googleDriveTokenExpiresAt: null,
          });
          setGoogleDocs([]);
          setGoogleStatus("Google account disconnected.");
        }}
      />

      {state.settings.googleIosClientId ? (
        <SectionCard>
          <Text style={styles.sectionTitle}>Recent Google Docs</Text>
          {isLoadingGoogleDocs ? (
            <ActivityIndicator color={theme.colors.accent} />
          ) : googleDocs.length === 0 ? (
            <Text style={styles.muted}>No imported docs to show yet.</Text>
          ) : (
            googleDocs.map((doc) => (
              <View key={doc.id} style={styles.docRow}>
                <View style={styles.docMeta}>
                  <Text style={styles.primaryText}>{doc.name}</Text>
                  <Text style={styles.secondaryText}>{doc.id}</Text>
                  <Text style={styles.secondaryText}>
                    Updated: {formatDateTime(doc.modifiedTime)}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => addDoc({ docId: doc.id, name: doc.name })}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Import</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </SectionCard>
      ) : null}

      <SectionCard>
        <Text style={styles.sectionTitle}>Saved docs</Text>
        {state.docs.length === 0 ? (
          <Text style={styles.muted}>No docs saved yet.</Text>
        ) : (
          state.docs.map((doc) => {
            const isActive = doc.id === state.activeDocId;
            const isDefault = doc.id === state.defaultDocId;
            return (
              <View key={doc.id} style={styles.docRow}>
                <View style={styles.docMeta}>
                  <Text style={styles.primaryText}>{doc.name}</Text>
                  <Text style={styles.secondaryText}>{doc.docId}</Text>
                  <View style={styles.tagRow}>
                    {isActive ? <Text style={styles.tag}>Selected</Text> : null}
                    {isDefault ? <Text style={styles.tag}>Default</Text> : null}
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => setActiveDoc(doc.id)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Select</Text>
                  </Pressable>
                  <Pressable onPress={() => setDefaultDoc(doc.id)} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Default</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
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
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  primaryText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    marginTop: 12,
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
  docRow: {
    backgroundColor: theme.colors.input,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
    padding: 12,
  },
  docMeta: {
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: "rgba(255, 79, 216, 0.14)",
    borderRadius: 999,
    color: theme.colors.accentSecondary,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
});
