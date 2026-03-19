import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useColors } from "../src/hooks/useColors";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { AuthProvider } from "../src/contexts/AuthContext";
import "../src/i18n";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import { ErrorProvider } from "../src/contexts/ErrorContext";

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
