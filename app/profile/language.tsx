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
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useAuth } from "../../src/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors } from "../../src/constants/colors";

type Language = "en" | "uz" | "ru";

const LANGUAGES = [
  { code: "uz" as Language, name: "O'zbekcha", flag: "🇺🇿" },
  { code: "ru" as Language, name: "Русский", flag: "🇷🇺" },
  { code: "en" as Language, name: "English", flag: "🇬🇧" },
];

export default function LanguageScreen() {
  const { language, setLanguage } = useLanguage();
  const { userData, setUser } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  const handleLanguageSelect = async (lang: Language) => {
    setSelectedLanguage(lang);
    setLanguage(lang);

    // 로그인한 경우 서버에도 저장
    if (userData) {
      try {
        await api.post(ENDPOINTS.userProfile, {
          language: lang,
        });

        // 로컬 유저 데이터 업데이트
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>언어 설정</Text>
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
            앱에서 사용할 언어를 선택하세요
          </Text>
        </View>

        <View style={styles.section}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageRow}
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

const styles = StyleSheet.create({
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
    backgroundColor: "#f0e6ff",
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
