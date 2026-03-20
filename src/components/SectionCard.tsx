import React from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../constants/theme";

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    borderTopColor: "rgba(255, 79, 216, 0.55)",
    borderTopWidth: 1.5,
    marginBottom: 16,
    padding: 16,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 10,
  },
});
