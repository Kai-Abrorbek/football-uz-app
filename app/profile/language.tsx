import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useAuth } from "../../src/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

type Language = "en" | "uz" | "ru" | "kr";

const LANGUAGES = [
  { code: "uz" as Language, name: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru" as Language, name: "Русский", flag: "🇷🇺" },
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
  { code: "kr" as Language, name: "한국어", flag: "🇰🇷" },
];

export default function LanguageScreen() {
  const { language, setLanguage } = useLanguage();
  const { userData, setUser } = useAuth();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang);

    if (userData) {
      try {
        await api.post(ENDPOINTS.userProfile, {
          language: lang,
        });

        const updatedUser = {
          ...userData,
          user: {
            ...userData.user,
            language: lang,
          },
        };
        await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        console.error("언어 설정 저장 실패:", error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("language.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        <View style={styles.description}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.descriptionText}>
            {t("language.description")}
          </Text>
        </View>

        <View style={styles.section}>
          {LANGUAGES.map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageRow,
                index === LANGUAGES.length - 1 && styles.languageRowLast,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={styles.languageName}>{lang.name}</Text>
              </View>
              {selectedLanguage === lang.code && (
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
    languageRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    languageRowLast: {
      borderBottomWidth: 0,
    },
    languageLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    flag: {
      fontSize: 32,
    },
    languageName: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
    },
  });
