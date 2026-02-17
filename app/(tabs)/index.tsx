import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/colors";
import { useMatches, useLiveMatches } from "../../src/hooks/useMatches";
import { useFeaturedLeagues } from "../../src/hooks/useLeagues";
import MatchCard from "../../src/components/match/MatchCard";
import LeagueChip from "../../src/components/match/LeagueChip";
import LiveMatchCard from "../../src/components/match/LiveMatchCard";

const DATES = [
  { label: "어제", value: getDateString(-1) },
  { label: "오늘", value: getDateString(0) },
  { label: "내일", value: getDateString(1) },
  { label: "2일 후", value: getDateString(2) },
  { label: "3일 후", value: getDateString(3) },
];

function getDateString(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(getDateString(0));
  const [selectedLeague, setSelectedLeague] = useState<number | undefined>();
  const [showLeagueModal, setShowLeagueModal] = useState(false);

  const {
    data: matches,
    isLoading,
    refetch,
  } = useMatches(selectedDate, selectedLeague);
  const { data: liveMatches } = useLiveMatches();
  const { data: leagues } = useFeaturedLeagues();

  // 리그별 그룹핑
  const groupedMatches = matches?.reduce((acc: any, match) => {
    const leagueId = match.league.id;
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: match.league,
        matches: [],
      };
    }
    acc[leagueId].matches.push(match);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ FootballUZ</Text>
        <TouchableOpacity>
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* 라이브 경기 섹션 */}
        {liveMatches && liveMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.sectionTitle}>라이브 경기</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveMatches.map((match) => (
                <LiveMatchCard key={match._id} match={match} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 날짜 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dateTabContainer}
          contentContainerStyle={styles.dateTabContent}
        >
          {DATES.map((date) => (
            <TouchableOpacity
              key={date.value}
              style={[
                styles.dateTab,
                selectedDate === date.value && styles.dateTabActive,
              ]}
              onPress={() => setSelectedDate(date.value)}
            >
              <Text
                style={[
                  styles.dateTabText,
                  selectedDate === date.value && styles.dateTabTextActive,
                ]}
              >
                {date.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 경기 목록 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : groupedMatches && Object.keys(groupedMatches).length > 0 ? (
          Object.values(groupedMatches).map((group: any) => (
            <View key={group.league.id} style={styles.leagueGroup}>
              {/* 리그 헤더 */}
              <View style={styles.leagueHeader}>
                <Text style={styles.leagueName}>{group.league.name}</Text>
                <Text style={styles.leagueCountry}>{group.league.country}</Text>
              </View>
              {/* 경기 목록 */}
              {group.matches.map((match: any) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>이 날 경기가 없습니다</Text>
          </View>
        )}

        {/* 하단 여백 */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 하단 리그 칩 */}
      <View style={styles.leagueChipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueChipContent}
        >
          <TouchableOpacity
            style={[
              styles.leagueChip,
              !selectedLeague && styles.leagueChipActive,
            ]}
            onPress={() => setSelectedLeague(undefined)}
          >
            <Text
              style={[
                styles.leagueChipText,
                !selectedLeague && styles.leagueChipTextActive,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>

          {leagues?.map((league) => (
            <LeagueChip
              key={league._id}
              league={league}
              isSelected={selectedLeague === league.apiFootballId}
              onPress={() =>
                setSelectedLeague(
                  selectedLeague === league.apiFootballId
                    ? undefined
                    : league.apiFootballId,
                )
              }
            />
          ))}

          <TouchableOpacity
            style={styles.allLeaguesBtn}
            onPress={() => setShowLeagueModal(true)}
          >
            <Text style={styles.allLeaguesBtnText}>전체 리그 보기</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  section: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.live,
  },
  dateTabContainer: {
    marginTop: 12,
    backgroundColor: Colors.surface,
  },
  dateTabContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  dateTabActive: {
    backgroundColor: Colors.primary,
  },
  dateTabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  dateTabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  leagueGroup: {
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    gap: 8,
  },
  leagueName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  leagueCountry: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  leagueChipContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
  },
  leagueChipContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  leagueChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  leagueChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  leagueChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  leagueChipTextActive: {
    color: "#ffffff",
  },
  allLeaguesBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  allLeaguesBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
});
