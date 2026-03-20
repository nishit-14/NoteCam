import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { Field } from "../components/Field";
import { SectionCard } from "../components/SectionCard";
import { theme } from "../constants/theme";
import { useAppContext } from "../context/AppContext";

export function SettingsScreen() {
  const { state, saveSettings, runCleanup } = useAppContext();
  const [backendUrl, setBackendUrl] = useState(state.settings.backendUrl);
  const [googleIosClientId, setGoogleIosClientId] = useState(state.settings.googleIosClientId);
  const [feedback, setFeedback] = useState("");

  const handleSave = () => {
    saveSettings({
      backendUrl: backendUrl.trim(),
      googleIosClientId: googleIosClientId.trim(),
    });
    setFeedback("Settings saved locally.");
  };

  const handleCleanup = async () => {
    await runCleanup();
    setFeedback("Cleanup completed. All local image copies were removed.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <Text style={styles.title}>Backend</Text>
        <Field
          autoCapitalize="none"
          label="Apps Script web app URL"
          onChangeText={setBackendUrl}
          placeholder="https://script.google.com/macros/s/.../exec"
          value={backendUrl}
        />
      </SectionCard>

      <SectionCard>
        <Text style={styles.title}>Google import</Text>
        <Field
          autoCapitalize="none"
          label="Google iOS OAuth client ID"
          onChangeText={setGoogleIosClientId}
          placeholder="1234567890-abc123.apps.googleusercontent.com"
          value={googleIosClientId}
        />
        <Text style={styles.muted}>
          Needed only if you want to import Google Docs directly from your account inside the app.
        </Text>
      </SectionCard>

      <SectionCard>
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        <Pressable onPress={handleSave} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save settings</Text>
        </Pressable>
        <Pressable onPress={handleCleanup} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Run cleanup</Text>
        </Pressable>
        <Text style={styles.muted}>
          This removes all local image copies stored by the app. It does not delete history, saved docs,
          settings, or anything already stored in Google Docs.
        </Text>
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
    marginBottom: 10,
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  feedback: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    marginBottom: 10,
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
