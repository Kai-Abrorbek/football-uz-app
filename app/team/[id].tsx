import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { getColors } from "../../src/constants/colors";
import LeagueTabs from "../../src/components/league-detail/LeagueTabs";
import TeamOverviewTab from "../../src/components/team-detail/tabs/TeamOverviewTab";
import TeamPlayersTab from "../../src/components/team-detail/tabs/TeamPlayersTab";
import TeamMatchesTab from "../../src/components/team-detail/tabs/TeamMatchesTab";
import TeamStandingsTab from "../../src/components/team-detail/tabs/TeamStandingsTab";
import { Image } from "expo-image";
import { useColors } from "../../src/hooks/useColors";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "players", label: "선수" },
  { key: "matches", label: "경기" },
  { key: "standings", label: "순위" },
];

export default function TeamDetailScreen() {
  const params = useLocalSearchParams<{ team: string; leagueId: string }>();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { team, leagueId } = params;
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  // matchData가 string이면 파싱
  const teamData = team ? JSON.parse(team) : null;
  // 리그 정보 조회
  const {
    data: matches,
    isLoading,
    isError,
  } = useQuery<any>({
    queryKey: ["team-detail", teamData.id],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.getTeamDetail(teamData.id));

      return res ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", fontSize: 16, fontWeight: "600" }}>
          팀 경기 정보가 없습니다 (404)
        </Text>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}>홈으로 이동</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !matches) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <TeamOverviewTab teamId={teamData.id} teamMatches={matches} />;
      case "players":
        return <TeamPlayersTab teamId={teamData.id} />;
      case "matches":
        return <TeamMatchesTab teamId={teamData.id} />;
      case "standings":
        return <TeamStandingsTab teamId={teamData.id} leagueId={leagueId} />;
      default:
        return <TeamOverviewTab teamId={teamData.id} teamMatches={matches} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={teamData.logo}
            style={styles.leagueLogo}
            contentFit="contain"
          />
          <Text style={styles.leagueName} numberOfLines={1}>
            {teamData.name}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followButtonActive,
            ]}
            onPress={() => setIsFollowing(!isFollowing)}
          >
            <Text
              style={[
                styles.followButtonText,
                isFollowing && styles.followButtonTextActive,
              ]}
            >
              {isFollowing ? "팔로잉" : "팔로우"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 */}
      <LeagueTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 탭 컨텐츠 */}
      <View style={styles.content}>{renderTab()}</View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    homeButton: {
      marginTop: 20,
      backgroundColor: "#3478f6",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },

    homeButtonText: {
      color: Colors.text,
      fontWeight: "700",
      fontSize: 14,
    },

    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    loadingContainer: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
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
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 8,
    },
    leagueLogo: {
      width: 28,
      height: 28,
    },
    leagueName: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      flex: 1,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    moreButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      backgroundColor: Colors.surface,
    },
    followButtonActive: {
      backgroundColor: Colors.primary,
    },
    followButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.primary,
    },
    followButtonTextActive: {
      color: "#ffffff",
    },
    content: {
      flex: 1,
    },
  });
