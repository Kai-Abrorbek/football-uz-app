import { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";
import api from "../../src/services/api";
import {
  toggleFollowLeague,
  toggleFollowPlayer,
  toggleFollowTeam,
} from "../../src/constants/followService";
import { getColors } from "../../src/constants/colors";
import { ENDPOINTS } from "../../src/constants/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Tab = "teams" | "players" | "leagues";

interface Props {
  visible: boolean;
  onClose: () => void;
  activeTab: Tab;
  followingTeams: any[];
  followingPlayers: any[];
  followingLeagues: any[];
  suggestedTeams: any[];
  suggestedPlayers: any[];
  suggestedLeagues: any[];
  onFollowChange: () => void;
}

export default function FollowSearchModal({
  visible,
  onClose,
  activeTab,
  followingTeams,
  followingPlayers,
  followingLeagues,
  onFollowChange,
  suggestedLeagues,
  suggestedPlayers,
  suggestedTeams,
}: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const inputRef = useRef<TextInput>(null);

  const { data: searchResults, isLoading } = useQuery<any[]>({
    queryKey: ["follow-search", activeTab, searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      if (activeTab === "teams") {
        return api.get(`/teams/search?q=${searchQuery}`);
      }
      if (activeTab === "players") {
        return api.get(`/players/search?q=${searchQuery}`);
      }
      if (activeTab === "leagues") {
        return api.get(`/leagues/search?q=${searchQuery}`);
      }
      return [];
    },
    enabled: searchQuery.trim().length > 0,
  });

  const isFollowing = (id: number) => {
    if (activeTab === "teams")
      return followingTeams.some((t) => t.apiFootballId === id);
    if (activeTab === "players")
      return followingPlayers.some((p) => p.apiFootballId === id);
    if (activeTab === "leagues")
      return followingLeagues.some((l) => l.apiFootballId === id);
    return false;
  };

  const handleToggle = async (id: number) => {
    if (activeTab === "teams") await toggleFollowTeam(id);
    if (activeTab === "players") await toggleFollowPlayer(id);
    if (activeTab === "leagues") await toggleFollowLeague(id);
    onFollowChange();
  };

  const getDisplayData = () => {
    if (searchQuery.trim().length > 0) return searchResults ?? [];

    if (activeTab === "teams") {
      const suggestedNotFollowing = suggestedTeams.filter(
        (s) => !followingTeams.some((f) => f.apiFootballId === s.apiFootballId),
      );
      return [...followingTeams, ...suggestedNotFollowing];
    }
    if (activeTab === "players") {
      const suggestedNotFollowing = suggestedPlayers.filter(
        (s) =>
          !followingPlayers.some((f) => f.apiFootballId === s.apiFootballId),
      );
      return [...followingPlayers, ...suggestedNotFollowing];
    }
    if (activeTab === "leagues") {
      const suggestedNotFollowing = suggestedLeagues.filter(
        (s) =>
          !followingLeagues.some((f) => f.apiFootballId === s.apiFootballId),
      );
      return [...followingLeagues, ...suggestedNotFollowing];
    }
    return [];
  };

  const renderItem = ({ item }: { item: any }) => {
    const following = isFollowing(item.apiFootballId);
    const logo = item.logo || item.photo;

    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          {logo ? (
            <Image source={logo} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, { backgroundColor: Colors.border }]} />
          )}
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.followBtn, following && styles.followBtnActive]}
          onPress={() => handleToggle(item.apiFootballId)}
        >
          <Text
            style={[
              styles.followBtnText,
              following && styles.followBtnTextActive,
            ]}
          >
            {following ? "팔로잉" : "팔로우"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => inputRef.current?.focus()}
    >
      <View style={styles.backdrop}>
        {/* 양옆, 아래 위 모두 떨어진 플로팅 박스 */}
        <View style={styles.floatingSheet}>
          {/* 얄쌍해진 검색바 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <View style={styles.greenLine} />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="search"
                placeholderTextColor={Colors.text}
                value={searchQuery}
                onChangeText={setSearchQuery}
                cursorColor="#00C853"
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                /* 마이크 동작 */
              }}
            >
              <Ionicons name="mic-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* 결과 리스트 */}
          {isLoading ? (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={Colors.primary}
            />
          ) : (
            <FlatList
              data={isLoading ? [] : getDisplayData()}
              keyExtractor={(item) => item.apiFootballId?.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: Colors.surface2,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    floatingSheet: {
      width: "100%",
      height: SCREEN_HEIGHT * 0.95,
      backgroundColor: Colors.surface2,
      borderRadius: 20,
      overflow: "hidden",
      elevation: 5,
      shadowColor: Colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface2,
    },
    backButton: {
      marginRight: 12,
    },
    inputContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface2,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 0,
      borderColor: Colors.border,
      gap: 8,
    },
    greenLine: {
      width: 2,
      height: 18,
      backgroundColor: Colors.primary,
      borderRadius: 1,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
      padding: 0,
      includeFontPadding: false,
      textAlignVertical: "center",
    },
    listContainer: {
      paddingTop: 8,
      paddingBottom: 24,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    logo: {
      width: 40,
      height: 40,
    },
    playerPhoto: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    name: {
      fontSize: 15,
      color: Colors.text,
      fontWeight: "600",
    },
    sub: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    followBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      backgroundColor: Colors.surface2,
    },
    followBtnActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    followBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    followBtnTextActive: {
      color: "#000",
      fontWeight: "bold",
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.text,
    },
  });
