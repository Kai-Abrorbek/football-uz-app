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
import { SEASON, FEATURED_LEAGUES } from "../../src/constants/leauges";

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

  const match = matchData ? JSON.parse(matchData) : null;

  const leagueColor =
    FEATURED_LEAGUES.find((l) => l.id === Number(id))?.color ?? "#1B3A6B";

  const {
    data: league,
    isLoading,
    isError,
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
          <Text style={styles.homeButtonText}>{t("leagueDetail.goHome")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !league) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: leagueColor }]}
        edges={["top"]}
      >
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: leagueColor }]}
      edges={["top"]}
    >
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: leagueColor }]}>
        {/* 상단 네비게이션 */}
        <View style={styles.headerNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
          ></TouchableOpacity>

          <View style={styles.headerNavRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followButtonActive,
              ]}
              onPress={() => setIsFollowing(!isFollowing)}
            >
              <Text style={styles.followButtonText}>
                {isFollowing
                  ? t("leagueDetail.following")
                  : t("leagueDetail.follow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 리그 정보 */}
        <View style={styles.leagueInfo}>
          <View style={styles.logoWrapper}>
            <Image
              source={league.logo}
              style={styles.leagueLogo}
              contentFit="contain"
            />
          </View>
          <View style={styles.leagueTexts}>
            <Text style={styles.leagueName} numberOfLines={1}>
              {league.name}
            </Text>
            <Text style={styles.leagueCountry}>{league.country}</Text>
          </View>
        </View>
      </View>

      {/* 탭 */}
      <View style={styles.tabsWrapper}>
        <LeagueTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      {/* 탭 컨텐츠 */}
      <View style={[styles.content, { backgroundColor: Colors.background }]}>
        {renderTab()}
      </View>
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
    },
    loadingContainer: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    headerNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    seasonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    headerNavRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderWidth: 1,
      borderColor: "#fff",
    },
    followButtonActive: {
      backgroundColor: "#10eb5d",
    },
    followButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    followButtonTextActive: {
      color: "#000",
    },
    leagueInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      paddingTop: 16,
    },
    logoWrapper: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,1)",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    leagueLogo: {
      width: 56,
      height: 56,
    },
    leagueTexts: {
      flex: 1,
      gap: 4,
    },
    leagueName: {
      fontSize: 24,
      fontWeight: "800",
      color: "#fff",
    },
    leagueCountry: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
    },
    tabsWrapper: {
      backgroundColor: Colors.background,
    },
    content: {
      flex: 1,
    },
  });
