import { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors, getColors } from "../../src/constants/colors";
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
import StreamTab from "../../src/components/match-detail/tabs/StreamTab.native";
import { useColors } from "../../src/hooks/useColors";
import { AuthGate } from "../../src/contexts/AuthGate";
import PlayoffScreen from "../../src/components/match-detail/tabs/PlayoffScreen";

const COMPACT_HEADER_HEIGHT = 80;
const TAB_HEIGHT = 50;

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [headerHeight, setHeaderHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const Colors = useColors();
  const styles = getStyles(Colors);

  const {
    data: match,
    isLoading,
    refetch,
  } = useQuery<Match>({
    queryKey: ["match", id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(id)),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 20,
    retry: false,
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
  const round = [
    "Round of 32",
    "Round of 16",
    "Quarter-finals",
    "Semi-finals",
    "Final",
  ].includes(match.round);

  const getTabs = () => {
    const baseTabs = isLive
      ? LIVE_TABS
      : isFinished
        ? FINISHED_TABS
        : UPCOMING_TABS;
    if (match.isStreaming) {
      return [{ key: "stream" }, ...baseTabs];
    }
    return baseTabs;
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
        return round ? (
          <PlayoffScreen match={match} />
        ) : (
          <StandingsTab match={match} />
        );
      case "h2h":
        return <H2HTab match={match} />;
      case "highlights":
        return <LiveTab match={match} />;
      case "stream":
        return <StreamTab match={match} />;
      default:
        return <OverviewTab match={match} onTabChange={setActiveTab} />;
    }
  };

  const scrollDistance =
    headerHeight > COMPACT_HEADER_HEIGHT
      ? headerHeight - COMPACT_HEADER_HEIGHT
      : 150;

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, scrollDistance],
    outputRange: [0, -scrollDistance],
    extrapolate: "clamp",
  });

  const totalHeaderHeight = headerHeight > 0 ? headerHeight + TAB_HEIGHT : 250;

  return (
    <AuthGate>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* 1. 헤더+탭 (absolute 아님! 그냥 위에 배치) */}
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

        {/* 2. ScrollView: stream 탭일 때는 에러 방지를 위해 View로 렌더링 */}
        {activeTab === "stream" ? (
          <View
            style={[
              styles.scrollView,
              { marginTop: -totalHeaderHeight, paddingTop: totalHeaderHeight },
            ]}
          >
            <View style={styles.content}>{renderTab()}</View>
          </View>
        ) : (
          <Animated.ScrollView
            style={[styles.scrollView, { marginTop: -totalHeaderHeight }]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true },
            )}
            contentContainerStyle={{
              paddingTop: totalHeaderHeight,
            }}
          >
            <View style={styles.content}>{renderTab()}</View>
          </Animated.ScrollView>
        )}
      </SafeAreaView>
    </AuthGate>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface2, marginBottom: 40 },
    loadingContainer: { flex: 1, backgroundColor: Colors.surface2 },
    scrollView: { flex: 1 },
    content: { flex: 1 },
    headerContainer: {
      zIndex: 10,
      backgroundColor: Colors.surface2,
    },
  });
