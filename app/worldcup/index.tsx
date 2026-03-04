import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import LeagueTabs from "../../src/components/league-detail/LeagueTabs";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import WorldcupOverviewTab from "../../src/components/worldcup/tabs/WorldcupOverviewTab";
import { useQuery } from "@tanstack/react-query";
import { Match } from "../../src/types";
import api from "../../src/services/api";
import {
  ENDPOINTS,
  WORLDCUP_LEAGUE_ID,
  WORLDCUP_SEASON,
} from "../../src/constants/api";
import WorldcupMatchesTab from "../../src/components/worldcup/tabs/WorldcupMatchesTab";
import WorldcupPlayersTab from "../../src/components/worldcup/tabs/WorldcupPlayersTab";
import WorldcupBracketTab from "../../src/components/worldcup/tabs/WorldcupBracketTab";
import WorldcupStandingsTab from "../../src/components/worldcup/tabs/WorldcupStandingsTab";
import { SEASON } from "../../src/constants/leauges";

const TABS = [
  { key: "overview" },
  { key: "players" },
  { key: "matches" },
  { key: "bracket" },
  { key: "standings" },
];

export default function WorldcupScreen() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["worldcup-matches-round1"],
    queryFn: async () => {
      const res: any = await api.get(
        `${ENDPOINTS.matches}?leagueId=${WORLDCUP_LEAGUE_ID}&season=${WORLDCUP_SEASON}&round=Group Stage - 1`,
      );
      return res ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: standingsData } = useQuery<any>({
    queryKey: ["worldcup-standings"],
    queryFn: async () => {
      const res: any = await api.get(
        ENDPOINTS.leagueStandingsAndSeason(WORLDCUP_LEAGUE_ID, WORLDCUP_SEASON),
      );
      return res;
    },
    staleTime: 1000 * 60 * 30,
  });

  // teamId → "Group A" 맵
  const teamGroupMap = useMemo(() => {
    const map: Record<number, string> = {};
    const groups: any[][] = standingsData?.standings ?? [];
    groups.forEach((group) => {
      group.forEach((team: any) => {
        map[team.team.id] = team.group; // "Group A"
      });
    });
    return map;
  }, [standingsData]);

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <WorldcupOverviewTab matches={matches} teamGroupMap={teamGroupMap} />
        );
      case "players":
        return <WorldcupPlayersTab />;
      case "matches":
        return (
          <WorldcupMatchesTab matches={matches} teamGroupMap={teamGroupMap} />
        );
      case "bracket":
        return <WorldcupBracketTab matches={matches} />;
      case "standings":
        return <WorldcupStandingsTab />;
      default:
        return <WorldcupOverviewTab matches={matches} />;
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
          <Text style={styles.title}>{t("worldcup.title")}</Text>
          <Text style={styles.subtitle}>{t("worldcup.subtitle")}</Text>
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
    container: { flex: 1, backgroundColor: Colors.background },
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
    headerCenter: { flex: 1, paddingHorizontal: 8 },
    title: { fontSize: 18, fontWeight: "700", color: Colors.text },
    subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
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
    followButtonActive: { backgroundColor: Colors.primary },
    followButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.primary,
    },
    followButtonTextActive: { color: "#ffffff" },
    content: { flex: 1 },
  });
