import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../src/contexts/AuthContext";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { useTranslation } from "react-i18next";
import api from "../../src/services/api";
import { AuthResponseDto } from "../../src/types";
import { ENDPOINTS } from "../../src/constants/api";

export default function EditProfileScreen() {
  const { userData, setUser } = useAuth();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const [name, setName] = useState(userData?.user?.username || "");
  const [email, setEmail] = useState(userData?.user?.email || "");
  const [avatar, setAvatar] = useState(userData?.user?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert(t("editProfile.photoPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert(t("editProfile.nameRequired"));
      return;
    }

    setIsLoading(true);

    try {
      const response: any = await api.post(ENDPOINTS.userProfile, {
        username: name,
        avatar: avatar || undefined,
      });

      const updatedUser: AuthResponseDto = {
        accessToken: userData?.accessToken || "",
        user: {
          id: response.id,
          username: response.username,
          email: response.email,
          language: response.language,
          avatar: response.avatar,
        },
      };

      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (Platform.OS === "web") {
        alert(t("editProfile.success"));
      } else {
        Alert.alert("✅", t("editProfile.success"));
      }

      router.back();
    } catch (error: any) {
      console.error("프로필 수정 실패:", error);
      const message = error.response?.data?.message || t("editProfile.error");
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("editProfile.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 아바타 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {avatar ? (
              <Image source={avatar} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>{t("editProfile.avatarHint")}</Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.name")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t("editProfile.namePlaceholder")}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.email")}</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor={Colors.textSecondary}
            />
            <Text style={styles.hint}>{t("editProfile.emailHint")}</Text>
          </View>
        </View>

        {/* 저장 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>{t("editProfile.save")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
    },
    content: {
      padding: 24,
    },
    avatarSection: {
      alignItems: "center",
      marginBottom: 40,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 12,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 48,
      fontWeight: "700",
      color: "#ffffff",
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: Colors.background,
    },
    avatarHint: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    form: {
      gap: 24,
      marginBottom: 32,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    input: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: Colors.text,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    inputDisabled: {
      backgroundColor: Colors.surface,
      opacity: 0.5,
    },
    hint: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 4,
    },
    saveButton: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
    },
  });
