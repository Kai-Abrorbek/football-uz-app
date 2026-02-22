import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../src/constants/colors";

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [matchUpdates, setMatchUpdates] = useState(true);
  const [newsUpdates, setNewsUpdates] = useState(true);
  const [favoriteTeams, setFavoriteTeams] = useState(true);
  const [chatbotTips, setChatbotTips] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
      if (settings) {
        const parsed = JSON.parse(settings);
        setPushEnabled(parsed.pushEnabled ?? true);
        setMatchUpdates(parsed.matchUpdates ?? true);
        setNewsUpdates(parsed.newsUpdates ?? true);
        setFavoriteTeams(parsed.favoriteTeams ?? true);
        setChatbotTips(parsed.chatbotTips ?? false);
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    }
  };

  const saveSettings = async (key: string, value: boolean) => {
    try {
      const settings = {
        pushEnabled,
        matchUpdates,
        newsUpdates,
        favoriteTeams,
        chatbotTips,
        [key]: value,
      };
      await AsyncStorage.setItem(
        "notification_settings",
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("설정 저장 실패:", error);
    }
  };

  const handleToggle = (
    key: string,
    setter: (val: boolean) => void,
    value: boolean,
  ) => {
    setter(value);
    saveSettings(key, value);
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
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* 푸시 알림 */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>푸시 알림</Text>
                <Text style={styles.settingDescription}>
                  모든 알림 수신 여부
                </Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) =>
                handleToggle("pushEnabled", setPushEnabled, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* 알림 종류 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>알림 종류</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="football" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>경기 업데이트</Text>
                <Text style={styles.settingDescription}>
                  실시간 경기 결과 및 일정
                </Text>
              </View>
            </View>
            <Switch
              value={matchUpdates}
              onValueChange={(val) =>
                handleToggle("matchUpdates", setMatchUpdates, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="newspaper" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>뉴스 알림</Text>
                <Text style={styles.settingDescription}>새로운 축구 뉴스</Text>
              </View>
            </View>
            <Switch
              value={newsUpdates}
              onValueChange={(val) =>
                handleToggle("newsUpdates", setNewsUpdates, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="heart" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>팔로우 팀</Text>
                <Text style={styles.settingDescription}>
                  팔로우한 팀의 소식
                </Text>
              </View>
            </View>
            <Switch
              value={favoriteTeams}
              onValueChange={(val) =>
                handleToggle("favoriteTeams", setFavoriteTeams, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
              disabled={!pushEnabled}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubbles" size={22} color={Colors.text} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>AI 챗봇 팁</Text>
                <Text style={styles.settingDescription}>
                  AI 어시스턴트의 유용한 팁
                </Text>
              </View>
            </View>
            <Switch
              value={chatbotTips}
              onValueChange={(val) =>
                handleToggle("chatbotTips", setChatbotTips, val)
              }
              trackColor={{ false: "#e0e0e0", true: Colors.primary }}
              thumbColor="#ffffff"
              disabled={!pushEnabled}
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
  section: {
    backgroundColor: Colors.surface,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontWeight: "500",
    color: Colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
