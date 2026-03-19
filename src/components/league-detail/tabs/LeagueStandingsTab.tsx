import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Modal,
  PanResponder,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../../hooks/useColors";
import { useError } from "../../../contexts/ErrorContext";
import { useLiveMatches } from "../../../hooks/useMatches";
import { MATCH_SEASON, STANDING_SEASON } from "../../../constants/leauges";

interface Props {
  leagueId: string;
}

const SEASONS = [
  { value: "2025", label: "2025~26" },
  { value: "2024", label: "2024~25" },
  { value: "2023", label: "2023~24" },
];

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

const LEFT_W = 200;
const COL_W = 32;
const FORM_W = 140;
const ROW_H = 44;
const HEADER_H = 45;

const ZONE_COLORS = {
  champions: "#2e7d32",
  europa: "#1565c0",
  conference: "#00b0d7",
  relegation: "#d32f2f",
};

const getZoneColor = (rank: number, total: number): string | null => {
  if (rank <= 4) return ZONE_COLORS.champions;
  if (rank === 5) return ZONE_COLORS.europa;
  if (rank === 6) return ZONE_COLORS.conference;
  if (rank > total - 3) return ZONE_COLORS.relegation;
  return null;
};

export default function LeagueStandingsTab({ leagueId }: Props) {
  const [selectedSeason, setSelectedSeason] = useState(
    STANDING_SEASON.toString(),
  );
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { errorComponent } = useError();

  const rightScrollRef = useRef<ScrollView>(null);
  const currentXRef = useRef(0);
  const [showMidDivider, setShowMidDivider] = useState(false);
  const lastDividerRef = useRef(false);

  const { data: liveMatches } = useLiveMatches();

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

  const { data: standingsData, isError } = useQuery<any>({
    queryKey: ["league-standings", leagueId, selectedSeason],
    queryFn: () =>
      api.get(
        ENDPOINTS.leagueStandingsAndSeason(
          Number(leagueId),
          Number(selectedSeason),
        ),
      ),
    staleTime: 1000 * 60 * 30,
    retry: false,
  });

  const standings: StandingEntry[] = useMemo(() => {
    const raw = standingsData?.standings?.[0] ?? [];
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
      goalsDiff: e.goalsDiff ?? e.all?.goalsDiff,
      form: e.form,
    }));
  }, [standingsData]);

  const total = standings.length;

  // 라이브 스코어 맵
  const liveScoreMap = useMemo(() => {
    if (!liveMatches) return {};
    const map: Record<
      number,
      { home: number; away: number; homeId: number; awayId: number }
    > = {};
    liveMatches
      .filter((m: any) => m.league.id === Number(leagueId))
      .forEach((m: any) => {
        const score = {
          home: m.goals.home ?? 0,
          away: m.goals.away ?? 0,
          homeId: m.homeTeam.id,
          awayId: m.awayTeam.id,
        };
        map[m.homeTeam.id] = score;
        map[m.awayTeam.id] = score;
      });
    return map;
  }, [liveMatches, leagueId]);

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

  const renderLiveChip = (teamId: number) => {
    const live = liveScoreMap[teamId];
    if (!live) return null;
    const isHome = live.homeId === teamId;
    const homeWin = live.home > live.away;
    const awayWin = live.away > live.home;
    const winning = (isHome && homeWin) || (!isHome && awayWin);
    const losing = (isHome && awayWin) || (!isHome && homeWin);
    const chipBg = winning ? "#2e7d32" : losing ? "#d32f2f" : "#757575";

    return (
      <View style={[styles.liveChip, { backgroundColor: chipBg }]}>
        <Text style={styles.liveChipText}>
          {live.home} - {live.away}
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.tableWrap}>
        {/* 시즌 선택 */}
        <TouchableOpacity
          style={styles.seasonSelector}
          onPress={() => setShowSeasonPicker(true)}
        >
          <Text style={styles.seasonLabel}>{t("standings.season")}</Text>
          <View style={styles.seasonValue}>
            <Text style={styles.seasonText}>
              {SEASONS.find((s) => s.value === selectedSeason)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.text} />
          </View>
        </TouchableOpacity>

        {/* 테이블 */}
        <View style={styles.tableBody}>
          {/* 왼쪽 고정 */}
          <View style={styles.leftPane} {...panResponder.panHandlers}>
            <View style={styles.leftHeader}>
              <Text style={styles.hText}>#</Text>
              <Text style={[styles.hText, { marginLeft: 10 }]}>
                {t("standings.club")}
              </Text>
            </View>

            {!standings || standings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("standings.empty")}</Text>
              </View>
            ) : (
              standings.map((entry) => {
                const rowKey = `${entry.rank}-${entry.team.id}`;
                const zoneColor = getZoneColor(entry.rank, total);
                return (
                  <TouchableOpacity
                    key={entry.team.id}
                    onPress={() => {
                      router.push({
                        pathname: `/team/${entry.team.id}`,
                        params: {
                          team: JSON.stringify(entry.team),
                          leagueId: JSON.stringify(standingsData.league.id),
                        },
                      });
                    }}
                  >
                    <View key={rowKey} style={styles.leftCell}>
                      {/* zone border */}
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
                      {renderLiveChip(entry.team.id)}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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
                  {t("standings.columns.played")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.win")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.draw")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.lose")}
                </Text>
                <Text style={[styles.hText, styles.colPts]}>
                  {t("standings.columns.points")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.goalsFor")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.goalsAgainst")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("standings.columns.goalDiff")}
                </Text>
                <Text style={[styles.hText, styles.colForm]}>
                  {t("standings.columns.form5")}
                </Text>
              </View>

              {standings &&
                standings.length > 0 &&
                standings.map((entry) => {
                  const formArr = (entry.form || "")
                    .split("")
                    .filter(Boolean)
                    .slice(-5);
                  const rowKey = `${entry.rank}-${entry.team.id}`;
                  return (
                    <TouchableOpacity
                      key={entry.team.id}
                      onPress={() => {
                        router.push({
                          pathname: `/team/${entry.team.id}`,
                          params: {
                            team: JSON.stringify(entry.team),
                            leagueId: JSON.stringify(standingsData.league.id),
                          },
                        });
                      }}
                    >
                      <View key={rowKey} style={styles.rightRow}>
                        <Text style={[styles.bText, styles.col]}>
                          {entry.played}
                        </Text>
                        <Text style={[styles.bText, styles.col]}>
                          {entry.win}
                        </Text>
                        <Text style={[styles.bText, styles.col]}>
                          {entry.draw}
                        </Text>
                        <Text style={[styles.bText, styles.col]}>
                          {entry.lose}
                        </Text>
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
                    </TouchableOpacity>
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

      {/* 시즌 모달 */}
      <Modal
        visible={showSeasonPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSeasonPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSeasonPicker(false)}
        >
          <View style={styles.modalContent}>
            {SEASONS.map((season) => (
              <TouchableOpacity
                key={season.value}
                style={[
                  styles.seasonOption,
                  selectedSeason === season.value && styles.seasonOptionActive,
                ]}
                onPress={() => {
                  setSelectedSeason(season.value);
                  setShowSeasonPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.seasonOptionText,
                    selectedSeason === season.value &&
                      styles.seasonOptionTextActive,
                  ]}
                >
                  {season.label}
                </Text>
                {selectedSeason === season.value && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      marginBottom: 40,
    },

    seasonSelector: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    seasonLabel: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
    seasonValue: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    seasonText: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
    },

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
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      height: HEADER_H,
    },

    rightHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingRight: 14,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      height: HEADER_H,
    },

    leftCell: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 8,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      height: ROW_H,
      overflow: "hidden",
    },

    zoneBorder: {
      width: 4,
      height: ROW_H,
      flexShrink: 0,
    },

    rightRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 14,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      height: ROW_H,
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

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      marginTop: 150,
    },
    emptyText: { fontSize: 14, color: Colors.textSecondary },

    hText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
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

    legend: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 8,
      gap: 10,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    legendDot: {
      width: 20,
      height: 20,
      borderRadius: 6,
    },
    legendText: {
      fontSize: 13,
      color: Colors.textSecondary,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      width: "80%",
      maxWidth: 300,
      overflow: "hidden",
    },
    seasonOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    seasonOptionActive: { backgroundColor: Colors.background },
    seasonOptionText: {
      fontSize: 15,
      color: Colors.text,
    },
    seasonOptionTextActive: {
      fontWeight: "700",
      color: Colors.primary,
    },
  });
