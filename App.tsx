import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppProvider, useAppContext } from "./src/context/AppContext";
import { theme } from "./src/constants/theme";
import { CameraScreen } from "./src/screens/CameraScreen";
import { DocsScreen } from "./src/screens/DocsScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { OcrResultScreen } from "./src/screens/OcrResultScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type TabKey = "docs" | "camera" | "ocr" | "history" | "settings";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "docs", label: "Docs" },
  { key: "camera", label: "Camera" },
  { key: "ocr", label: "OCR" },
  { key: "history", label: "History" },
  { key: "settings", label: "Settings" },
];

function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("docs");
  const { state } = useAppContext();

  const content = useMemo(() => {
    switch (activeTab) {
      case "docs":
        return <DocsScreen onOpenCamera={() => setActiveTab("camera")} />;
      case "camera":
        return <CameraScreen onOpenOcr={() => setActiveTab("ocr")} />;
      case "ocr":
        return <OcrResultScreen onBackToCamera={() => setActiveTab("camera")} />;
      case "history":
        return <HistoryScreen onOpenOcr={() => setActiveTab("ocr")} />;
      case "settings":
        return <SettingsScreen />;
      default:
        return null;
    }
  }, [activeTab]);

  const selectedDocName =
    state.docs.find((doc) => doc.id === state.activeDocId)?.name ?? "None selected";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NoteCam</Text>
        <View style={styles.headerChip}>
          <Text numberOfLines={1} style={styles.headerChipText}>
            Active doc: {selectedDocName}
          </Text>
        </View>
      </View>
      <View style={styles.content}>{content}</View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: "rgba(5, 8, 22, 0.94)",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    position: "relative",
    zIndex: 2,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  headerChip: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: "rgba(255, 79, 216, 0.4)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: theme.colors.accentSecondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  headerChipText: {
    color: theme.colors.mutedText,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "#060A18",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 11,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentSecondary,
    borderWidth: 1,
    shadowColor: theme.colors.accentSecondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  tabLabel: {
    color: theme.colors.mutedText,
    fontSize: 12,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: theme.colors.text,
  },
});
