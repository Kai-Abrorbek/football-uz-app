import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { Colors, getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import AllMatchesModal from "../AllMatchesModal";
import { useTranslation } from "react-i18next";
import { useColors } from "../../../hooks/useColors";
import { SEASON } from "../../../constants/leauges";

interface Props {
  leagueId: string;
}

interface LeagueMatchesResponse {
  roundsData: number[];
  matches: Match[];
}

export default function LeagueMatchesTab({ leagueId }: Props) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  // 경기 목록
  const { data } = useQuery<LeagueMatchesResponse>({
    queryKey: ["league-matches-tab", leagueId],
    queryFn: () =>
      api.get(
        `${ENDPOINTS.leagueMatches}?leagueId=${leagueId}&season=${SEASON}&round=${0}`,
      ),
    staleTime: 1000 * 60 * 5,
  });

  // 경기일별 그룹핑
  const groupedMatches =
    data?.matches?.reduce((acc: any, match) => {
      // match.round 에서 숫자 추출
      const matchRound = Number(match.round?.match(/(\d+)\s*$/)?.[1]);

      if (!data?.roundsData?.includes(matchRound)) return acc;

      const key = t("leagueMatches.matchday", {
        current: matchRound,
        total: 38,
      });

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(match);
      return acc;
    }, {}) || {};

  const renderMatchCard = (match: Match) => {
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;

    // 하이라이트 썸네일 (더미)
    const hasHighlight = isFinished && Math.random() > 0.5;

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.matchCard}
        onPress={() => router.push(`/match/${match._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.matchBody}>
          {/* 팀들 */}
          <View style={styles.teamsContainer}>
            {/* 홈팀 */}
            <View style={styles.teamRow}>
              <Image
                source={match.homeTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeTeam.name}
              </Text>
            </View>

            {/* 원정팀 */}
            <View style={styles.teamRow}>
              <Image
                source={match.awayTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayTeam.name}
              </Text>
            </View>
          </View>

          {/* 스코어 or 상태 */}
          <View style={styles.scoreSection}>
            {isFinished || isLive ? (
              <>
                <View style={styles.scoreRow}>
                  <Text style={[styles.score, homeWon && styles.scoreWinner]}>
                    {homeGoals}
                  </Text>
                  {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
                <View style={styles.scoreRow}>
                  <Text style={[styles.score, awayWon && styles.scoreWinner]}>
                    {awayGoals}
                  </Text>
                  {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
              </>
            ) : (
              <Text style={styles.scheduledText}>
                {t("leagueMatches.scheduled")}
              </Text>
            )}
          </View>

          {/* 날짜/시간 or 하이라이트 */}
          <View style={styles.rightSection}>
            {hasHighlight ? (
              <View style={styles.highlightThumb}>
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
                <Text style={styles.highlightTime}>2:53</Text>
              </View>
            ) : (
              <View style={styles.dateBox}>
                <Text style={styles.statusText}>
                  {isFinished
                    ? t("leagueMatches.fulltime")
                    : isLive
                      ? "LIVE"
                      : t("leagueMatches.matchday")}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(match.date).toLocaleString(i18n.language, {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 경기 더보기 버튼 */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => setShowAllMatches(true)}
      >
        <Text style={styles.moreButtonText}>{t("leagueMatches.seeMore")}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(groupedMatches).map(
          ([date, dateMatches]: [string, any]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateTitle}>{date}</Text>

              {dateMatches.map((match: Match) => renderMatchCard(match))}
            </View>
          ),
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 전체 경기 모달 */}
      <AllMatchesModal
        visible={showAllMatches}
        leagueId={leagueId}
        onClose={() => setShowAllMatches(false)}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    moreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    moreButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    dateSection: {
      marginTop: 16,
    },
    dateTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    matchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    matchBody: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    teamsContainer: {
      flex: 1,
      gap: 8,
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    teamLogo: {
      width: 24,
      height: 24,
    },
    teamName: {
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
      color: Colors.text,
    },
    scoreSection: {
      width: 50,
      gap: 8,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 4,
    },
    score: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.textSecondary,
      minWidth: 28,
      textAlign: "right",
    },
    scoreWinner: {
      color: Colors.text,
    },
    winnerIcon: {
      fontSize: 10,
      color: Colors.text,
    },
    scheduledText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
      textAlign: "center",
    },
    rightSection: {
      width: 80,
      alignItems: "flex-end",
    },
    highlightThumb: {
      width: 80,
      height: 60,
      borderRadius: 8,
      backgroundColor: "#1a1a1a",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    playIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    highlightTime: {
      position: "absolute",
      bottom: 4,
      right: 4,
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    dateBox: {
      alignItems: "flex-end",
      gap: 2,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    timeText: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
  });
