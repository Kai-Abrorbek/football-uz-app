import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../../src/constants/colors";
import { ENDPOINTS } from "../../src/constants/api";
import api from "../../src/services/api";
import { AuthResponseDto } from "../../src/types";
import { Platform } from "react-native";
import TelegramLoginButton from "../../src/components/common/TelegramLoginButton";
import { useGoogleAuth } from "../../src/hooks/useGoogleAuth";
import { useAuth } from "../../src/contexts/AuthContext";
import { router } from "expo-router";

export default function ProfileScreen() {
  const { userData, setUser, logout } = useAuth();

  // const [userData, setUser] = useState<AuthResponseDto | null>(null);
  const [isLogin, setIsLogin] = useState(true); // true: 로그인, false: 회원가입

  // 폼 상태
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요");
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
      console.error("로그인 실패:", error);
      const message = error.response?.data?.message || "로그인에 실패했습니다";
      alert(message);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      alert("모든 필드를 입력해주세요");
      return;
    }

    if (name.length < 3) {
      alert("이름은 3자 이상이어야 합니다");
      return;
    }

    if (password.length < 6) {
      alert("비밀번호는 6자 이상이어야 합니다");
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
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      const message =
        error.response?.data?.message || "회원가입에 실패했습니다";
      alert(message);
    }
  };

  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      console.log("Telegram 유저:", telegramUser);

      const response: AuthResponseDto = await api.post(ENDPOINTS.authSocial, {
        provider: "telegram",
        token: telegramUser.hash,
        data: telegramUser,
      });

      await AsyncStorage.setItem("auth_token", response.accessToken);
      await AsyncStorage.setItem("user_data", JSON.stringify(response));
      setUser(response);
    } catch (error: any) {
      console.error("Telegram 로그인 실패:", error);
      alert("Telegram 로그인에 실패했습니다");
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
      console.error("Google 로그인 실패:", error);
      alert("Google 로그인에 실패했습니다");
    }
  };

  const { promptAsync, isReady } = useGoogleAuth(handleGoogleSuccess);

  const handleLogout = async () => {
    console.log("로그아웃 버튼 클릭");

    if (Platform.OS === "web") {
      if (window.confirm("정말 로그아웃 하시겠습니까?")) {
        logout();
      }
    } else {
      Alert.alert("로그아웃", "정말 로그아웃 하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            logout();
          },
        },
      ]);
    }
  };

  // 로그인/회원가입 화면
  if (!userData?.user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          {/* 로고/아이콘 */}
          <View style={styles.authHeader}>
            <View style={styles.logoCircle}>
              <Ionicons name="football" size={60} color={Colors.primary} />
            </View>
            <Text style={styles.authTitle}>Football UZ</Text>
            <Text style={styles.authSubtitle}>
              {isLogin ? "로그인하여 계속하세요" : "계정을 만들어 시작하세요"}
            </Text>
          </View>

          {/* 폼 */}
          <View style={styles.formContainer}>
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.textSecondary}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="홍길동"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
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
                {isLogin ? "로그인" : "회원가입"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
                <Text style={styles.switchButtonTextBold}>
                  {isLogin ? "회원가입" : "로그인"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialContainer}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* <View style={{ marginBottom: 12 }}>
              <TelegramLoginButton
                botName="footballuz2026_bot"
                onAuth={handleTelegramLogin}
              />
            </View> */}

            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => promptAsync()}
              disabled={!isReady}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>Google로 계속하기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 프로필 화면 (로그인 후)
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        {/* 헤더 */}
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

        {/* 통계 */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>팔로잉 팀</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>45</Text>
            <Text style={styles.statLabel}>저장된 경기</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>89</Text>
            <Text style={styles.statLabel}>읽은 뉴스</Text>
          </View>
        </View>

        {/* 메뉴 */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>설정</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/profile/edit")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>프로필 수정</Text>
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
              <Text style={styles.menuItemText}>알림 설정</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="language-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>언어 설정</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={22} color={Colors.text} />
              <Text style={styles.menuItemText}>다크 모드</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuSectionTitle}>지원</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color={Colors.text}
              />
              <Text style={styles.menuItemText}>도움말</Text>
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
              <Text style={styles.menuItemText}>개인정보 처리방침</Text>
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
              <Text style={styles.menuItemText}>이용약관</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ff3b30" />
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.version}>버전 1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // 인증 화면
  authContainer: {
    padding: 24,
  },
  authHeader: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
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
  authSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
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
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  switchButton: {
    marginTop: 20,
    alignItems: "center",
  },
  switchButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  switchButtonTextBold: {
    fontWeight: "700",
    color: Colors.primary,
  },
  socialContainer: {
    marginTop: 12,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
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
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  // 프로필 화면
  profileHeader: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.surface,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#ffffff",
  },
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
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
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
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
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
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ff3b30",
  },
  version: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
  },
});
