import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponseDto } from "../types";

interface AuthContextType {
  userData: AuthResponseDto | null;
  setUser: (userData: AuthResponseDto | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userData, setUser] = useState<AuthResponseDto | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem("user_data");
    if (userData) setUser(JSON.parse(userData));
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("user_data");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ userData, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
