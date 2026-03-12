import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface Props {
  match: Match;
}

const DEFAULT_SHOW = 7;

export default function H2HTab({ match }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<"all" | "home" | "tournament">("all");
  const [expanded, setExpanded] = useState(false);

  const { data: h2hMatches } = useQuery<Match[]>({
    queryKey: ["h2h", match.homeTeam.id, match.awayTeam.id],
    queryFn: () =>
      api.get(`/matches/h2h/${match.homeTeam.id}/${match.awayTeam.id}`),
    staleTime: 1000 * 60 * 30,
  });

  if (!h2hMatches || h2hMatches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("h2h.empty")}</Text>
      </View>
    );
  }

  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // 밝기 계산
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  // 통계 계산
  const homeWins = h2hMatches.filter((m) =>
    m.homeTeam.id === match.homeTeam.id ? m.homeTeam.winner : m.awayTeam.winner,
  ).length;
  const awayWins = h2hMatches.filter((m) =>
    m.homeTeam.id === match.awayTeam.id ? m.homeTeam.winner : m.awayTeam.winner,
  ).length;

  const homeColor = h2hMatches[0].homeTeam.color;
  const awayColor = h2hMatches[0].awayTeam.color;

  const draws = h2hMatches.length - homeWins - awayWins;
  const total = h2hMatches.length;

  const homeW = total > 0 ? (homeWins / total) * 100 : 33;
  const drawW = total > 0 ? (draws / total) * 100 : 34;
  const awayW = total > 0 ? (awayWins / total) * 100 : 33;

  // 필터 적용
  const filteredMatches = h2hMatches.filter((m) => {
    if (filter === "home") {
      return (
        m.homeTeam.id === match.homeTeam.id ||
        m.awayTeam.id === match.homeTeam.id
      );
    }
    if (filter === "tournament") {
      return m.league.id === match.league.id;
    }
    return true;
  });

  const visibleMatches = expanded
    ? filteredMatches
    : filteredMatches.slice(0, DEFAULT_SHOW);

  const hasMore = filteredMatches.length > DEFAULT_SHOW;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <View style={styles.container}>
      {/* 상단 통계 */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          {/* 홈팀 승 */}
          <View style={styles.statItem}>
            <View style={[styles.statBubble, { backgroundColor: homeColor }]}>
              <Text style={styles.statBubbleText}>{homeWins}</Text>
            </View>
            <Text style={styles.statLabel}>{t("h2h.wins")}</Text>
          </View>

          {/* 무 */}
          <View style={styles.statItem}>
            <View
              style={[styles.statBubble, { backgroundColor: Colors.border }]}
            >
              <Text style={[styles.statBubbleText, { color: Colors.text }]}>
                {draws}
              </Text>
            </View>
            <Text style={styles.statLabel}>{t("h2h.draws")}</Text>
          </View>

          {/* 어웨이팀 승 */}
          <View style={styles.statItem}>
            <View style={[styles.statBubble, { backgroundColor: awayColor }]}>
              <Text style={styles.statBubbleText}>{awayWins}</Text>
            </View>
            <Text style={styles.statLabel}>{t("h2h.wins")}</Text>
          </View>
        </View>

        {/* 비율 바 */}
        <View style={styles.ratioBar}>
          <View
            style={[
              styles.ratioHome,
              { flex: homeW, backgroundColor: homeColor },
            ]}
          />
          <View style={[styles.ratioDraw, { flex: drawW }]} />
          <View
            style={[
              styles.ratioAway,
              { flex: awayW, backgroundColor: awayColor },
            ]}
          />
        </View>
      </View>

      {/* 필터 버튼 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "home" && styles.filterBtnActive,
          ]}
          onPress={() => setFilter(filter === "home" ? "all" : "home")}
        >
          <Image
            source={match.homeTeam.logo}
            style={styles.filterLogo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.filterText,
              filter === "home" && styles.filterTextActive,
            ]}
          >
            {t("h2h.home")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            filter === "tournament" && styles.filterBtnActive,
          ]}
          onPress={() =>
            setFilter(filter === "tournament" ? "all" : "tournament")
          }
        >
          <Image
            source={match.league.logo}
            style={styles.filterLogo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.filterText,
              filter === "tournament" && styles.filterTextActive,
            ]}
          >
            {t("h2h.thisTournament")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 경기 카드 */}
      <View style={styles.matchList}>
        {visibleMatches.map((m) => {
          const homeGoals = m.goals.home ?? 0;
          const awayGoals = m.goals.away ?? 0;
          const homeWon = homeGoals > awayGoals;
          const awayWon = awayGoals > homeGoals;
          const isAET = m.status.short === "AET";

          return (
            <View key={m._id}>
              {/* 날짜 + 리그 */}
              <View style={styles.matchMeta}>
                <Text style={styles.matchDate}>{formatDate(m.date)}</Text>
                <View style={styles.leagueBadge}>
                  <Text style={styles.leagueBadgeText}>
                    {m.league.name.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* 팀 + 스코어 */}
              <View style={styles.matchRow}>
                {/* 홈팀 */}
                <View style={styles.teamSide}>
                  <Text
                    style={[styles.teamName, homeWon && styles.teamNameBold]}
                    numberOfLines={1}
                  >
                    {m.homeTeam.name}
                  </Text>
                  <Image
                    source={m.homeTeam.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                </View>

                {/* 스코어 */}
                <View style={styles.scoreWrap}>
                  <Text style={styles.scoreText}>
                    {homeGoals} - {awayGoals}
                  </Text>
                  {isAET && <Text style={styles.aetText}>AET</Text>}
                </View>

                {/* 원정팀 */}
                <View style={[styles.teamSide, styles.teamSideRight]}>
                  <Image
                    source={m.awayTeam.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                  <Text
                    style={[
                      styles.teamName,
                      styles.teamNameRight,
                      awayWon && styles.teamNameBold,
                    ]}
                    numberOfLines={1}
                  >
                    {m.awayTeam.name}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />
            </View>
          );
        })}

        {/* 모두 보기 버튼 */}
        {hasMore && (
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.expandBtnText}>
              {expanded ? t("h2h.showLess") : t("h2h.showAll")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 20 }} />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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

    // 상단 통계
    statsCard: {
      backgroundColor: Colors.surface,
      padding: 20,
      marginBottom: 8,
      gap: 16,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItem: {
      alignItems: "center",
      gap: 8,
    },
    statBubble: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    statBubbleText: {
      fontSize: 24,
      fontWeight: "800",
      color: "white",
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 1,
    },
    statLabel: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    ratioBar: {
      flexDirection: "row",
      height: 6,
      borderRadius: 3,
      overflow: "hidden",
      gap: 2,
    },
    ratioHome: {
      backgroundColor: "#c0392b",
      borderRadius: 3,
    },
    ratioDraw: {
      backgroundColor: Colors.border,
      borderRadius: 3,
    },
    ratioAway: {
      backgroundColor: "#4a235a",
      borderRadius: 3,
    },

    // 필터
    filterRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      marginBottom: 8,
    },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
    },
    filterBtnActive: {
      borderColor: Colors.primary,
      backgroundColor: Colors.background,
    },
    filterLogo: {
      width: 18,
      height: 18,
    },
    filterText: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    filterTextActive: {
      color: Colors.primary,
      fontWeight: "700",
    },

    // 경기 목록
    matchList: {
      backgroundColor: Colors.surface,
    },
    matchMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    matchDate: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    leagueBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: Colors.background,
    },
    leagueBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    matchRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 8,
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
      width: 36,
      height: 36,
    },
    teamName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "400",
      color: Colors.text,
    },
    teamNameRight: {
      textAlign: "right",
    },
    teamNameBold: {
      fontWeight: "700",
    },
    scoreWrap: {
      alignItems: "center",
      minWidth: 60,
    },
    scoreText: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
    },
    aetText: {
      fontSize: 11,
      color: Colors.textSecondary,
      fontWeight: "500",
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginHorizontal: 16,
    },

    // 모두 보기
    expandBtn: {
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    expandBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.primary,
    },
  });
