import React, { useState, useEffect, use } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import uuid from "react-native-uuid";
import axios from "axios";
import { FontAwesome5 } from "@expo/vector-icons";
import { composeInitialProps, useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { API_URL } from "../../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../contexts/AuthContext";
import { router } from "expo-router";
import { useAlert } from "../../utils/alert";

export default function TelegramLoginButton() {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { setUser } = useAuth();
  const [isWaiting, setIsWaiting] = useState(false);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const { AlertComponent, sweetMixinSuccessAlert } = useAlert();

  const BOT_USERNAME = "footballuz2026_bot";
  const BACKEND_URL = API_URL;

  const handleLoginPress = async () => {
    const token = uuid.v4().toString();
    setLoginToken(token);
    setIsWaiting(true);

    const telegramUrl = `tg://resolve?domain=${BOT_USERNAME}&start=${token}`;
    await Linking.openURL(telegramUrl);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWaiting && loginToken) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(
            `${BACKEND_URL}/auth/telegram/status?token=${loginToken}`,
          );

          if (res.data.status === "SUCCESS") {
            clearInterval(interval);
            setIsWaiting(false);

            // ✅ JWT 저장
            const { accessToken, user } = res.data;
            await AsyncStorage.setItem("auth_token", accessToken);
            await AsyncStorage.setItem("user_data", JSON.stringify(res.data));

            setUser({
              accessToken: accessToken,
              user: user,
            });

            sweetMixinSuccessAlert(
              t("auth.telegram.successMessage", { name: user.username }),
            );
          }
        } catch (error) {
          console.error("상태 체크 에러:", error);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isWaiting, loginToken]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleLoginPress}
        disabled={isWaiting}
      >
        <FontAwesome5 name="telegram" size={24} color="#e4e9ec" />
        <Text style={styles.buttonText}>
          {isWaiting ? t("auth.telegram.waiting") : t("auth.telegram.login")}
        </Text>
      </TouchableOpacity>

      {isWaiting && (
        <ActivityIndicator
          size="large"
          color="#229ED9"
          style={{ marginTop: 20 }}
        />
      )}
      {AlertComponent}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
    },
    button: {
      backgroundColor: "#0b99db",
      paddingVertical: 8,
      paddingHorizontal: 44,
      borderRadius: 8,
      flexDirection: "row",
      gap: 15,
    },
    buttonText: {
      color: Colors.text,
      fontWeight: "700",
      fontSize: 16,
    },
  });
