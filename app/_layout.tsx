import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColors } from "../src/hooks/useColors";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import "../src/i18n";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ErrorProvider } from "../src/contexts/ErrorContext";
import notifee, { AndroidStyle } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";
import { useAlert } from "../src/utils/alert";
import { useEffect } from "react";
import { apiErrorEmitter } from "../src/services/api";

const queryClient = new QueryClient();

async function displayRichNotification(data: any) {
  // 1. 안드로이드 채널 생성 (필수)
  const channelId = await notifee.createChannel({
    id: "match_updates",
    name: "Match Updates",
  });

  // 2. 알림 띄우기!
  await notifee.displayNotification({
    title: data.title || "⚽ 경기 업데이트", // 이제 data에서 꺼내 씀
    body: data.body || "점수가 변경되었습니다.",
    android: {
      channelId,
      // 우측에 동그랗게 뜨는 작은 로고 (팀 로고 넣기 좋음)
      largeIcon: data.logoUrl || "https://my-test-url.com/logo.png",
    },
  });
}

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (remoteMessage.data) {
    await displayRichNotification(remoteMessage.data);
  }
});

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
  useEffect(() => {
    // 2. 앱 화면 켜져있을 때 (포그라운드)
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      if (remoteMessage.data) {
        await displayRichNotification(remoteMessage.data);
      }
    });

    return unsubscribe;
  }, []);

  const { sweetErrorAlert, AlertComponent } = useAlert();

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
            </LanguageProvider>
          </ErrorProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
