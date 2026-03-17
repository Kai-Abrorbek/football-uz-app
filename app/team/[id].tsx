import { useState, useEffect } from "react";
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
import { AuthGate } from "../../src/contexts/AuthGate";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  getFollowing,
  toggleFollowTeam,
} from "../../src/constants/followService";

export default function TeamDetailScreen() {
  const params = useLocalSearchParams<{ team: string; leagueId: string }>();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { team, leagueId } = params;
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);

  const TABS = [
    { key: "overview", label: t("teamDetail.tabs.overview") },
    { key: "players", label: t("teamDetail.tabs.players") },
    { key: "matches", label: t("teamDetail.tabs.matches") },
    { key: "standings", label: t("teamDetail.tabs.standings") },
  ];

  const teamData = team ? JSON.parse(team) : null;

  useEffect(() => {
    const checkFollowing = async () => {
      if (!userData) return;
      const following = await getFollowing();
      setIsFollowing(following.teams.includes(teamData.id));
    };
    checkFollowing();
  }, [teamData.id, userData]);

  const handleFollow = async () => {
    if (!userData) {
      router.push("/profile");
      return;
    }
    try {
      const result = await toggleFollowTeam(teamData.id);
      setIsFollowing(result.following);
    } catch (error) {
      console.error("팔로우 실패:", error);
    }
  };

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
          {t("teamDetail.error")}
        </Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}>{t("teamDetail.goHome")}</Text>
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
        return (
          <TeamOverviewTab
            teamId={teamData.id}
            teamMatches={matches.reverse()}
          />
        );
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
    <AuthGate>
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View
          style={[
            styles.header,
            { backgroundColor: teamData.color ?? Colors.primary },
          ]}
        >
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
                onPress={handleFollow}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && { color: teamData.color ?? Colors.primary },
                  ]}
                >
                  {isFollowing
                    ? t("teamDetail.following")
                    : t("teamDetail.follow")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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

        <LeagueTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <View style={styles.content}>{renderTab()}</View>
      </SafeAreaView>
    </AuthGate>
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
      borderColor: "#ffffff",
      backgroundColor: "transparent",
    },
    followButtonActive: {
      backgroundColor: "#ffffff",
    },
    followButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#ffffff",
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
      color: "#ffffff",
    },
    teamCountry: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
    },
  });
