// apps/mobile/index.ts
import "expo-router/entry";
import notifee, { EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ FCM Background/Quit 핸들러
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const title =
    remoteMessage.notification?.title ??
    (remoteMessage.data?.title as string) ??
    "Football UZ";
  const body =
    remoteMessage.notification?.body ??
    (remoteMessage.data?.body as string) ??
    "";

  await notifee.displayNotification({
    title: String(title),
    body: String(body),
    data: remoteMessage.data as Record<string, string>,
    android: {
      channelId: "default",
      importance: 4,
      pressAction: {
        id: "default",
        launchActivity: "default",
      },
    },
  });
});

// ✅ Notifee Background 클릭 핸들러
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const referenceId = detail.notification?.data?.referenceId;
    if (referenceId) {
      await AsyncStorage.setItem("pendingNavigation", String(referenceId));
    }
  }
});
