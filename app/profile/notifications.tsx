import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
import { Colors } from "../../src/constants/colors";

export default function NotificationsScreen() {
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
    // 웹이면 스킵
    if (Platform.OS === "web") {
      console.log("웹에서는 푸시 알림을 지원하지 않습니다");
      return;
    }

    if (!Device.isDevice) {
      console.log("물리적 기기가 아닙니다");
      return;
    }
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("푸시 알림 권한이 거부되었습니다");
        return;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      // 서버에 토큰 등록
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
    // UI 즉시 업데이트
    setter(value);

    try {
      await api.post(ENDPOINTS.notificationSettings, {
        [key]: value,
      });
    } catch (error) {
      console.error("설정 저장 실패:", error);
      // 실패 시 되돌리기
      setter(!value);
      alert("설정 저장에 실패했습니다");
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
      {/* 헤더 */}
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
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* 설명 */}
        <View style={styles.description}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.descriptionText}>
            팔로우한 팀의 경기와 관련된 알림을 받아보세요
          </Text>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="play-circle" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>경기 시작</Text>
                <Text style={styles.settingDescription}>
                  팔로우한 팀의 경기 시작 15분 전
                </Text>
              </View>
            </View>
            <Switch
              value={matchStart}
              onValueChange={(val) =>
                handleToggle("matchStart", setMatchStart, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="football" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>골 알림</Text>
                <Text style={styles.settingDescription}>
                  팔로우한 팀의 골 실시간 알림
                </Text>
              </View>
            </View>
            <Switch
              value={goals}
              onValueChange={(val) => handleToggle("goals", setGoals, val)}
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="stopwatch" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>경기 종료</Text>
                <Text style={styles.settingDescription}>
                  팔로우한 팀의 경기 결과
                </Text>
              </View>
            </View>
            <Switch
              value={matchEnd}
              onValueChange={(val) =>
                handleToggle("matchEnd", setMatchEnd, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="newspaper" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>뉴스</Text>
                <Text style={styles.settingDescription}>
                  새로운 축구 뉴스 알림
                </Text>
              </View>
            </View>
            <Switch
              value={news}
              onValueChange={(val) => handleToggle("news", setNews, val)}
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="analytics" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>AI 예측</Text>
                <Text style={styles.settingDescription}>
                  경기 예측 및 분석 알림
                </Text>
              </View>
            </View>
            <Switch
              value={predictions}
              onValueChange={(val) =>
                handleToggle("predictions", setPredictions, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
