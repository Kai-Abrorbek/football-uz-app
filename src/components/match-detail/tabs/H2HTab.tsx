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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 경기 목록 */}
      {h2hMatches.map((m, index) => {
        const homeGoals = m.goals.home ?? 0;
        const awayGoals = m.goals.away ?? 0;
        const homeWon = homeGoals > awayGoals;
        const awayWon = awayGoals > homeGoals;
        const isDraw = homeGoals === awayGoals;

        // 레드카드 체크
        const homeRedCards =
          m.statistics?.find((s) => s.side === "home")?.redCards || 0;
        const awayRedCards =
          m.statistics?.find((s) => s.side === "away")?.redCards || 0;

        return (
          <View key={m._id} style={styles.matchCard}>
            {/* 팀 + 스코어 */}
            <View style={styles.matchRow}>
              {/* 홈팀 */}
              <View style={styles.teamSide}>
                <Image
                  source={m.homeTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {m.homeTeam.name}
                </Text>
                {homeRedCards > 0 && <Text style={styles.redCard}>🟥</Text>}
              </View>

              {/* 스코어 */}
              <View style={styles.scoreContainer}>
                <View style={styles.scoreRow}>
                  <Text style={[styles.score, homeWon && styles.scoreWinner]}>
                    {homeGoals}
                  </Text>
                  {homeWon && <Text style={styles.winnerArrow}>◀</Text>}
                  {isDraw && <Text style={styles.drawDash}>-</Text>}
                  {awayWon && <Text style={styles.winnerArrow}>▶</Text>}
                  <Text style={[styles.score, awayWon && styles.scoreWinner]}>
                    {awayGoals}
                  </Text>
                </View>
              </View>

              {/* 원정팀 */}
              <View style={[styles.teamSide, styles.teamSideRight]}>
                {awayRedCards > 0 && <Text style={styles.redCard}>🟥</Text>}
                <Text
                  style={[styles.teamName, styles.teamNameRight]}
                  numberOfLines={1}
                >
                  {m.awayTeam.name}
                </Text>
                <Image
                  source={m.awayTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
              </View>
            </View>

            {/* 날짜 + 대회 */}
            <View style={styles.matchInfo}>
              <Text style={styles.matchStatus}>
                {m.status.short === "FT" ? "풀타임" : m.status.short}
              </Text>
              <Text style={styles.matchDate}>
                {new Date(m.date)
                  .toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })
                  .replace(/\. /g, ". ")}
              </Text>
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
  matchCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamSideRight: {
    flexDirection: "row-reverse",
  },
  teamLogo: {
    width: 32,
    height: 32,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  teamNameRight: {
    textAlign: "right",
  },
  redCard: {
    fontSize: 14,
  },
  scoreContainer: {
    alignItems: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  score: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textSecondary,
    minWidth: 30,
    textAlign: "center",
  },
  scoreWinner: {
    color: Colors.text,
  },
  winnerArrow: {
    fontSize: 12,
    color: Colors.text,
  },
  drawDash: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  matchInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  matchStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  matchDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
