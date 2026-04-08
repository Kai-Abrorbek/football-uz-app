import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColors } from "../src/hooks/useColors";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import "../src/i18n";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ErrorProvider } from "../src/contexts/ErrorContext";
import notifee, { EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import { useAlert } from "../src/utils/alert";
import { useEffect } from "react";
import { apiErrorEmitter } from "../src/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createNotificationChannels } from "../src/services/notificationService";

const queryClient = new QueryClient();

function StackLayout() {
  const Colors = useColors();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.surface2 },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="match/[id]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerTintColor: Colors.tabBarActive,
          }}
        />
        <Stack.Screen
          name="league/[id]"
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerTintColor: Colors.tabBarActive,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const { sweetErrorAlert, AlertComponent } = useAlert();

  useEffect(() => {
    // ✅ 채널 생성
    createNotificationChannels();

    // ✅ 1. Quit State: FCM으로 직접 열린 경우
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage?.data?.referenceId) {
          setTimeout(() => {
            router.push(`/match/${remoteMessage.data!.referenceId}`);
          }, 300);
          return;
        }

        // Notifee 경유 (onBackgroundEvent에서 저장한 경우)
        AsyncStorage.getItem("pendingNavigation").then((referenceId) => {
          if (referenceId) {
            AsyncStorage.removeItem("pendingNavigation");
            setTimeout(() => {
              router.push(`/match/${referenceId}`);
            }, 300);
          }
        });
      });

    // ✅ 2. Background State: FCM 알림 클릭
    const unsubscribeFCMBackground = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        if (remoteMessage?.data?.referenceId) {
          router.push(`/match/${remoteMessage.data.referenceId}`);
        }
      },
    );

    // ✅ 3. Foreground: Notifee 알림 클릭
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification?.data?.referenceId) {
        router.push(`/match/${detail.notification.data.referenceId}`);
      }
    });

    return () => {
      unsubscribeFCMBackground();
      unsubscribeNotifee();
    };
  }, []);

  // API 에러 핸들러
  useEffect(() => {
    const handler = (msg: string) => sweetErrorAlert(msg);
    apiErrorEmitter.on("error", handler);
    return () => {
      apiErrorEmitter.off("error", handler);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ErrorProvider>
            <LanguageProvider>
              <StackLayout />
              {AlertComponent}
            </LanguageProvider>
          </ErrorProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
