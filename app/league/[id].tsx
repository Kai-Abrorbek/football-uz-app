import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { getColors } from "../../src/constants/colors";
import LeagueTabs from "../../src/components/league-detail/LeagueTabs";
import LeagueOverviewTab from "../../src/components/league-detail/tabs/LeagueOverviewTab";
import LeagueStatsTab from "../../src/components/league-detail/tabs/LeagueStatsTab";
import LeaguePlayersTab from "../../src/components/league-detail/tabs/LeaguePlayersTab";
import LeagueMatchesTab from "../../src/components/league-detail/tabs/LeagueMatchesTab";
import LeagueStandingsTab from "../../src/components/league-detail/tabs/LeagueStandingsTab";
import { useColors } from "../../src/hooks/useColors";
import { useTranslation } from "react-i18next";
import { SEASON } from "../../src/constants/leauges";

const TABS = [
  { key: "overview" },
  { key: "stats" },
  { key: "players" },
  { key: "matches" },
  { key: "standings" },
];

export default function LeagueDetailScreen() {
  const params = useLocalSearchParams<{ id: string; matchData?: string }>();
  const { id, matchData } = params;
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  // matchData가 string이면 파싱
  const match = matchData ? JSON.parse(matchData) : null;
  // 리그 정보 조회
  const {
    data: league,
    isLoading,
    isError,
    error,
  } = useQuery<any>({
    queryKey: ["league", id],
    queryFn: async () => {
      const res: any = await api.get(
        ENDPOINTS.leagueStandingsAndSeason(Number(id), SEASON),
      );
      return res?.league ?? null;
    },
    staleTime: 1000 * 60 * 30,
  });

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "red", fontSize: 16, fontWeight: "600" }}>
          {t("leagueDetail.error404")}
        </Text>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}> {t("leagueDetail.goHome")}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (isLoading || !league) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <LeagueOverviewTab leagueId={id} highlightMatch={match} />;
      case "stats":
        return <LeagueStatsTab leagueId={id} />;
      case "players":
        return <LeaguePlayersTab leagueId={id} />;
      case "matches":
        return <LeagueMatchesTab leagueId={id} />;
      case "standings":
        return <LeagueStandingsTab leagueId={id} />;
      default:
        return <LeagueOverviewTab leagueId={id} highlightMatch={match} />;
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
        ></TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={league.logo}
            style={styles.leagueLogo}
            contentFit="contain"
          />
          <Text style={styles.leagueName} numberOfLines={1}>
            {league.name}
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
              {isFollowing
                ? t("leagueDetail.following")
                : t("leagueDetail.follow")}
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
      color: "#fff",
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
      width: 30,
      height: 30,
      backgroundColor: Colors.background2,
      borderRadius: 50,
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
