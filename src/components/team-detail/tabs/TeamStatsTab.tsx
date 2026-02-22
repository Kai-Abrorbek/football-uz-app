import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { Colors } from "../../../constants/colors";
import { ENDPOINTS } from "../../../constants/api";

interface Props {
  leagueId: string;
}

const STAT_TABS = [
  { key: "goals", label: "골" },
  { key: "assists", label: "어시스트" },
  { key: "yellowCards", label: "옐로우 카드" },
  { key: "redCards", label: "레드 카드" },
];

export default function TeamStatsTab({ leagueId }: Props) {
  const [activeStatTab, setActiveStatTab] = useState("goals");

  // 득점 순위
  const { data: topScorers } = useQuery<any>({
    queryKey: ["top-scorers", leagueId],
    queryFn: () => api.get(ENDPOINTS.topScorers(leagueId)),
    enabled: activeStatTab === "goals",
  });

  // 어시스트 순위
  const { data: topAssists } = useQuery<any>({
    queryKey: ["top-assists", leagueId],
    queryFn: () => api.get(ENDPOINTS.topAssists(leagueId)),
    enabled: activeStatTab === "assists",
  });

  // 카드 순위 (더미)
  const cardData = [
    { rank: 1, name: "선수 A", team: "팀 A", count: 10 },
    { rank: 2, name: "선수 B", team: "팀 B", count: 8 },
  ];

  const renderStatList = () => {
    let data: any[] = [];
    let statKey = "";

    switch (activeStatTab) {
      case "goals":
        data = topScorers || [];
        statKey = "골";
        break;
      case "assists":
        data = topAssists || [];
        statKey = "어시스트";
        break;
      case "yellowCards":
      case "redCards":
        data = cardData;
        statKey = activeStatTab === "yellowCards" ? "옐로우 카드" : "레드 카드";
        break;
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>데이터가 없습니다</Text>
        </View>
      );
    }

    return (
      <View style={styles.statList}>
        {/* 헤더 */}
        <View style={styles.listHeader}>
          <Text style={styles.headerText}>선수</Text>
          <Text style={styles.headerText}>{statKey}</Text>
        </View>

        {/* 선수 목록 */}
        {data.map((item, index) => (
          <View key={index} style={styles.statRow}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>{index + 1}</Text>
            </View>

            <View style={styles.playerPhoto}>
              <Text style={styles.playerPhotoText}>
                {item.player?.name?.charAt(0) || item.name?.charAt(0)}
              </Text>
            </View>

            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {item.player?.name || item.name}
              </Text>
              <View style={styles.teamRow}>
                {item.team?.logo && (
                  <Image
                    source={item.team.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                )}
                <Text style={styles.teamName}>
                  {item.team?.name || item.team}
                </Text>
              </View>
            </View>

            <View style={styles.statValue}>
              <Text style={styles.statNumber}>
                {item.statistics?.goals ||
                  item.statistics?.assists ||
                  item.count ||
                  0}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 통계 탭 */}
      <View style={styles.statTabs}>
        {STAT_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.statTab,
              activeStatTab === tab.key && styles.statTabActive,
            ]}
            onPress={() => setActiveStatTab(tab.key)}
          >
            <Text
              style={[
                styles.statTabText,
                activeStatTab === tab.key && styles.statTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 통계 목록 */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderStatList()}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  statTabActive: {
    borderBottomColor: Colors.primary,
  },
  statTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  statTabTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statList: {
    backgroundColor: Colors.surface,
    marginTop: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  rankContainer: {
    width: 28,
    alignItems: "center",
  },
  rank: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  playerPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  playerPhotoText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  teamLogo: {
    width: 16,
    height: 16,
  },
  teamName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statValue: {
    width: 40,
    alignItems: "flex-end",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
});
