import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";

interface Props {
  match: Match;
}

export default function H2HTab({ match }: Props) {
  const { data: h2hMatches } = useQuery<Match[]>({
    queryKey: ["h2h", match.homeTeam.id, match.awayTeam.id],
    queryFn: () =>
      api.get(`/matches/h2h/${match.homeTeam.id}/${match.awayTeam.id}`),
    staleTime: 1000 * 60 * 30,
  });

  if (!h2hMatches || h2hMatches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>상대 전적이 없습니다</Text>
      </View>
    );
  }

  // 통계 계산
  const homeWins = h2hMatches.filter((m) =>
    m.homeTeam.id === match.homeTeam.id ? m.homeTeam.winner : m.awayTeam.winner,
  ).length;

  const awayWins = h2hMatches.filter((m) =>
    m.homeTeam.id === match.awayTeam.id ? m.homeTeam.winner : m.awayTeam.winner,
  ).length;

  const draws = h2hMatches.length - homeWins - awayWins;

  const total = h2hMatches.length;
  const homeWidth = total > 0 ? (homeWins / total) * 100 : 33;
  const drawWidth = total > 0 ? (draws / total) * 100 : 34;
  const awayWidth = total > 0 ? (awayWins / total) * 100 : 33;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 통계 요약 */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>최근 {h2hMatches.length}경기</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryTeam}>
            <Text style={styles.summaryWins}>{homeWins}승</Text>
            <Text style={styles.summaryTeamName}>{match.homeTeam.name}</Text>
          </View>
          <View style={styles.summaryDraw}>
            <Text style={styles.summaryDrawCount}>{draws}</Text>
            <Text style={styles.summaryDrawLabel}>무승부</Text>
          </View>
          <View style={[styles.summaryTeam, { alignItems: "flex-end" }]}>
            <Text style={styles.summaryWins}>{awayWins}승</Text>
            <Text style={styles.summaryTeamName}>{match.awayTeam.name}</Text>
          </View>
        </View>

        {/* 바 */}
        <View style={styles.summaryBar}>
          <View style={[styles.barHome, { flex: homeWidth || 1 }]} />
          <View style={[styles.barDraw, { flex: drawWidth || 1 }]} />
          <View style={[styles.barAway, { flex: awayWidth || 1 }]} />
        </View>
      </View>

      {/* 경기 목록 */}
      {h2hMatches.map((m, index) => {
        const isHomeTeamHome = m.homeTeam.id === match.homeTeam.id;
        const homeGoals = m.goals.home ?? 0;
        const awayGoals = m.goals.away ?? 0;
        const homeWon = homeGoals > awayGoals;
        const awayWon = awayGoals > homeGoals;

        return (
          <View key={m._id} style={styles.matchCard}>
            {/* 날짜 + 리그 */}
            <Text style={styles.matchDate}>
              {new Date(m.date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              · {m.league.name}
            </Text>

            {/* 경기 결과 */}
            <View style={styles.matchRow}>
              {/* 홈팀 */}
              <View style={styles.matchTeam}>
                <Image
                  source={m.homeTeam.logo}
                  style={styles.matchLogo}
                  contentFit="contain"
                />
                <Text
                  style={[
                    styles.matchTeamName,
                    homeWon && styles.matchTeamNameWinner,
                  ]}
                >
                  {m.homeTeam.name}
                </Text>
              </View>

              {/* 스코어 */}
              <View style={styles.matchScore}>
                <Text style={styles.matchScoreText}>
                  {homeGoals} - {awayGoals}
                </Text>
                <Text style={styles.matchStatus}>
                  {m.status.short === "FT" ? "종료" : m.status.short}
                </Text>
              </View>

              {/* 원정팀 */}
              <View style={[styles.matchTeam, { alignItems: "flex-end" }]}>
                <Image
                  source={m.awayTeam.logo}
                  style={styles.matchLogo}
                  contentFit="contain"
                />
                <Text
                  style={[
                    styles.matchTeamName,
                    awayWon && styles.matchTeamNameWinner,
                  ]}
                >
                  {m.awayTeam.name}
                </Text>
              </View>
            </View>
          </View>
        );
      })}

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
  summaryContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  summaryTitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTeam: {
    flex: 1,
    alignItems: "flex-start",
    gap: 2,
  },
  summaryWins: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryTeamName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryDraw: {
    alignItems: "center",
    gap: 2,
  },
  summaryDrawCount: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryDrawLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summaryBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  barHome: {
    backgroundColor: "#4285f4",
  },
  barDraw: {
    backgroundColor: "#9e9e9e",
  },
  barAway: {
    backgroundColor: "#ea4335",
  },
  matchCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  matchDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchLogo: {
    width: 28,
    height: 28,
  },
  matchTeamName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  matchTeamNameWinner: {
    fontWeight: "700",
  },
  matchScore: {
    alignItems: "center",
    gap: 2,
  },
  matchScoreText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  matchStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
