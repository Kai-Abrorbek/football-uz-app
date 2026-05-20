import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColors } from "../src/hooks/useColors";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import "../src/i18n";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ErrorProvider } from "../src/contexts/ErrorContext";
import { useAlert } from "../src/utils/alert";
import { useEffect } from "react";
import { apiErrorEmitter } from "../src/services/api";
import { Platform } from "react-native";

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
    // 웹에서는 FCM/Notifee 스킵
    if (Platform.OS === "web") return;

    const initNative = async () => {
      const { createNotificationChannels } =
        await import("../src/services/notificationService");
      const messaging = (await import("@react-native-firebase/messaging"))
        .default;
      const notifee = (await import("@notifee/react-native")).default;
      const { EventType } = await import("@notifee/react-native");
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;

      createNotificationChannels();

      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage?.data?.referenceId) {
            setTimeout(() => {
              router.push(`/match/${remoteMessage.data!.referenceId}`);
            }, 300);
            return;
          }

          AsyncStorage.getItem("pendingNavigation").then((referenceId) => {
            if (referenceId) {
              AsyncStorage.removeItem("pendingNavigation");
              setTimeout(() => {
                router.push(`/match/${referenceId}`);
              }, 300);
            }
          });
        });

      const unsubscribeFCMBackground = messaging().onNotificationOpenedApp(
        (remoteMessage) => {
          if (remoteMessage?.data?.referenceId) {
            router.push(`/match/${remoteMessage.data.referenceId}`);
          }
        },
      );

      const unsubscribeNotifee = notifee.onForegroundEvent(
        ({ type, detail }) => {
          if (
            type === EventType.PRESS &&
            detail.notification?.data?.referenceId
          ) {
            router.push(`/match/${detail.notification.data.referenceId}`);
          }
        },
      );

      return () => {
        unsubscribeFCMBackground();
        unsubscribeNotifee();
      };
    };

    initNative();
  }, []);

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
