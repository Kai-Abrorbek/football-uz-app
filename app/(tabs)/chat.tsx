import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import api from "../../src/services/api";
import { getColors } from "../../src/constants/colors";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { useAuth } from "../../src/contexts/AuthContext";
import { useColors } from "../../src/hooks/useColors";
import { useTranslation } from "react-i18next";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { language } = useLanguage();
  const { userData, setUser, logout } = useAuth();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userData?.user) {
      loadUserSession();
    } else {
      setMessages([]);
      setSessionId(null);
    }
  }, [userData?.user.id]);

  const checkAuth = async () => {
    try {
      const userData: any = await AsyncStorage.getItem("user_data");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("인증 확인 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserSession = async () => {
    if (!userData?.user.id) return;
    try {
      const userSessionKey = `chat_session_${userData.user.id}`;
      const savedSessionId = await AsyncStorage.getItem(userSessionKey);

      if (savedSessionId) {
        const sessionData: any = await api.get(
          `/chat/session/${savedSessionId}`,
        );
        setSessionId(savedSessionId);
        setMessages(
          sessionData.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          })),
        );
      }
    } catch (error) {
      console.error("세션 로드 실패:", error);
      const userMessagesKey = `chat_messages_${userData.user.id}`;
      const savedMessages = await AsyncStorage.getItem(userMessagesKey);
      setMessages(savedMessages ? JSON.parse(savedMessages) : []);
    }
  };

  const saveSession = async (newMessages: Message[], newSessionId: string) => {
    if (!userData?.user.id) return;
    try {
      const userSessionKey = `chat_session_${userData.user.id}`;
      const userMessagesKey = `chat_messages_${userData.user.id}`;
      await AsyncStorage.setItem(userSessionKey, newSessionId);
      await AsyncStorage.setItem(userMessagesKey, JSON.stringify(newMessages));
    } catch (error) {
      console.error("세션 저장 실패:", error);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const data = await api.post("/chat", {
        message,
        language,
        sessionId,
      });
      return data;
    },
    onSuccess: (data: any, message) => {
      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      const newMessages = [...messages, userMessage, assistantMessage];
      setMessages(newMessages);

      if (data.sessionId) {
        setSessionId(data.sessionId);
        saveSession(newMessages, data.sessionId);
      }

      setInputText("");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error) => {
      console.error("메시지 전송 실패:", error);
    },
  });

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessageMutation.mutate(inputText.trim());
  };

  const handleNewChat = async () => {
    if (!userData?.user.id) return;
    setMessages([]);
    setSessionId(null);
    const userSessionKey = `chat_session_${userData.user.id}`;
    const userMessagesKey = `chat_messages_${userData.user.id}`;
    await AsyncStorage.removeItem(userSessionKey);
    await AsyncStorage.removeItem(userMessagesKey);
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="football" size={20} color="#ffffff" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  const renderSuggestions = () => {
    const suggestions = [
      t("chat.suggestions.one"),
      t("chat.suggestions.two"),
      t("chat.suggestions.three"),
      t("chat.suggestions.four"),
    ];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>{t("chat.helpTitle")}</Text>
        <View style={styles.suggestionsGrid}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => setInputText(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userData?.user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconLarge}>
            <Ionicons name="lock-closed" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t("chat.loginRequired")}</Text>
          <Text style={styles.emptySubtitle}>{t("chat.loginSubtitle")}</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.loginButtonText}>{t("chat.loginButton")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="football" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>{t("chat.title")}</Text>
            <Text style={styles.headerSubtitle}>{t("chat.subtitle")}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <>
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="chatbubbles"
                    size={60}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.emptyTitle}>{t("chat.emptyTitle")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("chat.emptySubtitle")}
                </Text>
              </View>
              {renderSuggestions()}
            </>
          ) : (
            messages.map(renderMessage)
          )}

          {sendMessageMutation.isPending && (
            <View style={styles.loadingMessageContainer}>
              <View style={styles.botAvatar}>
                <Ionicons name="football" size={20} color="#ffffff" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t("chat.placeholder")}
              placeholderTextColor={Colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!sendMessageMutation.isPending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sendMessageMutation.isPending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessageMutation.isPending}
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() && !sendMessageMutation.isPending
                    ? "#ffffff"
                    : Colors.textSecondary
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    newChatButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 16,
      paddingBottom: 8,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: Colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyIconLarge: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    loginButton: {
      marginTop: 24,
      backgroundColor: Colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 24,
    },
    loginButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
    },
    suggestionsContainer: {
      marginTop: 40,
      paddingHorizontal: 16,
    },
    suggestionsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.textSecondary,
      marginBottom: 12,
    },
    suggestionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    suggestionChip: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    suggestionText: {
      fontSize: 13,
      color: Colors.text,
      fontWeight: "500",
    },
    messageContainer: {
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "flex-end",
    },
    userMessageContainer: {
      justifyContent: "flex-end",
    },
    assistantMessageContainer: {
      justifyContent: "flex-start",
    },
    botAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    messageBubble: {
      maxWidth: "75%",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
    },
    userBubble: {
      backgroundColor: Colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: Colors.surface,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
      color: Colors.text,
    },
    userMessageText: {
      color: "#ffffff",
    },
    loadingMessageContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: 16,
    },
    loadingBubble: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 20,
      borderBottomLeftRadius: 4,
    },
    inputContainer: {
      padding: 16,
      backgroundColor: Colors.surface,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
      backgroundColor: Colors.background,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
      maxHeight: 100,
      paddingVertical: 8,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: Colors.border,
    },
  });
