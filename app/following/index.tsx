import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";
import { useAuth } from "../../src/contexts/AuthContext";
import { ENDPOINTS } from "../../src/constants/api";
import api from "../../src/services/api";
import {
  toggleFollowLeague,
  toggleFollowPlayer,
  toggleFollowTeam,
} from "../../src/constants/followService";
import { getColors } from "../../src/constants/colors";
import FollowSearchModal from "./FollowModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type Tab = "teams" | "players" | "leagues";

export default function FollowingScreen() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const { userData } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("teams");
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  const { data: followingTeams, isLoading: loadingTeams } = useQuery<any[]>({
    queryKey: ["following-teams"],
    queryFn: () => api.get(ENDPOINTS.followingTeams),
    enabled: !!userData,
  });

  const { data: followingPlayers, isLoading: loadingPlayers } = useQuery<any[]>(
    {
      queryKey: ["following-players"],
      queryFn: () => api.get(ENDPOINTS.followingPlayers),
      enabled: !!userData,
    },
  );

  const { data: followingLeagues, isLoading: loadingLeagues } = useQuery<any[]>(
    {
      queryKey: ["following-leagues"],
      queryFn: () => api.get(ENDPOINTS.followingLeagues),
      enabled: !!userData,
    },
  );

  const { data: suggestedTeams } = useQuery<any[]>({
    queryKey: ["suggested-teams"],
    queryFn: () => api.get(ENDPOINTS.suggestedTeams),
    enabled: activeTab === "teams" && !!userData,
  });

  const { data: suggestedPlayers } = useQuery<any[]>({
    queryKey: ["suggested-players"],
    queryFn: () => api.get(ENDPOINTS.suggestedPlayers),
    enabled: activeTab === "players" && !!userData,
  });

  const { data: suggestedLeagues } = useQuery<any[]>({
    queryKey: ["suggested-leagues"],
    queryFn: () => api.get(ENDPOINTS.suggestedLeagues),
    enabled: activeTab === "leagues" && !!userData,
  });

  const handleUnfollowTeam = async (teamId: number) => {
    await toggleFollowTeam(teamId);
    queryClient.invalidateQueries({ queryKey: ["following-teams"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-teams"] });
  };

  const handleUnfollowPlayer = async (playerId: number) => {
    await toggleFollowPlayer(playerId);
    queryClient.invalidateQueries({ queryKey: ["following-players"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-players"] });
  };

  const handleUnfollowLeague = async (leagueId: number) => {
    await toggleFollowLeague(leagueId);
    queryClient.invalidateQueries({ queryKey: ["following-leagues"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-leagues"] });
  };

  const handleFollowTeam = async (teamId: number) => {
    await toggleFollowTeam(teamId);
    queryClient.invalidateQueries({ queryKey: ["following-teams"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-teams"] });
  };

  const handleFollowPlayer = async (playerId: number) => {
    await toggleFollowPlayer(playerId);
    queryClient.invalidateQueries({ queryKey: ["following-players"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-players"] });
  };

  const handleFollowLeague = async (leagueId: number) => {
    await toggleFollowLeague(leagueId);
    queryClient.invalidateQueries({ queryKey: ["following-leagues"] });
    queryClient.invalidateQueries({ queryKey: ["suggested-leagues"] });
  };

  const renderTeamCard = (team: any) => {
    const bgColor = team.color || Colors.primary;
    const nextMatch = team.nextMatch;

    return (
      <TouchableOpacity
        key={team.apiFootballId}
        style={[
          styles.followingCard,
          { backgroundColor: bgColor, width: CARD_WIDTH },
        ]}
        onPress={() =>
          router.push({
            pathname: "/team/[id]",
            params: { team: JSON.stringify(team) },
          })
        }
        activeOpacity={0.8}
      >
        {isEditMode && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleUnfollowTeam(team.apiFootballId)}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <Image
          source={team.logo}
          style={styles.cardLogo}
          contentFit="contain"
        />
        <Text style={styles.cardName} numberOfLines={1}>
          {team.name}
        </Text>
        {nextMatch && (
          <View style={styles.nextMatchInfo}>
            <Ionicons
              name="swap-horizontal"
              size={12}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.nextMatchText} numberOfLines={1}>
              {nextMatch.homeTeam.id === team.apiFootballId
                ? nextMatch.awayTeam.name
                : nextMatch.homeTeam.name}
            </Text>
          </View>
        )}
        {nextMatch && (
          <Text style={styles.nextMatchDate}>
            {new Date(nextMatch.date).toLocaleDateString("ko-KR", {
              month: "numeric",
              day: "numeric",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPlayerCard = (player: any) => {
    return (
      <TouchableOpacity
        key={player.apiFootballId}
        style={[
          styles.followingCard,
          { backgroundColor: Colors.primary, width: CARD_WIDTH },
        ]}
        onPress={() => router.push(`/player/${player.apiFootballId}`)}
        activeOpacity={0.8}
      >
        {isEditMode && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleUnfollowPlayer(player.apiFootballId)}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <Image
          source={player.photo}
          style={styles.cardPlayerPhoto}
          contentFit="cover"
        />
        <Text style={styles.cardName} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {player.position} · {player.currentTeam?.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderLeagueCard = (league: any) => {
    return (
      <TouchableOpacity
        key={league.apiFootballId}
        style={[
          styles.followingCard,
          { backgroundColor: Colors.primary, width: CARD_WIDTH },
        ]}
        onPress={() => router.push(`/league/${league.apiFootballId}`)}
        activeOpacity={0.8}
      >
        {isEditMode && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleUnfollowLeague(league.apiFootballId)}
          >
            <Ionicons name="close-circle" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <Image
          source={league.logo}
          style={styles.cardLogo}
          contentFit="contain"
        />
        <Text style={styles.cardName} numberOfLines={1}>
          {league.name}
        </Text>
        <Text style={styles.cardSub} numberOfLines={1}>
          {league.country}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSuggestedTeam = (team: any) => {
    const isFollowing = followingTeams?.some(
      (t) => t.apiFootballId === team.apiFootballId,
    );

    return (
      <View key={team.apiFootballId} style={styles.suggestedRow}>
        <TouchableOpacity
          style={styles.suggestedLeft}
          onPress={() =>
            router.push({
              pathname: "/team/[id]",
              params: { team: JSON.stringify(team) },
            })
          }
        >
          <Image
            source={team.logo}
            style={styles.suggestedLogo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.suggestedName} numberOfLines={1}>
              {team.name}
            </Text>
            <Text style={styles.suggestedSub}>{team.country}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={() => handleFollowTeam(team.apiFootballId)}
        >
          <Text
            style={[
              styles.followBtnText,
              isFollowing && styles.followBtnTextActive,
            ]}
          >
            {isFollowing ? t("following.following") : t("following.follow")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestedPlayer = (player: any) => {
    const isFollowing = followingPlayers?.some(
      (p) => p.apiFootballId === player.apiFootballId,
    );

    return (
      <View key={player.apiFootballId} style={styles.suggestedRow}>
        <TouchableOpacity
          style={styles.suggestedLeft}
          onPress={() => router.push(`/player/${player.apiFootballId}`)}
        >
          <Image
            source={player.photo}
            style={styles.suggestedPlayerPhoto}
            contentFit="cover"
          />
          <View>
            <Text style={styles.suggestedName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.suggestedSub}>
              {player.position} · {player.currentTeam?.name}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={() => handleFollowPlayer(player.apiFootballId)}
        >
          <Text
            style={[
              styles.followBtnText,
              isFollowing && styles.followBtnTextActive,
            ]}
          >
            {isFollowing ? t("following.following") : t("following.follow")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestedLeague = (league: any) => {
    const isFollowing = followingLeagues?.some(
      (l) => l.apiFootballId === league.apiFootballId,
    );

    return (
      <View key={league.apiFootballId} style={styles.suggestedRow}>
        <TouchableOpacity
          style={styles.suggestedLeft}
          onPress={() => router.push(`/league/${league.apiFootballId}`)}
        >
          <Image
            source={league.logo}
            style={styles.suggestedLogo}
            contentFit="contain"
          />
          <View>
            <Text style={styles.suggestedName} numberOfLines={1}>
              {league.name}
            </Text>
            <Text style={styles.suggestedSub}>{league.country}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followBtnActive]}
          onPress={() => handleFollowLeague(league.apiFootballId)}
        >
          <Text
            style={[
              styles.followBtnText,
              isFollowing && styles.followBtnTextActive,
            ]}
          >
            {isFollowing ? t("following.following") : t("following.follow")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (activeTab === "teams") {
      return (
        <>
          {/* 팔로잉 팀 그리드 */}
          {followingTeams && followingTeams.length > 0 && (
            <View style={styles.gridContainer}>
              {followingTeams.map(renderTeamCard)}
            </View>
          )}

          {/* 추천 팀 */}
          {suggestedTeams && suggestedTeams.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>
                {t("following.trending")}
              </Text>
              {suggestedTeams.map(renderSuggestedTeam)}
            </View>
          )}
        </>
      );
    }

    if (activeTab === "players") {
      return (
        <>
          {followingPlayers && followingPlayers.length > 0 && (
            <View style={styles.gridContainer}>
              {followingPlayers.map(renderPlayerCard)}
            </View>
          )}
          {suggestedPlayers && suggestedPlayers.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>
                {t("following.trending")}
              </Text>
              {suggestedPlayers.map(renderSuggestedPlayer)}
            </View>
          )}
        </>
      );
    }

    if (activeTab === "leagues") {
      return (
        <>
          {followingLeagues && followingLeagues.length > 0 && (
            <View style={styles.gridContainer}>
              {followingLeagues.map(renderLeagueCard)}
            </View>
          )}
          {suggestedLeagues && suggestedLeagues.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>
                {t("following.trending")}
              </Text>
              {suggestedLeagues.map(renderSuggestedLeague)}
            </View>
          )}
        </>
      );
    }
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <Ionicons
            name="lock-closed-outline"
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.loginTitle}>{t("following.loginRequired")}</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.loginBtnText}>{t("following.goLogin")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("following.title")}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
            <Text style={styles.editBtn}>
              {isEditMode ? t("following.done") : t("following.edit")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={26} color={Colors.text} />
          </TouchableOpacity>

          {/* 모달 */}
          <FollowSearchModal
            visible={searchModalVisible}
            onClose={() => setSearchModalVisible(false)}
            activeTab={activeTab}
            followingTeams={followingTeams ?? []}
            followingPlayers={followingPlayers ?? []}
            followingLeagues={followingLeagues ?? []}
            suggestedTeams={suggestedTeams ?? []}
            suggestedPlayers={suggestedPlayers ?? []}
            suggestedLeagues={suggestedLeagues ?? []}
            onFollowChange={() => {
              queryClient.invalidateQueries({ queryKey: ["following-teams"] });
              queryClient.invalidateQueries({
                queryKey: ["following-players"],
              });
              queryClient.invalidateQueries({
                queryKey: ["following-leagues"],
              });
              queryClient.invalidateQueries({ queryKey: ["suggested-teams"] });
              queryClient.invalidateQueries({
                queryKey: ["suggested-players"],
              });
              queryClient.invalidateQueries({
                queryKey: ["suggested-leagues"],
              });
            }}
          />
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabRow}>
        {(["teams", "players", "leagues"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {t(`following.tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
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
    headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
    editBtn: { fontSize: 14, fontWeight: "600", color: Colors.primary },
    addBtn: { padding: 4 },
    tabRow: {
      flexDirection: "row",
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: Colors.primary },
    tabText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
    tabTextActive: { color: Colors.primary },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 16,
      gap: 16,
    },
    followingCard: {
      borderRadius: 16,
      padding: 16,
      minHeight: 140,
      justifyContent: "flex-end",
      position: "relative",
    },
    removeBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 10,
    },
    cardLogo: { width: 48, height: 48, marginBottom: 8 },
    cardPlayerPhoto: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: "#fff",
    },
    cardName: { fontSize: 16, fontWeight: "800", color: "#fff" },
    cardSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
    nextMatchInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
    },
    nextMatchText: { fontSize: 12, color: "rgba(255,255,255,0.8)", flex: 1 },
    nextMatchDate: {
      fontSize: 11,
      color: "rgba(255,255,255,0.7)",
      marginTop: 2,
    },
    suggestedSection: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      overflow: "hidden",
    },
    suggestedTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      padding: 16,
      paddingBottom: 8,
    },
    suggestedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    suggestedLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    suggestedLogo: { width: 40, height: 40 },
    suggestedPlayerPhoto: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    suggestedName: { fontSize: 14, fontWeight: "600", color: Colors.text },
    suggestedSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    followBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
    },
    followBtnActive: { backgroundColor: Colors.primary },
    followBtnText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
    followBtnTextActive: { color: "#fff" },
    loginTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    loginBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    loginBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
