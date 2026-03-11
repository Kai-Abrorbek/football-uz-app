import { useState, useEffect, useRef, useTransition } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { io, Socket } from "socket.io-client";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { API_URL } from "../../../constants/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const { width: SCREEN_W } = Dimensions.get("window");
const VIDEO_H = SCREEN_W * (9 / 16);
const SOCKET_URL = API_URL.replace("/api/v1", "");

const NAME_COLORS = [
  "#FF6B6B",
  "#FF9F43",
  "#FECA57",
  "#48DBFB",
  "#FF9FF3",
  "#54A0FF",
  "#5F27CD",
  "#00D2D3",
  "#1DD1A1",
  "#C8D6E5",
];

const getNameColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
};

const getInitial = (name: string) => (name ?? "?").charAt(0).toUpperCase();

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

interface Props {
  match: Match;
}

export default function StreamTab({ match }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const { userData } = useAuth();
  const flatListRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/live-chat`, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("joinMatch", match._id);
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("previousMessages", (msgs: ChatMessage[]) => {
      setMessages(msgs);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: false }),
        100,
      );
    });

    socket.on("newMessage", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    });

    return () => {
      socket.emit("leaveMatch", match._id);
      socket.disconnect();
    };
  }, [match._id]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current) return;
    socketRef.current.emit("sendMessage", {
      matchId: match._id,
      userId: userData?.user.id ?? "anonymous",
      username: userData?.user.username ?? "Guest",
      message: inputText.trim(),
    });
    setInputText("");
  };

  return (
    <View style={styles.container}>
      {/* 영상 고정 높이 */}
      <View style={styles.videoWrapper}>
        <WebView
          source={{ uri: match.streamUrl! }}
          style={StyleSheet.absoluteFill}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
        />
      </View>

      {/* 채팅 영역 - 키보드 높이만큼 줄어듦 */}
      <View style={[styles.chatArea, { marginBottom: keyboardHeight }]}>
        {/* 헤더 */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderLeft}>
            <Text style={styles.chatHeaderTitle}>{t("chat.liveChat")}</Text>
            <View
              style={[
                styles.dot,
                { backgroundColor: isConnected ? "#1DD1A1" : "#FF6B6B" },
              ]}
            />
          </View>
          <Text style={styles.chatHeaderCount}>
            {messages.length}
            {t("chat.messages")}
          </Text>
        </View>

        {/* 메시지 목록 */}
        <ScrollView
          ref={flatListRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((item) => {
            const nameColor = getNameColor(item.userId);
            const isMe = item.userId === userData?.user.id;

            if (isMe) {
              return (
                <View key={item.id} style={styles.myMessageRow}>
                  <View style={styles.myMessageContent}>
                    <Text style={styles.myMessage}>{item.message}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={item.id} style={styles.messageRow}>
                <View style={[styles.avatar, { backgroundColor: nameColor }]}>
                  <Text style={styles.avatarText}>
                    {getInitial(item.username)}
                  </Text>
                </View>
                <View style={styles.messageContent}>
                  <Text style={[styles.username, { color: nameColor }]}>
                    {item.username}
                  </Text>
                  <Text style={styles.message}>{item.message}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* 입력창 */}
        <View style={styles.inputContainer}>
          {userData ? (
            <View
              style={[
                styles.myAvatar,
                { backgroundColor: getNameColor(userData.user.id) },
              ]}
            >
              <Text style={styles.avatarText}>
                {getInitial(userData.user.username)}
              </Text>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              userData
                ? `${t("chat.placeholder")}`
                : `${t("chat.loginRequired")}`
            }
            placeholderTextColor={Colors.textSecondary}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!!userData}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || !userData) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !userData}
          >
            <Text style={styles.sendText}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    videoWrapper: {
      width: SCREEN_W,
      height: VIDEO_H,
      backgroundColor: "#000",
      marginTop: 20,
    },
    chatArea: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    chatHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    chatHeaderTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chatHeaderCount: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    messageList: {
      // flex: 1,
    },
    messageListContent: {
      padding: 12,
      gap: 12,
    },
    messageRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    myAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#fff",
    },
    messageContent: {
      flex: 1,
      gap: 2,
    },
    username: {
      fontSize: 13,
      fontWeight: "700",
    },
    message: {
      fontSize: 14,
      color: Colors.text,
      lineHeight: 20,
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 40,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    input: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      paddingHorizontal: 16,
      backgroundColor: Colors.background,
      color: Colors.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#FF0000",
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: Colors.border,
    },
    sendText: {
      fontSize: 25,
      fontWeight: "700",
      color: "#fff",
    },
    myMessageRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    myMessageContent: {
      maxWidth: "70%",
      backgroundColor: "#FF0000",
      borderRadius: 16,
      borderBottomRightRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    myMessage: {
      fontSize: 14,
      color: "#fff",
      lineHeight: 20,
    },
  });
