import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { ENDPOINTS } from "../../src/constants/api";
import api from "../../src/services/api";
import { useAuth } from "../../src/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Status = "loading" | "success" | "error";

export default function VerifyEmailScreen() {
  const { userData, setUser, logout } = useAuth();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        await api.post(ENDPOINTS.authVerifyEmail, { token });
        setStatus("success");

        // AsyncStorage 업데이트
        const stored = await AsyncStorage.getItem("user_data");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.user.isEmailVerified = true;
          await AsyncStorage.setItem("user_data", JSON.stringify(parsed));
        }
      } catch (e) {
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {status === "loading" && (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.message}>
              {t("auth.emailVerification.verifying")}
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: "#22c55e20" }]}>
              <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            </View>
            <Text style={styles.title}>
              {t("auth.emailVerification.successTitle")}
            </Text>
            <Text style={styles.message}>
              {t("auth.emailVerification.successMessage")}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace("/(tabs)/profile")}
            >
              <Text style={styles.buttonText}>
                {t("auth.emailVerification.goToProfile")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {status === "error" && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: "#ef444420" }]}>
              <Ionicons name="close-circle" size={64} color="#ef4444" />
            </View>
            <Text style={styles.title}>
              {t("auth.emailVerification.errorTitle")}
            </Text>
            <Text style={styles.message}>
              {t("auth.emailVerification.errorMessage")}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace("/(tabs)/profile")}
            >
              <Text style={styles.buttonText}>
                {t("auth.emailVerification.goToProfile")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      gap: 16,
    },
    iconCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: Colors.text,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
    },
    button: {
      marginTop: 8,
      backgroundColor: Colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
    },
    buttonText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
