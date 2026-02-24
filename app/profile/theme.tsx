import { useState, useEffect } from "react";
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
import { getColors } from "../../src/constants/colors";

type Theme = "light" | "dark" | "system";

const THEMES = [
  {
    value: "light" as Theme,
    label: "라이트 모드",
    icon: "sunny",
    description: "밝은 테마",
  },
  {
    value: "dark" as Theme,
    label: "다크 모드",
    icon: "moon",
    description: "어두운 테마",
  },
  {
    value: "system" as Theme,
    label: "시스템 설정",
    icon: "phone-portrait",
    description: "기기 설정 따르기",
  },
];

export default function ThemeScreen() {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const Colors = getColors(isDark);

  const handleThemeSelect = (theme: Theme) => {
    setThemeMode(theme);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
      edges={["top"]}
    >
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          { backgroundColor: Colors.surface, borderBottomColor: Colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>
          테마 설정
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        <View
          style={[
            styles.description,
            { backgroundColor: isDark ? "#2a1f4f" : "#f0e6ff" },
          ]}
        >
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={[styles.descriptionText, { color: Colors.text }]}>
            앱의 색상 테마를 변경할 수 있습니다
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: Colors.surface }]}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={[styles.themeRow, { borderBottomColor: Colors.border }]}
              onPress={() => handleThemeSelect(theme.value)}
              activeOpacity={0.7}
            >
              <View style={styles.themeLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" },
                  ]}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={24}
                    color={
                      themeMode === theme.value ? Colors.primary : Colors.text
                    }
                  />
                </View>
                <View style={styles.themeText}>
                  <Text style={[styles.themeLabel, { color: Colors.text }]}>
                    {theme.label}
                  </Text>
                  <Text
                    style={[
                      styles.themeDescription,
                      { color: Colors.textSecondary },
                    ]}
                  >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  },
  description: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
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
  },
  themeText: {
    flex: 1,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
  },
});
