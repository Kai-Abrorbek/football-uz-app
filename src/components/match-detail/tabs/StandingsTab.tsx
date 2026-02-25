import React, { useMemo, useRef, useState } from "react";
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

import { Colors, getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

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
  form?: string; // "WWDLW"
};

const LEFT_W = 190;
const COL_W = 32;
const FORM_W = 140;

// ✅ 줄 어긋남 방지 (왼쪽/오른쪽 높이 고정)
const ROW_H = 46;
const HEADER_H = 42;

export default function StandingsTab({ match }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  // ✅ (서버 데이터 가져오는 부분 건드리지 않음)
  const { data: standing } = useQuery<any>({
    queryKey: ["standings", match.league.id],
    queryFn: () => api.get(ENDPOINTS.leagueStandings(match.league.id)),
    staleTime: 1000 * 60 * 30,
  });

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
      goalsDiff: e.goalsDiff ?? e.all?.goalsDiff ?? e.goalsDiff,
      form: e.form,
    }));
  }, [standing]);

  const homeTeamId = match.homeTeam.id;
  const awayTeamId = match.awayTeam.id;

  // ✅ 오른쪽 가로 스크롤 1개
  const rightScrollRef = useRef<ScrollView>(null);

  // ✅ 현재 x 추적 (왼쪽 드래그 시 scrollTo)
  const currentXRef = useRef(0);

  // ✅ 가운데 구분선 (x>0)
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

  // ✅ 왼쪽 영역에서도 가로 드래그하면 오른쪽 스크롤이 움직이게
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

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("standingsTab.empty")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.tableWrap}>
        {/* ✅ 표 본체: 왼쪽(고정) + 오른쪽(가로 스크롤 1개) */}
        <View style={styles.tableBody}>
          {/* 왼쪽 고정 (여기서 드래그해도 오른쪽이 움직임) */}
          <View style={styles.leftPane} {...panResponder.panHandlers}>
            {/* 헤더 */}
            <View style={styles.leftHeader}>
              <Text style={styles.hText}>#</Text>
              <Text style={[styles.hText, { marginLeft: 10 }]}>
                {t("standingsTab.club")}
              </Text>
            </View>

            {/* 바디 */}
            {standings.map((entry) => {
              const isHighlighted =
                entry.team.id === homeTeamId || entry.team.id === awayTeamId;

              const rowKey = `${entry.rank}-${entry.team.id}`;

              return (
                <View
                  key={rowKey}
                  style={[
                    styles.leftCell,
                    isHighlighted && styles.rowHighlight,
                  ]}
                >
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
                </View>
              );
            })}
          </View>

          {/* 오른쪽 가로 스크롤 영역 (헤더 + 바디) - ✅ ScrollView는 딱 1개 */}
          <ScrollView
            ref={rightScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onTableRightScroll}
            scrollEventThrottle={16}
          >
            <View>
              {/* 헤더 */}
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

              {/* 바디 */}
              {standings.map((entry) => {
                const isHighlighted =
                  entry.team.id === homeTeamId || entry.team.id === awayTeamId;

                const formArr = (entry.form || "")
                  .split("")
                  .filter(Boolean)
                  .slice(-5);

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

          {/* ✅ 가운데 세로 구분선 (스크롤 시작 시 등장) */}
          {showMidDivider && (
            <View pointerEvents="none" style={styles.midDivider} />
          )}
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyText: { fontSize: 14, color: Colors.textSecondary },

    tableWrap: { backgroundColor: Colors.surface },

    // ✅ 표 레이아웃
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

    // ✅ 높이 고정
    leftHeader: {
      height: HEADER_H,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      backgroundColor: "#f5f5f5",
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rightHeaderRow: {
      height: HEADER_H,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 0,
      paddingRight: 14,
      backgroundColor: "#f5f5f5",
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rowHighlight: { backgroundColor: "#e8f0fe" },

    // ✅ 높이 고정
    leftCell: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rightRow: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 0,
      paddingRight: 14,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    // ✅ 가운데 세로 구분선 (x>0일 때만 렌더)
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

    hText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
    bText: { fontSize: 14, color: Colors.text, textAlign: "center" },

    rank: {
      width: 22,
      textAlign: "right",
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
  });
