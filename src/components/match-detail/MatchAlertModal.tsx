import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  matchId: string;
}

interface MatchAlert {
  matchStart: boolean;
  goals: boolean;
  matchEnd: boolean;
}

export default function MatchAlertModal({ visible, onClose, matchId }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  const { data: alert } = useQuery<MatchAlert | null>({
    queryKey: ["matchAlert", matchId],
    queryFn: () => api.get(ENDPOINTS.matchAlert(matchId)),
    enabled: !!userData?.user && visible,
  });

  const isAlertOn = !!alert;

  const { mutate: setAlert } = useMutation({
    mutationFn: (settings: MatchAlert) =>
      api.post(ENDPOINTS.matchAlertSet(matchId), settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchAlert", matchId] });
    },
  });

  const { mutate: deleteAlert } = useMutation({
    mutationFn: () => api.delete(ENDPOINTS.matchAlertDelete(matchId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matchAlert", matchId] });
    },
  });

  const handleToggleAlert = () => {
    if (!userData?.user) {
      Alert.alert(t("matchAlert.loginRequired"));
      return;
    }

    if (isAlertOn) {
      deleteAlert();
    } else {
      setAlert({ matchStart: true, goals: true, matchEnd: true });
    }
  };

  const handleToggleSetting = (key: keyof MatchAlert) => {
    if (!alert) return;
    setAlert({ ...alert, [key]: !alert[key] });
  };

  // 전체 알람 꺼져 있는지 체크
  const globalAlertsOff =
    !userData?.user?.notificationSettings?.matchStart &&
    !userData?.user?.notificationSettings?.goals &&
    !userData?.user?.notificationSettings?.matchEnd;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={styles.sheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("matchAlert.title")}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* 전체 알람 꺼져 있으면 경고 */}
          {globalAlertsOff && isAlertOn && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                {t("matchAlert.globalOff")}
              </Text>
            </View>
          )}

          {/* 알람 ON/OFF 토글 */}
          <View style={styles.mainToggleRow}>
            <View style={styles.mainToggleLeft}>
              <Ionicons
                name={isAlertOn ? "notifications" : "notifications-off-outline"}
                size={24}
                color={isAlertOn ? Colors.primary : Colors.textSecondary}
              />
              <Text style={styles.mainToggleText}>
                {t("matchAlert.receiveAlert")}
              </Text>
            </View>
            <Switch
              value={isAlertOn}
              onValueChange={handleToggleAlert}
              trackColor={{ false: Colors.border, true: Colors.primary + "80" }}
              thumbColor={isAlertOn ? Colors.primary : "#f4f3f4"}
            />
          </View>

          {/* 세부 설정 */}
          {isAlertOn && alert && (
            <View style={styles.settings}>
              <View style={styles.divider} />

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>
                  {t("matchAlert.matchStart")}
                </Text>
                <Switch
                  value={alert.matchStart}
                  onValueChange={() => handleToggleSetting("matchStart")}
                  trackColor={{
                    false: Colors.border,
                    true: Colors.primary + "80",
                  }}
                  thumbColor={alert.matchStart ? Colors.primary : "#f4f3f4"}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t("matchAlert.goals")}</Text>
                <Switch
                  value={alert.goals}
                  onValueChange={() => handleToggleSetting("goals")}
                  trackColor={{
                    false: Colors.border,
                    true: Colors.primary + "80",
                  }}
                  thumbColor={alert.goals ? Colors.primary : "#f4f3f4"}
                />
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>
                  {t("matchAlert.matchEnd")}
                </Text>
                <Switch
                  value={alert.matchEnd}
                  onValueChange={() => handleToggleSetting("matchEnd")}
                  trackColor={{
                    false: Colors.border,
                    true: Colors.primary + "80",
                  }}
                  thumbColor={alert.matchEnd ? Colors.primary : "#f4f3f4"}
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: Colors.border,
    },
    warningBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#fef3c7",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    warningText: { fontSize: 13, color: "#92400e", flex: 1 },
    mainToggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
    },
    mainToggleLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    mainToggleText: { fontSize: 16, fontWeight: "600", color: Colors.text },
    settings: { paddingHorizontal: 16 },
    divider: { height: 1, backgroundColor: Colors.border, marginBottom: 8 },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    settingLabel: { fontSize: 15, color: Colors.text },
  });
