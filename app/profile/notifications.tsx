import { useState, useEffect } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { useTranslation } from "react-i18next";

export default function NotificationsScreen() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [matchStart, setMatchStart] = useState(false);
  const [goals, setGoals] = useState(false);
  const [matchEnd, setMatchEnd] = useState(false);
  const [news, setNews] = useState(false);
  const [predictions, setPredictions] = useState(false);

  useEffect(() => {
    loadSettings();
    registerForPushNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const settings: any = await api.get(ENDPOINTS.notificationSettings);
      setMatchStart(settings.matchStart ?? false);
      setGoals(settings.goals ?? false);
      setMatchEnd(settings.matchEnd ?? false);
      setNews(settings.news ?? false);
      setPredictions(settings.predictions ?? false);
    } catch (error) {
      console.error("설정 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const registerForPushNotifications = async () => {
    if (Platform.OS === "web") return;
    if (!Device.isDevice) return;

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return;

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      await api.post(ENDPOINTS.fcmToken, { token });
    } catch (error) {
      console.error("FCM 토큰 등록 실패:", error);
    }
  };

  const handleToggle = async (
    key: string,
    setter: (val: boolean) => void,
    value: boolean,
  ) => {
    setter(value);
    try {
      await api.post(ENDPOINTS.notificationSettings, { [key]: value });
    } catch (error) {
      console.error("설정 저장 실패:", error);
      setter(!value);
      alert(t("notifications.saveFailed"));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
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
            {t("notifications.description")}
          </Text>
        </View>

        <View style={styles.section}>
          {[
            {
              key: "matchStart",
              icon: "play-circle",
              title: t("notifications.matchStart"),
              desc: t("notifications.matchStartDesc"),
              value: matchStart,
              setter: setMatchStart,
            },
            {
              key: "goals",
              icon: "football",
              title: t("notifications.goals"),
              desc: t("notifications.goalsDesc"),
              value: goals,
              setter: setGoals,
            },
            {
              key: "matchEnd",
              icon: "stopwatch",
              title: t("notifications.matchEnd"),
              desc: t("notifications.matchEndDesc"),
              value: matchEnd,
              setter: setMatchEnd,
            },
            {
              key: "news",
              icon: "newspaper",
              title: t("notifications.news"),
              desc: t("notifications.newsDesc"),
              value: news,
              setter: setNews,
            },
            {
              key: "predictions",
              icon: "analytics",
              title: t("notifications.predictions"),
              desc: t("notifications.predictionsDesc"),
              value: predictions,
              setter: setPredictions,
            },
          ].map((item, index, arr) => (
            <View
              key={item.key}
              style={[
                styles.settingRow,
                index === arr.length - 1 && styles.settingRowLast,
              ]}
            >
              <View style={styles.settingLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={Colors.text}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.desc}</Text>
                </View>
              </View>
              <Switch
                value={item.value}
                onValueChange={(val) =>
                  handleToggle(item.key, item.setter, val)
                }
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
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
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0,
    },
    settingLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
  });
