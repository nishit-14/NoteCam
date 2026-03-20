import * as Google from "expo-auth-session/providers/google";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../constants/theme";
import { SectionCard } from "./SectionCard";
import { formatDateTime } from "../utils/date";

interface GoogleImportSectionProps {
  googleIosClientId: string;
  googleStatus: string;
  googleTokenExpiresAt: string | null;
  hasGoogleSession: boolean;
  onConnected: (accessToken: string, expiresInSeconds: number) => void;
  onDisconnect: () => void;
}

export function GoogleImportSection({
  googleIosClientId,
  googleStatus,
  googleTokenExpiresAt,
  hasGoogleSession,
  onConnected,
  onDisconnect,
}: GoogleImportSectionProps) {
  if (!googleIosClientId) {
    return (
      <SectionCard>
        <Text style={styles.sectionTitle}>Import from Google Docs</Text>
        <Text style={styles.muted}>
          Add your Google iOS OAuth client ID in Settings to import docs directly from your account.
        </Text>
      </SectionCard>
    );
  }

  return (
    <GoogleImportSectionWithAuth
      googleIosClientId={googleIosClientId}
      googleStatus={googleStatus}
      googleTokenExpiresAt={googleTokenExpiresAt}
      hasGoogleSession={hasGoogleSession}
      onConnected={onConnected}
      onDisconnect={onDisconnect}
    />
  );
}

function GoogleImportSectionWithAuth({
  googleIosClientId,
  googleStatus,
  googleTokenExpiresAt,
  hasGoogleSession,
  onConnected,
  onDisconnect,
}: GoogleImportSectionProps) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
    selectAccount: true,
  });

  useEffect(() => {
    if (response?.type !== "success") {
      return;
    }

    const accessToken =
      response.authentication?.accessToken ||
      (typeof response.params?.access_token === "string" ? response.params.access_token : "");

    if (!accessToken) {
      return;
    }

    onConnected(accessToken, response.authentication?.expiresIn ?? 3600);
  }, [onConnected, response]);

  return (
    <SectionCard>
      <Text style={styles.sectionTitle}>Import from Google Docs</Text>
      {googleStatus ? <Text style={styles.secondaryText}>{googleStatus}</Text> : null}
      {!hasGoogleSession ? (
        <Pressable
          disabled={!request}
          onPress={() => {
            void promptAsync();
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Connect Google account</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onDisconnect} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Disconnect Google account</Text>
        </Pressable>
      )}
      {hasGoogleSession ? (
        <Text style={styles.secondaryText}>
          Session valid until: {formatDateTime(googleTokenExpiresAt ?? undefined)}
        </Text>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  muted: {
    color: theme.colors.mutedText,
    fontSize: 14,
  },
  secondaryText: {
    color: theme.colors.mutedText,
    fontSize: 13,
    marginTop: 4,
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
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
});
