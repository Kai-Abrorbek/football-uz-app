import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

interface Notification {
  _id: string;
  type: "matchStart" | "goal" | "matchEnd" | "news" | "prediction";
  title: { uz: string; ru: string; en: string; kr: string };
  body: { uz: string; ru: string; en: string; kr: string };
  data?: { screen: string; referenceId: string };
  isRead: boolean;
  sentAt: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "matchStart":
      return { name: "football-outline", color: "#3b82f6" };
    case "goal":
      return { name: "trophy-outline", color: "#f59e0b" };
    case "matchEnd":
      return { name: "flag-outline", color: "#8b5cf6" };
    case "news":
      return { name: "newspaper-outline", color: "#22c55e" };
    case "prediction":
      return { name: "analytics-outline", color: "#ef4444" };
    default:
      return { name: "notifications-outline", color: "#6b7280" };
  }
};

export default function NotificationModal({
  visible,
  onClose,
  onUnreadCountChange,
}: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useAuth();
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const fetchNotifications = useCallback(async () => {
    if (!userData?.user) return;
    setIsLoading(true);
    try {
      const res: any = await api.get(ENDPOINTS.notifications);
      setNotifications(res ?? []);
      const unread = (res ?? []).filter((n: Notification) => !n.isRead).length;
      onUnreadCountChange(unread);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.user]);

  useEffect(() => {
    if (visible) fetchNotifications();
  }, [visible]);

  const handleMarkAllRead = async () => {
    if (!userData?.user) return;
    try {
      await api.patch(ENDPOINTS.notificationsReadAll);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadCountChange(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // 읽음 처리
    if (!notification.isRead) {
      try {
        await api.patch(ENDPOINTS.notificationRead(notification._id));
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n,
          ),
        );
        onUnreadCountChange(
          notifications.filter((n) => !n.isRead && n._id !== notification._id)
            .length,
        );
      } catch (e) {
        console.error(e);
      }
    }

    // 화면 이동
    if (notification.data?.screen && notification.data?.referenceId) {
      onClose();
      switch (notification.data.screen) {
        case "Match":
          router.push(`/match/${notification.data.referenceId}`);
          break;
        case "News":
          router.push(`/news/${notification.data.referenceId}`);
          break;
      }
    }
  };

  const getLang = () => {
    const lang = i18n.language;
    if (lang === "kr") return "kr";
    if (lang === "ru") return "ru";
    if (lang === "uz") return "uz";
    return "en";
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    const lang = getLang();
    const title = item.title?.[lang] ?? item.title?.en ?? "";
    const body = item.body?.[lang] ?? item.body?.en ?? "";

    const timeAgo = () => {
      const diff = Date.now() - new Date(item.sentAt).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 60) return `${mins}${t("notification.minutesAgo")}`;
      if (hours < 24) return `${hours}${t("notification.hoursAgo")}`;
      return `${days}${t("notification.daysAgo")}`;
    };

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {!item.isRead && <View style={styles.unreadBar} />}
        <View
          style={[styles.iconCircle, { backgroundColor: icon.color + "20" }]}
        >
          <Ionicons name={icon.name as any} size={22} color={icon.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {body}
          </Text>
          <Text style={styles.notificationTime}>{timeAgo()}</Text>
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t("notification.title")}</Text>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {notifications.filter((n) => !n.isRead).length}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              {notifications.some((n) => !n.isRead) && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  style={styles.readAllButton}
                >
                  <Text style={styles.readAllText}>
                    {t("notification.markAllRead")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {!userData?.user ? (
            <View style={styles.center}>
              <Ionicons
                name="person-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                {t("notification.loginRequired")}
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Ionicons
                name="notifications-off-outline"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>{t("notification.empty")}</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item._id}
              renderItem={renderNotification}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<View style={{ height: 40 }} />}
            />
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
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      flex: 1,
      marginTop: 60,
      backgroundColor: Colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 18,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.text },
    unreadBadge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    unreadBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    readAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: Colors.primary + "15",
    },
    readAllText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: Colors.border,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    emptyText: { fontSize: 15, color: Colors.textSecondary, fontWeight: "500" },
    notificationItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: 12,
    },
    unreadItem: { backgroundColor: Colors.primary + "08" },
    unreadBar: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    iconCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    notificationContent: { flex: 1, gap: 4 },
    notificationTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
    notificationBody: {
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 19,
    },
    notificationTime: {
      fontSize: 11,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.primary,
      alignSelf: "flex-start",
      marginTop: 4,
    },
  });
