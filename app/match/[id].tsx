import { useState, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors } from "../../src/constants/colors";
import {
  FINISHED_TABS,
  LIVE_TABS,
  Match,
  UPCOMING_TABS,
} from "../../src/types";
import MatchHeader from "../../src/components/match-detail/MatchHeader";
import MatchTabs from "../../src/components/match-detail/MatchTabs";
import OverviewTab from "../../src/components/match-detail/tabs/OverviewTab";
import LineupTab from "../../src/components/match-detail/tabs/LineupTab";
import StatsTab from "../../src/components/match-detail/tabs/StatsTab";
import H2HTab from "../../src/components/match-detail/tabs/H2HTab";
import LiveTab from "../../src/components/match-detail/tabs/HighlightsTab";
import StandingsTab from "../../src/components/match-detail/tabs/StandingsTab";

const COMPACT_HEADER_HEIGHT = 60; // 콤팩트 헤더 높이

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const getDefaultTab = () => (isLive ? "live" : "overview");

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab match={match} onTabChange={setActiveTab} />;
      case "lineup":
        return <LineupTab match={match} />;
      case "stats":
        return <StatsTab match={match} />;
      case "standings":
        return <StandingsTab match={match} />;
      case "h2h":
        return <H2HTab match={match} />;
      case "highlights":
        return <LiveTab match={match} />;
      default:
        return <OverviewTab match={match} onTabChange={setActiveTab} />;
    }
  };

  // 콤팩트 헤더 크기를 제외한 나머지 밀려 올라갈 거리 계산
  const scrollDistance =
    headerHeight > COMPACT_HEADER_HEIGHT
      ? headerHeight - COMPACT_HEADER_HEIGHT
      : 150;

  // 헤더와 탭 전체를 묶어서 스크롤에 맞춰 위로 밀어올림
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, scrollDistance],
    outputRange: [0, -scrollDistance],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 1. ScrollView: 화면 전체 스크롤 담당 (헤더+탭 높이만큼 패딩을 줘서 공간 확보) */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        contentContainerStyle={{
          paddingTop: headerHeight > 0 ? headerHeight + 50 : 250,
        }} // 50은 탭 기본 높이
      >
        <View style={styles.content}>{renderTab()}</View>
      </Animated.ScrollView>

      {/* 2. 최상단에 떠서 같이 밀려 올라가는 헤더+탭 그룹 (position: absolute) */}
      <Animated.View
        style={[
          styles.headerContainer,
          { transform: [{ translateY: headerTranslateY }] },
        ]}
      >
        <MatchHeader
          match={match}
          scrollY={scrollY}
          headerHeight={headerHeight}
          onHeaderLayout={setHeaderHeight}
          scrollDistance={scrollDistance}
        />
        <MatchTabs
          tabs={getTabs()}
          activeTab={activeTab || getDefaultTab()}
          onTabChange={setActiveTab}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { flex: 1 },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: Colors.background,
  },
});
