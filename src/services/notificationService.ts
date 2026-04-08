import notifee, {
  AndroidImportance,
  AndroidVisibility,
} from "@notifee/react-native";
import { router } from "expo-router";

// 채널 ID 상수 (서버 channelId: 'default'와 일치)
export const NOTIFICATION_CHANNEL_ID = "default";

// 앱 시작 시 채널 생성
export async function createNotificationChannels() {
  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: "기본 알림",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: "default",
    vibration: true,
  });
}

// 알림 데이터로 네비게이션
export function handleNotificationNavigation(data?: Record<string, string>) {
  if (!data) return;

  if (data.referenceId) {
    router.push(`/match/${data.referenceId}`);
  }
}

// Notifee로 알림 직접 표시 (data-only 또는 background 재표시용)
export async function displayNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: "default", // ← 클릭 이벤트 발생의 핵심
        launchActivity: "default",
      },
      showTimestamp: true,
    },
  });
}
