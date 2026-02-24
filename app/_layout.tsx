import { Redirect, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../src/constants/colors";
import { LanguageProvider } from "../src/contexts/LanguageContext";
import { AuthProvider, useAuth } from "../src/contexts/AuthContext";
import "../src/i18n";
import { ThemeProvider } from "../src/contexts/ThemeContext";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  if (!userData?.user) return <Redirect href="/profile" />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="match/[id]"
                options={{
                  headerShown: true,
                  headerTransparent: true,
                  headerTitle: "",
                  headerTintColor: "#fff",
                }}
              />
              <Stack.Screen
                name="league/[id]"
                options={{
                  headerShown: true,
                  headerTransparent: true,
                  headerTitle: "",
                  headerTintColor: "#fff",
                }}
              />
            </Stack>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
