import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface Tab {
  key: string;
  label: string;
}

interface Props {
  match: Match;
  onTabChange: (key: string) => void;
}

function CollapsibleSection({
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={sectionStyles.container}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View>
          <Text style={sectionStyles.title}>{title}</Text>
          {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
        </View>
        <View style={sectionStyles.chevronBtn}>
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
      {isOpen && <View style={sectionStyles.content}>{children}</View>}
    </View>
  );
}

export default function OverviewTab({ match, onTabChange }: Props) {
  const { data: standing } = useQuery({
    queryKey: ["standings", match.league.id],
    queryFn: () => api.get(ENDPOINTS.leagueStandings(match.league.id)),
    staleTime: 1000 * 60 * 30,
  });

  const { data: h2hMatches } = useQuery<Match[]>({
    queryKey: ["h2h", match.homeTeam.id, match.awayTeam.id],
    queryFn: () =>
      api.get(`/matches/h2h/${match.homeTeam.id}/${match.awayTeam.id}`),
    staleTime: 1000 * 60 * 30,
  });

  const standings = (standing as any)?.standings?.[0] || [];

  const getTeamStanding = (teamId: number) =>
    standings.find((s: any) => s.team.id === teamId);

  const homeStanding = getTeamStanding(match.homeTeam.id);
  const awayStanding = getTeamStanding(match.awayTeam.id);

  // 더미 예측 데이터 (API 없을 때 폴백)
  const homeWinProb = 45;
  const drawProb = 25;
  const awayWinProb = 30;

  const teams = [
    { team: match.homeTeam, standing: homeStanding },
    { team: match.awayTeam, standing: awayStanding },
  ];

  // 더미 부상 데이터
  const dummyInjuries = [
    {
      name: "Player A",
      position: "미드필더",
      reason: "부상",
      teamId: match.homeTeam.id,
    },
    {
      name: "Player B",
      position: "공격수",
      reason: "출장 정지",
      teamId: match.awayTeam.id,
    },
  ];

  return (
    <View style={styles.container}>
      {/* 경기장 정보 */}
      {match.venue && (
        <View style={styles.venueContainer}>
          <Text style={styles.venueText}>
            🏟 {match.venue.name}, {match.venue.city}
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 승리 확률 - 항상 표시 */}
        <CollapsibleSection
          title="승리 확률"
          subtitle="팀별 우승 확률"
          defaultOpen={true}
          key="prob"
        >
          <View style={styles.probContainer}>
            <View style={styles.probRow}>
              <View style={styles.probTeam}>
                <Text style={[styles.probPercent, { color: "#4285f4" }]}>
                  {homeWinProb}%
                </Text>
                <Text style={styles.probTeamName} numberOfLines={1}>
                  {match.homeTeam.name}
                </Text>
              </View>
              <View style={styles.probDraw}>
                <Text style={[styles.probPercent, { color: "#9e9e9e" }]}>
                  {drawProb}%
                </Text>
                <Text style={styles.probTeamName}>무승부</Text>
              </View>
              <View style={[styles.probTeam, { alignItems: "flex-end" }]}>
                <Text style={[styles.probPercent, { color: "#ea4335" }]}>
                  {awayWinProb}%
                </Text>
                <Text style={styles.probTeamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
              </View>
            </View>
            <View style={styles.probBar}>
              <View style={[styles.probBarHome, { flex: homeWinProb }]} />
              <View style={[styles.probBarDraw, { flex: drawProb }]} />
              <View style={[styles.probBarAway, { flex: awayWinProb }]} />
            </View>
          </View>
        </CollapsibleSection>

        {/* 순위 */}
        <CollapsibleSection
          title="순위"
          subtitle={`${match.homeTeam.name} 대 ${match.awayTeam.name}`}
          key="standings"
        >
          <View style={miniStyles.container}>
            <View style={miniStyles.header}>
              <Text style={miniStyles.headerRank}>#</Text>
              <Text style={miniStyles.headerTeam}>팀</Text>
              <Text style={miniStyles.headerStat}>경기</Text>
              <Text style={miniStyles.headerStat}>득실</Text>
              <Text style={miniStyles.headerStat}>승점</Text>
            </View>
            {[homeStanding, awayStanding]
              .filter(Boolean)
              .map((entry: any, index: number) => (
                <Pressable onPress={() => onTabChange("standings")} key={index}>
                  <View key={`${entry.rank}-${index}`} style={miniStyles.row}>
                    <Text style={miniStyles.rank}>{entry.rank}</Text>
                    <Image
                      source={entry.team.logo}
                      style={miniStyles.logo}
                      contentFit="contain"
                    />
                    <Text style={miniStyles.teamName} numberOfLines={1}>
                      {entry.team.name}
                    </Text>
                    <Text style={miniStyles.stat}>{entry.played}</Text>
                    <Text style={miniStyles.stat}>{entry.goalsDiff}</Text>
                    <Text style={[miniStyles.stat, miniStyles.points]}>
                      {entry.points}
                    </Text>
                  </View>
                </Pressable>
              ))}
            <TouchableOpacity
              style={miniStyles.allBtn}
              onPress={() => onTabChange("standings")}
            >
              <Text style={miniStyles.allBtnText}>전체 순위 →</Text>
            </TouchableOpacity>
          </View>
        </CollapsibleSection>

        {/* 부상 및 출장 정지 */}
        <CollapsibleSection
          title="부상 및 출장 정지"
          subtitle="플레이어별 상황 소식"
          key="injuries"
        >
          {/* 팀 탭 */}
          <InjurySection match={match} injuries={dummyInjuries} />
        </CollapsibleSection>

        {/* 최근 성적 */}
        <CollapsibleSection
          title="최근 성적"
          subtitle="팀별 최근 경기 결과"
          key="form"
        >
          <Text style={styles.formSubtitle}>최근 5경기</Text>
          {teams.map(({ team, standing }) => {
            const form = standing?.form?.split("").slice(-5) || [];
            return (
              <Pressable onPress={() => onTabChange("standings")} key={team.id}>
                <View key={team.id} style={formStyles.teamRow}>
                  {standing && (
                    <Text style={formStyles.rank}>{standing.rank}</Text>
                  )}
                  <Image
                    source={team.logo}
                    style={formStyles.teamLogo}
                    contentFit="contain"
                  />
                  <Text style={formStyles.teamName} numberOfLines={1}>
                    {team.name}
                  </Text>
                  <View style={formStyles.formIcons}>
                    {form.length > 0 ? (
                      form.map((f: string, i: number) => (
                        <View
                          key={i}
                          style={[
                            formStyles.formIcon,
                            f === "W" && formStyles.formW,
                            f === "L" && formStyles.formL,
                            f === "D" && formStyles.formD,
                          ]}
                        >
                          <Text style={formStyles.formText}>{f}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>데이터 없음</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </CollapsibleSection>

        {/* 상대 전적 */}
        <CollapsibleSection
          title="상대 전적"
          subtitle="이전 경기 결과"
          key="h2h"
        >
          {!h2hMatches || h2hMatches.length === 0 ? (
            <Text style={styles.emptyText}>상대 전적이 없습니다</Text>
          ) : (
            <View style={h2hStyles.container}>
              {/* 통계 */}
              {(() => {
                const homeWins = h2hMatches.filter((m) =>
                  m.homeTeam.id === match.homeTeam.id
                    ? m.homeTeam.winner
                    : m.awayTeam.winner,
                ).length;
                const awayWins = h2hMatches.filter((m) =>
                  m.homeTeam.id === match.awayTeam.id
                    ? m.homeTeam.winner
                    : m.awayTeam.winner,
                ).length;
                const draws = h2hMatches.length - homeWins - awayWins;
                const total = h2hMatches.length;

                return (
                  <View style={h2hStyles.summary}>
                    <View style={h2hStyles.summaryTeam}>
                      <Text style={h2hStyles.summaryWins}>{homeWins}승</Text>
                      <Text style={h2hStyles.summaryTeamName} numberOfLines={1}>
                        {match.homeTeam.name}
                      </Text>
                    </View>
                    <View style={h2hStyles.summaryDraw}>
                      <Text style={h2hStyles.summaryWins}>{draws}</Text>
                      <Text style={h2hStyles.summaryTeamName}>무승부</Text>
                    </View>
                    <View
                      style={[
                        h2hStyles.summaryTeam,
                        { alignItems: "flex-end" },
                      ]}
                    >
                      <Text style={h2hStyles.summaryWins}>{awayWins}승</Text>
                      <Text style={h2hStyles.summaryTeamName} numberOfLines={1}>
                        {match.awayTeam.name}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* 경기 목록 */}
              {h2hMatches.slice(0, 5).map((m) => {
                const homeGoals = m.goals.home ?? 0;
                const awayGoals = m.goals.away ?? 0;
                const homeWon = homeGoals > awayGoals;
                const awayWon = awayGoals > homeGoals;

                return (
                  <View key={m._id} style={h2hStyles.matchRow}>
                    <Text style={h2hStyles.matchDate}>
                      {new Date(m.date).toLocaleDateString("ko-KR", {
                        year: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                    <View style={h2hStyles.matchTeams}>
                      <Text
                        style={[
                          h2hStyles.matchTeamName,
                          homeWon && h2hStyles.winner,
                        ]}
                        numberOfLines={1}
                      >
                        {m.homeTeam.name}
                      </Text>
                      <Text style={h2hStyles.matchScore}>
                        {homeGoals} - {awayGoals}
                      </Text>
                      <Text
                        style={[
                          h2hStyles.matchTeamName,
                          h2hStyles.matchTeamNameRight,
                          awayWon && h2hStyles.winner,
                        ]}
                        numberOfLines={1}
                      >
                        {m.awayTeam.name}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </CollapsibleSection>
      </ScrollView>

      <View style={{ height: 20 }} />
    </View>
  );
}

function InjurySection({ match, injuries }: { match: Match; injuries: any[] }) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");

  const filteredInjuries = injuries.filter(
    (i) =>
      i.teamId ===
      (selectedTeam === "home" ? match.homeTeam.id : match.awayTeam.id),
  );

  return (
    <View>
      {/* 팀 탭 */}
      <View style={injuryStyles.teamTabs}>
        <TouchableOpacity
          style={[
            injuryStyles.teamTab,
            selectedTeam === "home" && injuryStyles.teamTabActive,
          ]}
          onPress={() => setSelectedTeam("home")}
        >
          <Image
            source={match.homeTeam.logo}
            style={injuryStyles.tabLogo}
            contentFit="contain"
          />
          <Text
            style={[
              injuryStyles.tabText,
              selectedTeam === "home" && injuryStyles.tabTextActive,
            ]}
          >
            {match.homeTeam.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            injuryStyles.teamTab,
            selectedTeam === "away" && injuryStyles.teamTabActive,
          ]}
          onPress={() => setSelectedTeam("away")}
        >
          <Image
            source={match.awayTeam.logo}
            style={injuryStyles.tabLogo}
            contentFit="contain"
          />
          <Text
            style={[
              injuryStyles.tabText,
              selectedTeam === "away" && injuryStyles.tabTextActive,
            ]}
          >
            {match.awayTeam.name}
          </Text>
        </TouchableOpacity>
      </View>

      {filteredInjuries.length === 0 ? (
        <Text style={injuryStyles.empty}>부상/출장정지 선수 없음</Text>
      ) : (
        filteredInjuries.map((injury, i) => (
          <View key={i} style={injuryStyles.injuryRow}>
            <View style={injuryStyles.injuryIcon}>
              <Text>🚑</Text>
            </View>
            <View style={injuryStyles.injuryInfo}>
              <Text style={injuryStyles.injuryName}>{injury.name}</Text>
              <Text style={injuryStyles.injuryPos}>{injury.position}</Text>
            </View>
            <View style={injuryStyles.injuryBadge}>
              <Text style={injuryStyles.injuryBadgeText}>{injury.reason}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  venueContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  venueText: { fontSize: 13, color: Colors.textSecondary },
  probContainer: { gap: 12 },
  probRow: { flexDirection: "row", justifyContent: "space-between" },
  probTeam: { flex: 1, alignItems: "flex-start", gap: 2 },
  probDraw: { alignItems: "center", gap: 2 },
  probPercent: { fontSize: 20, fontWeight: "700", color: Colors.text },
  probTeamName: { fontSize: 12, color: Colors.textSecondary },
  probBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  probBarHome: { backgroundColor: "#4285f4" },
  probBarDraw: { backgroundColor: "#9e9e9e" },
  probBarAway: { backgroundColor: "#ea4335" },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 8,
  },
  formSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
});

const sectionStyles = StyleSheet.create({
  container: { backgroundColor: Colors.surface, marginBottom: 8 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chevronBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16 },
});

const miniStyles = StyleSheet.create({
  container: { gap: 4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRank: {
    width: 24,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  headerTeam: {
    flex: 1,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  headerStat: {
    width: 40,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  rank: {
    width: 24,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  logo: { width: 22, height: 22 },
  teamName: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.text },
  stat: { width: 40, fontSize: 13, color: Colors.text, textAlign: "center" },
  points: { fontWeight: "700" },
  allBtn: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  allBtnText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
});

const formStyles = StyleSheet.create({
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  rank: {
    width: 20,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  teamLogo: { width: 28, height: 28 },
  teamName: { flex: 1, fontSize: 14, fontWeight: "500", color: Colors.text },
  formIcons: { flexDirection: "row", gap: 4 },
  formIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.border,
  },
  formW: { backgroundColor: "#34a853" },
  formL: { backgroundColor: "#ea4335" },
  formD: { backgroundColor: "#9e9e9e" },
  formText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },
});

const h2hStyles = StyleSheet.create({
  container: { gap: 8 },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  summaryTeam: { flex: 1, gap: 2 },
  summaryDraw: { alignItems: "center", gap: 2 },
  summaryWins: { fontSize: 20, fontWeight: "700", color: Colors.text },
  summaryTeamName: { fontSize: 11, color: Colors.textSecondary },
  matchRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  matchDate: { fontSize: 11, color: Colors.textSecondary },
  matchTeams: { flexDirection: "row", alignItems: "center", gap: 8 },
  matchTeamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  matchTeamNameRight: { textAlign: "right" },
  winner: { fontWeight: "700", color: Colors.primary },
  matchScore: { fontSize: 15, fontWeight: "700", color: Colors.text },
});

const injuryStyles = StyleSheet.create({
  teamTabs: { flexDirection: "row", marginBottom: 12 },
  teamTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  teamTabActive: { borderBottomColor: Colors.primary },
  tabLogo: { width: 18, height: 18 },
  tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  tabTextActive: { color: Colors.primary, fontWeight: "700" },
  empty: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 12,
  },
  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  injuryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  injuryInfo: { flex: 1, gap: 2 },
  injuryName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  injuryPos: { fontSize: 12, color: Colors.textSecondary },
  injuryBadge: {
    backgroundColor: "#fff0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  injuryBadgeText: { fontSize: 11, color: Colors.live, fontWeight: "600" },
});
