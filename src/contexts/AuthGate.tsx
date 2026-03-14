import { Redirect } from "expo-router";
import { useAuth } from "./AuthContext";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  if (!userData?.user) return <Redirect href="/profile" />;
  return <>{children}</>;
}
