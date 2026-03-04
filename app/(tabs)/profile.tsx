import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, getColors } from "../../src/constants/colors";
import { ENDPOINTS } from "../../src/constants/api";
import api from "../../src/services/api";
import { AuthResponseDto } from "../../src/types";
import TelegramLoginButton from "../../src/components/common/TelegramLoginButton";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { useAuth } from "../../src/contexts/AuthContext";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";

export default function ProfileScreen() {
  const { userData, setUser, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const handleLogin = async () => {
    if (!email || !password) {
      alert(t("auth.validation.emailPasswordRequired"));
      return;
    }

    try {
      const response: AuthResponseDto = await api.post(ENDPOINTS.authLogin, {
        emailOrUsername: email,
        password,
      });

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("user_data", JSON.stringify(response));
      setUser(response);
    } catch (error: any) {
      console.error("Login failed:", error);
      const message =
        error.response?.data?.message || t("auth.errors.loginFailed");
      alert(message);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert(t("auth.validation.allFieldsRequired"));
      return;
    }

    if (name.length < 3) {
      alert(t("auth.validation.nameMinLength"));
      return;
    }

    if (password.length < 6) {
      alert(t("auth.validation.passwordMinLength"));
      return;
    }

    try {
      const response: AuthResponseDto = await api.post(ENDPOINTS.authRegister, {
        username: name,
        email,
        password,
        language: "uz",
      });

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("user_data", JSON.stringify(response));
      setUser(response);

      // ✅ 이메일 인증 안내
      Alert.alert(
        t("auth.emailVerification.title"),
        t("auth.emailVerification.message"),
        [{ text: t("common.confirm") }],
      );
    } catch (error: any) {
      console.error("Sign up failed:", error);
      const message =
        error.response?.data?.message || t("auth.errors.registerFailed");
      alert(message);
    }
  };

  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      console.log("Telegram user:", telegramUser);

      const response: AuthResponseDto = await api.post(ENDPOINTS.authSocial, {
        provider: "telegram",
        token: telegramUser.hash,
        data: telegramUser,
      });

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("user_data", JSON.stringify(response));
      setUser(response);
    } catch (error: any) {
      console.error("Telegram login failed:", error);
      alert(t("auth.errors.telegramLoginFailed"));
    }
  };

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const response: AuthResponseDto = await api.post(ENDPOINTS.authSocial, {
        provider: "google",
        token: idToken,
        data: {},
      });

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("user_data", JSON.stringify(response));
      setUser(response);
    } catch (error: any) {
      console.error("Google login failed:", error);
      alert(t("auth.errors.googleLoginFailed"));
    }
  };

  const handleResendVerification = async () => {
    try {
      await api.post(ENDPOINTS.authResendVerification, {
        email: userData?.user?.email,
      });
      Alert.alert(
        t("auth.emailVerification.title"),
        t("auth.emailVerification.resendSuccess"),
        [{ text: t("common.confirm") }],
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("auth.errors.resendFailed");
      alert(message);
    }
  };

  const handleEmailVerification = async () => {
    if (userData?.user?.isEmailVerified) {
      if (Platform.OS === "web") {
        window.alert(t("auth.emailVerification.alreadyVerifiedMessage"));
      } else {
        Alert.alert(
          t("auth.emailVerification.alreadyVerifiedTitle"),
          t("auth.emailVerification.alreadyVerifiedMessage"),
          [{ text: t("common.confirm") }],
        );
      }
      return;
    }

    if (Platform.OS === "web") {
      if (
        window.confirm(
          t("auth.emailVerification.resendConfirm", {
            email: userData?.user?.email,
          }),
        )
      ) {
        handleResendVerification();
      }
    } else {
      Alert.alert(
        t("auth.emailVerification.title"),
        t("auth.emailVerification.resendConfirm", {
          email: userData?.user?.email,
        }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("auth.emailVerification.resend"),
            onPress: handleResendVerification,
          },
        ],
      );
    }
  };

  const { promptAsync, isReady } = useGoogleAuth(handleGoogleSuccess);

  const handleLogout = async () => {
    console.log("Logout clicked");

    if (Platform.OS === "web") {
      if (window.confirm(t("auth.logout.confirm"))) {
        logout();
      }
    } else {
      Alert.alert(t("auth.logout.title"), t("auth.logout.confirm"), [
        { text: t("auth.logout.cancel"), style: "cancel" },
        {
          text: t("auth.logout.action"),
          style: "destructive",
          onPress: async () => logout(),
        },
      ]);
    }
  };

  if (!userData?.user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          {!userData?.user?.isEmailVerified && (
            <View style={styles.verificationBanner}>
              <Ionicons name="mail-outline" size={20} color="#fff" />
              <Text style={styles.verificationBannerText}>
                {t("auth.emailVerification.notVerified")}
              </Text>
              <TouchableOpacity
                onPress={handleResendVerification}
                style={styles.resendButton}
              >
                <Text style={styles.resendButtonText}>
                  {t("auth.emailVerification.resend")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.authHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="football" size={60} color={Colors.primary} />
            </View>
            <Text style={styles.authTitle}>{t("auth.brandTitle")}</Text>
            <Text style={styles.authSubtitle}>
              {isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("auth.nameLabel")}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth.namePlaceholder")}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("auth.emailLabel")}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t("auth.passwordLabel")}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={isLogin ? handleLogin : handleRegister}
            >
              <Text style={styles.submitButtonText}>
                {isLogin ? t("auth.login") : t("auth.register")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}
                <Text style={styles.switchButtonTextBold}>
                  {isLogin ? t("auth.register") : t("auth.login")}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.socialContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("auth.or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => promptAsync()}
              disabled={!isReady}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>
                {t("auth.continueWithGoogle")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {userData.user?.avatar ? (
              <Image
                source={userData.user?.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData?.user?.username.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{userData?.user?.username}</Text>
          <Text style={styles.userEmail}>{userData?.user?.email}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>
              {t("profile.stats.followingTeams")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>
              {t("profile.stats.savedMatches")}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>{t("profile.stats.readNews")}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>
            {t("profile.sections.settings")}
          </Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/edit")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>
                {t("profile.menu.editProfile")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/notifications")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>
                {t("profile.menu.notifications")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/language")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="language-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>
                {t("profile.menu.language")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/theme")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>{t("profile.menu.theme")}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEmailVerification}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>
                {t("auth.emailVerification.menuItem")}
              </Text>
            </View>
            <View style={styles.menuItemRight}>
              {userData.user?.isEmailVerified ? (
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              ) : (
                <View style={styles.unverifiedDot} />
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>
            {t("profile.sections.support")}
          </Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>{t("profile.menu.help")}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>
                {t("profile.menu.privacy")}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>{t("profile.menu.terms")}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          <Text style={styles.logoutButtonText}>{t("auth.logout.action")}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          {t("profile.version", { version: "1.0.0" })}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// styles 그대로
const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    authContainer: { padding: 24 },
    authHeader: { alignItems: "center", marginTop: 40, marginBottom: 40 },
    logoCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#f0e6ff",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    authTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: Colors.text,
      marginBottom: 8,
    },
    authSubtitle: { fontSize: 14, color: Colors.textSecondary },
    formContainer: { marginBottom: 32 },
    inputGroup: { marginBottom: 20 },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    input: { flex: 1, fontSize: 15, color: Colors.text },
    submitButton: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 8,
    },
    submitButtonText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
    switchButton: { marginTop: 20, alignItems: "center" },
    switchButtonText: { fontSize: 14, color: Colors.textSecondary },
    switchButtonTextBold: { fontWeight: "700", color: Colors.primary },
    socialContainer: { marginTop: 12 },
    divider: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: {
      fontSize: 13,
      color: Colors.textSecondary,
      paddingHorizontal: 16,
    },
    socialButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      marginBottom: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    socialButtonText: { fontSize: 15, fontWeight: "600", color: Colors.text },

    profileHeader: {
      alignItems: "center",
      paddingVertical: 32,
      backgroundColor: Colors.surface,
    },
    avatarContainer: { position: "relative", marginBottom: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontSize: 36, fontWeight: "700", color: "#ffffff" },
    editAvatarButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: Colors.surface,
    },
    userName: {
      fontSize: 22,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 4,
    },
    userEmail: { fontSize: 14, color: Colors.textSecondary },

    statsContainer: {
      flexDirection: "row",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      padding: 20,
    },
    statBox: { flex: 1, alignItems: "center" },
    statValue: {
      fontSize: 24,
      fontWeight: "800",
      color: Colors.text,
      marginBottom: 4,
    },
    statLabel: { fontSize: 12, color: Colors.textSecondary },
    statDivider: {
      width: 1,
      backgroundColor: Colors.border,
      marginHorizontal: 8,
    },

    menuContainer: { marginTop: 24, paddingHorizontal: 16 },
    menuSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 12,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    menuItemText: { fontSize: 15, fontWeight: "500", color: Colors.text },

    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 24,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: "#ff3b30",
    },
    logoutButtonText: { fontSize: 15, fontWeight: "600", color: "#ff3b30" },
    version: {
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "center",
      marginTop: 24,
    },

    verificationBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f59e0b",
      padding: 12,
      gap: 8,
    },
    verificationBannerText: {
      flex: 1,
      fontSize: 13,
      color: "#fff",
      fontWeight: "500",
    },
    resendButton: {
      backgroundColor: "rgba(255,255,255,0.25)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    resendButtonText: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "700",
    },
    menuItemRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    unverifiedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#ef4444",
    },
  });
