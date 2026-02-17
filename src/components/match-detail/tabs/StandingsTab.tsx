import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";

interface Props {
  match: Match;
}

export default function StandingsTab({ match }: Props) {
  const { data: standing } = useQuery<any>({
    queryKey: ["standings", match.league.id],
    queryFn: () => api.get(ENDPOINTS.leagueStandings(match.league.id)),
    staleTime: 1000 * 60 * 30,
  });

  const standings = standing?.standings?.[0] || [];

  // 양 팀 하이라이트
  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  const renderFormIcon = (result: string) => {
    switch (result) {
      case "W":
        return (
          <View style={[styles.formIcon, styles.formW]}>
            <Text style={styles.formText}>W</Text>
          </View>
        );
      case "L":
        return (
          <View style={[styles.formIcon, styles.formL]}>
            <Text style={styles.formText}>L</Text>
          </View>
        );
      case "D":
        return (
          <View style={[styles.formIcon, styles.formD]}>
            <Text style={styles.formText}>D</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>순위 정보가 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 리그 이름 */}
      <View style={styles.leagueHeader}>
        <Image
          source={match.league.logo}
          style={styles.leagueLogo}
          contentFit="contain"
        />
        <Text style={styles.leagueName}>{match.league.name}</Text>
      </View>

      {/* 테이블 헤더 */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.rankCol]}>#</Text>
        <Text style={[styles.headerText, styles.teamCol]}>클럽</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <Text style={styles.headerStatText}>경기</Text>
            <Text style={styles.headerStatText}>승</Text>
            <Text style={styles.headerStatText}>무</Text>
            <Text style={styles.headerStatText}>패</Text>
            <Text style={styles.headerStatText}>승점</Text>
            <Text style={styles.headerStatText}>득실</Text>
            <Text style={styles.headerStatText}>최근 5경기</Text>
          </View>
        </ScrollView>
      </View>

      {/* 순위 목록 */}
      {standings.map((entry: any) => {
        const isHighlighted =
          entry.team.id === homeTeamId || entry.team.id === awayTeamId;
        const form = entry.form?.split("") || [];

        return (
          <View
            key={entry.rank}
            style={[
              styles.tableRow,
              isHighlighted && styles.tableRowHighlighted,
            ]}
          >
            {/* 순위 */}
            <Text style={[styles.rankText, styles.rankCol]}>{entry.rank}</Text>

            {/* 팀 */}
            <View style={styles.teamCol}>
              <Image
                source={entry.team.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {entry.team.name}
              </Text>
            </View>

            {/* 통계 (스크롤) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{entry.played}</Text>
                <Text style={styles.statText}>{entry.win}</Text>
                <Text style={styles.statText}>{entry.draw}</Text>
                <Text style={styles.statText}>{entry.lose}</Text>
                <Text style={[styles.statText, styles.pointsText]}>
                  {entry.points}
                </Text>
                <Text style={styles.statText}>{entry.goalsDiff}</Text>
                <View style={styles.formContainer}>
                  {form.slice(-5).map((f: string, i: number) => (
                    <View key={i}>{renderFormIcon(f)}</View>
                  ))}
                </View>
              </View>
            </ScrollView>
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
  leagueHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 4,
  },
  leagueLogo: {
    width: 24,
    height: 24,
  },
  leagueName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  headerStatText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    width: 36,
    textAlign: "center",
  },
  rankCol: {
    width: 28,
    textAlign: "center",
  },
  teamCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 120,
    maxWidth: 160,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowHighlighted: {
    backgroundColor: "#e8f0fe",
  },
  rankText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  teamLogo: {
    width: 20,
    height: 20,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  statText: {
    fontSize: 13,
    color: Colors.text,
    width: 36,
    textAlign: "center",
  },
  pointsText: {
    fontWeight: "700",
  },
  formContainer: {
    flexDirection: "row",
    gap: 2,
    width: 110,
    justifyContent: "center",
  },
  formIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  formW: {
    backgroundColor: Colors.win,
  },
  formL: {
    backgroundColor: Colors.loss,
  },
  formD: {
    backgroundColor: Colors.draw,
  },
  formText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ffffff",
  },
});
