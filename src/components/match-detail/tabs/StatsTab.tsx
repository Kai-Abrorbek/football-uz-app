import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";

interface Props {
  match: Match;
}

const STAT_CATEGORIES = [
  { key: "main", label: "주요 통계" },
  { key: "attack", label: "공격" },
  { key: "defense", label: "수비" },
  { key: "foul", label: "반칙" },
];

const STATS_MAP: any = {
  main: [
    { key: "possession", label: "점유율" },
    { key: "shots", label: "슈팅" },
    { key: "shotsOnTarget", label: "유효슈팅" },
    { key: "corners", label: "코너킥" },
    { key: "fouls", label: "파울" },
    { key: "yellowCards", label: "옐로우 카드" },
    { key: "redCards", label: "레드 카드" },
    { key: "offsides", label: "오프사이드" },
  ],
  attack: [
    { key: "shots", label: "슈팅" },
    { key: "shotsOnTarget", label: "유효슈팅" },
    { key: "corners", label: "코너킥" },
    { key: "offsides", label: "오프사이드" },
  ],
  defense: [
    { key: "passes", label: "패스" },
    { key: "passAccuracy", label: "패스 정확도" },
    { key: "possession", label: "점유율" },
  ],
  foul: [
    { key: "fouls", label: "파울" },
    { key: "yellowCards", label: "옐로우 카드" },
    { key: "redCards", label: "레드 카드" },
  ],
};

export default function StatsTab({ match }: Props) {
  const [activeCategory, setActiveCategory] = useState("main");

  if (!match.statistics || match.statistics.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>경기 통계가 없습니다</Text>
      </View>
    );
  }

  const homeStats = match.statistics.find((s) => s.side === "home");
  const awayStats = match.statistics.find((s) => s.side === "away");

  const getStatValue = (stats: any, key: string) => {
    if (!stats) return 0;
    const val = stats[key];
    if (typeof val === "string" && val.includes("%")) {
      return parseFloat(val);
    }
    return val || 0;
  };

  const renderStatRow = (label: string, key: string) => {
    const homeVal = getStatValue(homeStats, key);
    const awayVal = getStatValue(awayStats, key);
    const total = (Number(homeVal) || 0) + (Number(awayVal) || 0);
    const homeWidth = total > 0 ? (Number(homeVal) / total) * 100 : 50;
    const awayWidth = total > 0 ? (Number(awayVal) / total) * 100 : 50;
    const isHomeBetter = Number(homeVal) > Number(awayVal);
    const isAwayBetter = Number(awayVal) > Number(homeVal);

    return (
      <View key={key} style={styles.statRow}>
        {/* 홈 값 */}
        <View style={styles.statValueContainer}>
          <View
            style={[
              styles.statBubble,
              isHomeBetter && styles.statBubbleHighlight,
            ]}
          >
            <Text
              style={[
                styles.statValue,
                isHomeBetter && styles.statValueHighlight,
              ]}
            >
              {homeVal}
              {typeof homeStats?.[key] === "string" &&
              homeStats[key].includes("%")
                ? "%"
                : ""}
            </Text>
          </View>
        </View>

        {/* 라벨 + 바 */}
        <View style={styles.statCenter}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={styles.statBar}>
            <View style={[styles.statBarHome, { width: `${homeWidth}%` }]} />
            <View style={[styles.statBarAway, { width: `${awayWidth}%` }]} />
          </View>
        </View>

        {/* 원정 값 */}
        <View style={[styles.statValueContainer, { alignItems: "flex-end" }]}>
          <View
            style={[
              styles.statBubble,
              isAwayBetter && styles.statBubbleHighlight,
            ]}
          >
            <Text
              style={[
                styles.statValue,
                isAwayBetter && styles.statValueHighlight,
              ]}
            >
              {awayVal}
              {typeof awayStats?.[key] === "string" &&
              awayStats[key].includes("%")
                ? "%"
                : ""}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 팀 헤더 */}
      <View style={styles.teamHeader}>
        <Text style={styles.teamName}>{match.homeTeam.name}</Text>
        <Text style={styles.vsText}>vs</Text>
        <Text style={[styles.teamName, { textAlign: "right" }]}>
          {match.awayTeam.name}
        </Text>
      </View>

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {STAT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryTab,
              activeCategory === cat.key && styles.categoryTabActive,
            ]}
            onPress={() => setActiveCategory(cat.key)}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === cat.key && styles.categoryTabTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 통계 목록 */}
      <View style={styles.statsContainer}>
        {STATS_MAP[activeCategory].map((stat: any) =>
          renderStatRow(stat.label, stat.key),
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  teamHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  vsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 8,
  },
  categoryTabs: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  categoryTabTextActive: {
    color: "#ffffff",
  },
  statsContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  statValueContainer: {
    width: 60,
    alignItems: "flex-start",
  },
  statBubble: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statBubbleHighlight: {
    backgroundColor: "#ea4335",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  statValueHighlight: {
    color: "#ffffff",
  },
  statCenter: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  statBar: {
    flexDirection: "row",
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: Colors.border,
  },
  statBarHome: {
    height: "100%",
    backgroundColor: "#4285f4",
  },
  statBarAway: {
    height: "100%",
    backgroundColor: "#ea4335",
  },
});
