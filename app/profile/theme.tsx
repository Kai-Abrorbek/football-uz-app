import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { useTranslation } from "react-i18next";

type Theme = "light" | "dark" | "system";

export default function ThemeScreen() {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const THEMES = [
    {
      value: "light" as Theme,
      label: t("theme.light"),
      icon: "sunny",
      description: t("theme.lightDesc"),
    },
    {
      value: "dark" as Theme,
      label: t("theme.dark"),
      icon: "moon",
      description: t("theme.darkDesc"),
    },
    {
      value: "system" as Theme,
      label: t("theme.system"),
      icon: "phone-portrait",
      description: t("theme.systemDesc"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("theme.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        <View style={styles.description}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.descriptionText}>{t("theme.description")}</Text>
        </View>

        <View style={styles.section}>
          {THEMES.map((theme, index) => (
            <TouchableOpacity
              key={theme.value}
              style={[
                styles.themeRow,
                index === THEMES.length - 1 && styles.themeRowLast,
              ]}
              onPress={() => setThemeMode(theme.value)}
              activeOpacity={0.7}
            >
              <View style={styles.themeLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={theme.icon as any}
                    size={24}
                    color={
                      themeMode === theme.value ? Colors.primary : Colors.text
                    }
                  />
                </View>
                <View style={styles.themeText}>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                  <Text style={styles.themeDescription}>
                    {theme.description}
                  </Text>
                </View>
              </View>
              {themeMode === theme.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
    },
    description: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.primary + "18",
      marginHorizontal: 16,
      marginTop: 16,
      padding: 12,
      borderRadius: 12,
      gap: 8,
    },
    descriptionText: {
      flex: 1,
      fontSize: 13,
      color: Colors.text,
      lineHeight: 18,
    },
    section: {
      backgroundColor: Colors.surface,
      marginTop: 16,
      marginHorizontal: 16,
      borderRadius: 12,
      overflow: "hidden",
    },
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    themeRowLast: {
      borderBottomWidth: 0,
    },
    themeLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.logoBox,
    },
    themeText: {
      flex: 1,
    },
    themeLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 2,
    },
    themeDescription: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
  });
