import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  PanResponder,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";
import { useError } from "../../../contexts/ErrorContext";
import { STANDING_SEASON } from "../../../constants/leauges";
import { useLiveMatches } from "../../../hooks/useMatches";

interface Props {
  match: Match;
}

type StandingEntry = {
  rank: number;
  team: { id: number; name: string; logo: string };
  played: number;
  win: number;
  draw: number;
  lose: number;
  points: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalsDiff?: number;
  form?: string;
};

const LEFT_W = 215;
const COL_W = 32;
const FORM_W = 140;
const ROW_H = 46;
const HEADER_H = 42;

// 범례 색상
const ZONE_COLORS = {
  champions: "#2e7d32", // 챔피언스리그
  europa: "#1565c0", // 유로파리그
  conference: "#00b0d7", // 유로파 컨퍼런스
  relegation: "#d32f2f", // 강등
};

const getZoneColor = (rank: number, total: number): string | null => {
  if (rank <= 4) return ZONE_COLORS.champions;
  if (rank === 5) return ZONE_COLORS.europa;
  if (rank === 6) return ZONE_COLORS.conference;
  if (rank > total - 3) return ZONE_COLORS.relegation;
  return null;
};

export default function StandingsTab({ match }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { errorComponent } = useError();

  const { data: standing, isError } = useQuery<any>({
    queryKey: ["standings", match.league.id],
    queryFn: () =>
      api.get(
        ENDPOINTS.leagueStandingsAndSeason(match.league.id, STANDING_SEASON),
      ),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const { data: liveMatches } = useLiveMatches();

  // 현재 리그의 라이브 경기만 필터링 후 팀id → 스코어 맵
  const liveScoreMap = useMemo(() => {
    if (!liveMatches) return {};
    const map: Record<
      number,
      {
        home: number;
        away: number;
        homeId: number;
        awayId: number;
        isLive: boolean;
      }
    > = {};

    liveMatches
      .filter((m: any) => m.league.id === match.league.id)
      .forEach((m: any) => {
        const score = {
          home: m.goals.home ?? 0,
          away: m.goals.away ?? 0,
          homeId: m.homeTeam.id,
          awayId: m.awayTeam.id,
          isLive: true,
        };
        map[m.homeTeam.id] = score;
        map[m.awayTeam.id] = score;
      });

    return map;
  }, [liveMatches, match.league.id]);

  const standings: StandingEntry[] = useMemo(() => {
    const raw = standing?.standings?.[0] ?? [];
    return raw.map((e: any) => ({
      rank: e.rank,
      team: e.team,
      played: e.played ?? e.all?.played,
      win: e.win ?? e.all?.win,
      draw: e.draw ?? e.all?.draw,
      lose: e.lose ?? e.all?.lose,
      points: e.points,
      goalsFor: e.goalsFor ?? e.all?.goals?.for,
      goalsAgainst: e.goalsAgainst ?? e.all?.goals?.against,
      goalsDiff: e.goalsDiff ?? e.all?.goals?.diff ?? e.goalsDiff,
      form: e.form,
    }));
  }, [standing]);

  const total = standings.length;
  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  const rightScrollRef = useRef<ScrollView>(null);
  const currentXRef = useRef(0);
  const [showMidDivider, setShowMidDivider] = useState(false);
  const lastDividerRef = useRef(false);

  const onTableRightScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    currentXRef.current = x;
    const next = x > 0;
    if (lastDividerRef.current !== next) {
      lastDividerRef.current = next;
      setShowMidDivider(next);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const ax = Math.abs(g.dx);
        const ay = Math.abs(g.dy);
        return ax > 6 && ax > ay;
      },
      onPanResponderMove: (_, g) => {
        const nextX = Math.max(0, currentXRef.current - g.dx);
        rightScrollRef.current?.scrollTo({ x: nextX, animated: false });
        const nextDivider = nextX > 0;
        if (lastDividerRef.current !== nextDivider) {
          lastDividerRef.current = nextDivider;
          setShowMidDivider(nextDivider);
        }
      },
    }),
  ).current;

  const renderFormDot = (r: string) => {
    if (r === "W")
      return (
        <View style={[styles.formDot, styles.formW]}>
          <Ionicons name="checkmark" size={12} color="#fff" />
        </View>
      );
    if (r === "L")
      return (
        <View style={[styles.formDot, styles.formL]}>
          <Ionicons name="close" size={12} color="#fff" />
        </View>
      );
    return (
      <View style={[styles.formDot, styles.formD]}>
        <Ionicons name="remove" size={12} color="#fff" />
      </View>
    );
  };

  // 라이브 스코어 칩
  const renderLiveChip = (teamId: number) => {
    const live = liveScoreMap[teamId];
    if (!live) return null;
    const isHome = live.homeId === teamId;
    const myScore = isHome ? live.home : live.away;
    const oppScore = isHome ? live.away : live.home;

    const winning = myScore > oppScore;
    const losing = myScore < oppScore;
    const chipBg = winning ? "#2e7d32" : losing ? "#d32f2f" : "#757575";

    return (
      <View style={[styles.liveChip, { backgroundColor: chipBg }]}>
        <Text style={styles.liveChipText}>
          {myScore} - {oppScore}
        </Text>
      </View>
    );
  };

  if (isError) {
    return errorComponent(isError, {
      icon: "podium-outline",
      title: t("standings.notFound"),
      subtitle: t("standings.notFoundSub"),
    });
  }

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("standingsTab.empty")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableWrap}>
        <View style={styles.tableBody}>
          {/* 왼쪽 고정 */}
          <View style={styles.leftPane} {...panResponder.panHandlers}>
            <View style={styles.leftHeader}>
              <Text style={styles.hText}>#</Text>
              <Text style={[styles.hText, { marginLeft: 10 }]}>
                {t("standingsTab.club")}
              </Text>
            </View>

            {standings.map((entry) => {
              const isHighlighted =
                entry.team.id === homeTeamId || entry.team.id === awayTeamId;
              const zoneColor = getZoneColor(entry.rank, total);
              const rowKey = `${entry.rank}-${entry.team.id}`;

              return (
                <View
                  key={rowKey}
                  style={[
                    styles.leftCell,
                    isHighlighted && styles.rowHighlight,
                  ]}
                >
                  {/* 왼쪽 zone border */}
                  <View
                    style={[
                      styles.zoneBorder,
                      { backgroundColor: zoneColor ?? "transparent" },
                    ]}
                  />
                  <Text style={styles.rank}>{entry.rank}</Text>
                  <Image
                    source={entry.team.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                  <Text
                    style={styles.teamName}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {entry.team.name}
                  </Text>
                  {/* 라이브 칩 */}
                  {renderLiveChip(entry.team.id)}
                </View>
              );
            })}
          </View>

          {/* 오른쪽 가로 스크롤 */}
          <ScrollView
            ref={rightScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onTableRightScroll}
            scrollEventThrottle={16}
          >
            <View>
              <View style={styles.rightHeaderRow}>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.played")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.win")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.draw")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.lose")}
                </Text>
                <Text style={[styles.hText, styles.colPts]}>
                  {t("standingsTab.points")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.goalsFor")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.goalsAgainst")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standingsTab.goalDiff")}
                </Text>
                <Text style={[styles.hText, styles.colForm]}>
                  {t("standingsTab.last5")}
                </Text>
              </View>

              {standings.map((entry) => {
                const isHighlighted =
                  entry.team.id === homeTeamId || entry.team.id === awayTeamId;
                const formArr = (entry.form || "")
                  .split("")
                  .filter(Boolean)
                  .slice(-5)
                  .reverse();
                const rowKey = `${entry.rank}-${entry.team.id}`;

                return (
                  <View
                    key={rowKey}
                    style={[
                      styles.rightRow,
                      isHighlighted && styles.rowHighlight,
                    ]}
                  >
                    <Text style={[styles.bText, styles.col]}>
                      {entry.played}
                    </Text>
                    <Text style={[styles.bText, styles.col]}>{entry.win}</Text>
                    <Text style={[styles.bText, styles.col]}>{entry.draw}</Text>
                    <Text style={[styles.bText, styles.col]}>{entry.lose}</Text>
                    <Text style={[styles.bText, styles.colPts, styles.pts]}>
                      {entry.points}
                    </Text>
                    <Text style={[styles.bText, styles.col]}>
                      {entry.goalsFor ?? "-"}
                    </Text>
                    <Text style={[styles.bText, styles.col]}>
                      {entry.goalsAgainst ?? "-"}
                    </Text>
                    <Text style={[styles.bText, styles.col]}>
                      {entry.goalsDiff ?? "-"}
                    </Text>
                    <View style={[styles.colForm, styles.formCell]}>
                      <View style={styles.formRow}>
                        {formArr.map((r, i) => (
                          <View key={i}>{renderFormDot(r)}</View>
                        ))}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {showMidDivider && (
            <View pointerEvents="none" style={styles.midDivider} />
          )}
        </View>
      </View>

      {/* 범례 */}
      <View style={styles.legend}>
        {[
          {
            color: ZONE_COLORS.champions,
            label: t("standingsTab.legend.champions"),
          },
          { color: ZONE_COLORS.europa, label: t("standingsTab.legend.europa") },
          {
            color: ZONE_COLORS.conference,
            label: t("standingsTab.legend.conference"),
          },
          {
            color: ZONE_COLORS.relegation,
            label: t("standingsTab.legend.relegation"),
          },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
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
      marginBottom: 40,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: Colors.surface2,
    },
    emptyText: { fontSize: 14, color: Colors.textSecondary },

    tableWrap: { backgroundColor: Colors.surface },

    tableBody: {
      flexDirection: "row",
      alignItems: "flex-start",
      position: "relative",
      backgroundColor: Colors.surface,
    },

    leftPane: {
      width: LEFT_W,
      backgroundColor: Colors.surface,
    },

    leftHeader: {
      height: HEADER_H,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rightHeaderRow: {
      height: HEADER_H,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 14,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rowHighlight: { backgroundColor: Colors.background2 },

    leftCell: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 8,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      overflow: "hidden",
    },

    // zone border (왼쪽 4px 세로선)
    zoneBorder: {
      width: 4,
      height: ROW_H,
      flexShrink: 0,
      borderTopRightRadius: 50,
      borderBottomRightRadius: 50,
    },

    rightRow: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 14,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    midDivider: {
      position: "absolute",
      left: LEFT_W,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: Colors.border,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 2, height: 0 },
      elevation: 3,
    },

    hText: { fontSize: 12, fontWeight: "700", color: Colors.text },
    bText: { fontSize: 14, color: Colors.text, textAlign: "center" },

    rank: {
      width: 22,
      textAlign: "center",
      fontSize: 14,
      fontWeight: "800",
      color: Colors.text,
    },
    teamLogo: { width: 22, height: 22 },
    teamName: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.text },

    col: { width: COL_W, textAlign: "center" },
    colPts: { width: 62, textAlign: "center" },
    pts: { fontWeight: "900" },

    colForm: { width: FORM_W },
    formCell: { justifyContent: "center", alignItems: "center" },
    formRow: { flexDirection: "row", gap: 6, alignItems: "center" },

    formDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    formW: { backgroundColor: "#2e7d32" },
    formL: { backgroundColor: "#d32f2f" },
    formD: { backgroundColor: "#9e9e9e" },

    // 라이브 칩
    liveChip: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 10,
      flexShrink: 0,
    },
    liveChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#ffffff",
    },

    // 범례
    legend: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      margin: 8,
      gap: 10,
      borderRadius: 15,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    legendDot: {
      width: 14,
      height: 14,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
  });
