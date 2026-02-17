import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors } from "../../src/constants/colors";
import { Match } from "../../src/types";
import MatchHeader from "../../src/components/match-detail/MatchHeader";
import MatchTabs from "../../src/components/match-detail/MatchTabs";
import OverviewTab from "../../src/components/match-detail/tabs/OverviewTab";
import LineupTab from "../../src/components/match-detail/tabs/LineupTab";
import StatsTab from "../../src/components/match-detail/tabs/StatsTab";
import StandingsTab from "../../src/components/match-detail/tabs/StandingsTab";
import H2HTab from "../../src/components/match-detail/tabs/H2HTab";
import LiveTab from "../../src/components/match-detail/tabs/LiveTab";

const UPCOMING_TABS = [
  { key: "overview", label: "개요" },
  { key: "lineup", label: "라인업" },
  { key: "h2h", label: "경기 더보기" },
  { key: "standings", label: "순위" },
];

const LIVE_TABS = [
  { key: "live", label: "실시간" },
  { key: "lineup", label: "라인업" },
  { key: "stats", label: "기록" },
  { key: "standings", label: "순위" },
  { key: "h2h", label: "경기 더보기" },
];

const FINISHED_TABS = [
  { key: "overview", label: "개요" },
  { key: "lineup", label: "라인업" },
  { key: "stats", label: "기록" },
  { key: "standings", label: "순위" },
  { key: "h2h", label: "경기 더보기" },
];

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ["match", id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(id)),
    staleTime: 1000 * 60,
  });

  if (isLoading || !match) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );
  const isFinished = match.status.short === "FT";

  const getTabs = () => {
    if (isLive) return LIVE_TABS;
    if (isFinished) return FINISHED_TABS;
    return UPCOMING_TABS;
  };

  // 라이브면 기본 탭 실시간으로
  const getDefaultTab = () => {
    if (isLive) return "live";
    return "overview";
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab match={match} />;
      case "lineup":
        return <LineupTab match={match} />;
      case "stats":
        return <StatsTab match={match} />;
      case "standings":
        return <StandingsTab match={match} />;
      case "h2h":
        return <H2HTab match={match} />;
      case "live":
        return <LiveTab match={match} />;
      default:
        return <OverviewTab match={match} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 경기 헤더 */}
      <MatchHeader match={match} />

      {/* 탭 메뉴 */}
      <MatchTabs
        tabs={getTabs()}
        activeTab={activeTab || getDefaultTab()}
        onTabChange={setActiveTab}
      />

      {/* 탭 컨텐츠 */}
      <View style={styles.content}>{renderTab()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
});
