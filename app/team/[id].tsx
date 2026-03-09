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
import MatchAlertModal from "../../src/components/match-detail/MatchAlertModal";

const TABS = [
  { key: "overview", label: "개요" },
  { key: "players", label: "선수" },
  { key: "matches", label: "경기" },
  { key: "standings", label: "순위" },
];

export default function TeamDetailScreen() {
  const params = useLocalSearchParams<{ team: string; leagueId: string }>();
  const [alertModalVisible, setAlertModalVisible] = useState(false);
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
      {/* 헤더 */}
      <View
        style={[
          styles.header,
          { backgroundColor: teamData.color ?? Colors.primary },
        ]}
      >
        {/* 상단 바 */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
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
                  isFollowing && { color: teamData.color ?? Colors.primary },
                ]}
              >
                {isFollowing ? "팔로잉" : "팔로우"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 팀 정보 */}
        <View style={styles.headerInfo}>
          <Image
            source={teamData.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <View style={styles.teamTextWrap}>
            <Text style={styles.teamName}>{teamData.name}</Text>
            <Text style={styles.teamCountry}>{teamData.country ?? ""}</Text>
          </View>
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
      marginBottom: 40,
    },
    loadingContainer: {
      flex: 1,
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
      fontSize: 14,
      fontWeight: "700",
      color: Colors.primary,
    },
    content: {
      flex: 1,
    },
    header: {
      paddingTop: 8,
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    iconButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    teamLogo: {
      width: 72,
      height: 72,
    },
    teamTextWrap: {
      gap: 4,
    },
    teamName: {
      fontSize: 26,
      fontWeight: "800",
      color: Colors.text,
    },
    teamCountry: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
    },
  });
