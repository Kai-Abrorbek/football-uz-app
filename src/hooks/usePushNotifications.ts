import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "../services/api";
import { ENDPOINTS } from "../constants/api";
import { useAuth } from "../contexts/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function usePushNotifications() {
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData?.user) return;
    registerForPushNotifications();
  }, [userData?.user]);

  const registerForPushNotifications = async () => {
    if (Platform.OS === "web") return;

    if (!Device.isDevice) {
      console.log("실제 기기에서만 FCM 토큰 발급 가능");
      return;
    }

    // 권한 요청
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("알림 권한 거부됨");
      return;
    }

    // FCM 토큰 발급
    const token = (await Notifications.getDevicePushTokenAsync()).data;

    // 백엔드에 저장
    try {
      await api.post(ENDPOINTS.fcmToken, { token });
    } catch (e) {
      console.error("FCM 토큰 저장 실패:", e);
    }

    // 안드로이드 채널 설정
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  };
}
