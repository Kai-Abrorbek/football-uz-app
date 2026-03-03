import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  PanResponder,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { StandingEntry, Team } from "../../../types";
import { router } from "expo-router";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";
import { useError } from "../../../contexts/ErrorContext";

interface Props {
  teamId: string;
  leagueId: string;
}

type League = {
  name: number;
  id: number;
};

const SEASONS = [
  { value: "2025", label: "2025~26" },
  { value: "2024", label: "2024~25" },
  { value: "2023", label: "2023~24" },
];

const LEFT_W = 190;
const COL_W = 32;
const FORM_W = 140;

// ✅ 스크롤 위치 계산용(고정 높이로 맞춤)
const TOP_UI_H = 70; // 리그/시즌 선택 영역 대충
const HEADER_H = 44; // headerRow 높이
const ROW_H = 58; // bodyRow 높이 (styles.bodyRow height랑 맞춰야 함)

export default function TeamStandingsTab({ teamId, leagueId }: Props) {
  const { t } = useTranslation();
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [selectedLeague, setSelectedLeague] = useState<League>();
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { errorComponent } = useError();

  const verticalRef = useRef<ScrollView | null>(null);
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

  const { data: leaguesData } = useQuery<any>({
    queryKey: ["team-allleagues", teamId],
    queryFn: () => api.get(ENDPOINTS.teamLeagues(Number(teamId))),
    staleTime: 1000 * 60 * 30,
  });

  const leaguesList: League[] = useMemo(
    () =>
      leaguesData?.map((t: Team) => {
        return { name: t.name, id: t.apiFootballId };
      }) ?? [],
    [leaguesData],
  );

  useEffect(() => {
    if (leaguesList.length && !selectedLeague?.id) {
      setSelectedLeague({
        name: leaguesList?.[0].name ?? leaguesList[0].name,
        id: leaguesList?.[0].id ?? leaguesList[0].id,
      });
    }
  }, [leaguesList, selectedLeague?.id]);

  const { data: standingsData, isError } = useQuery<any>({
    queryKey: [
      "team-allleague-standings",
      leagueId,
      selectedSeason,
      { ...selectedLeague },
    ],
    queryFn: () =>
      api.get(
        ENDPOINTS.leagueStandingsAndSeason(
          Number(selectedLeague?.id),
          Number(selectedSeason),
        ),
      ),
    staleTime: 1000 * 60 * 30,
    enabled: !!selectedLeague?.id,
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
      goalsDiff: e.goalsDiff ?? e.all?.goalsDiff ?? e.goalsDiff,
      form: e.form,
    }));
  }, [standingsData]);

  const myEntry = useMemo(
    () => standings.find((s) => String(s.team.id) === String(teamId)),
    [standings, teamId],
  );
  const myRowKey = myEntry ? `${myEntry.rank}-${myEntry.team.id}` : null;

  useEffect(() => {
    if (!myEntry) return;
    const index = Math.max(0, myEntry.rank - 1);
    const y = TOP_UI_H + HEADER_H + index * ROW_H;
    requestAnimationFrame(() => {
      verticalRef.current?.scrollTo({ y, animated: true });
    });
  }, [myEntry]);

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

  if (isError) {
    return errorComponent(isError, {
      icon: "podium-outline",
      title: t("standings.notFound"),
      subtitle: t("standings.notFoundSub"),
    });
  }

  return (
    <ScrollView
      ref={verticalRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tableWrap}>
        <View style={{ flexDirection: "row", gap: 40, flex: 1 }}>
          <TouchableOpacity
            style={styles.seasonSelector}
            onPress={() => setShowLeaguePicker(true)}
          >
            <Text style={styles.seasonLabel}>{t("teamStandings.league")}</Text>
            <View style={styles.seasonValue}>
              <Text style={styles.seasonText} numberOfLines={1}>
                {selectedLeague?.name || t("teamStandings.select")}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.seasonSelector}
            onPress={() => setShowSeasonPicker(true)}
          >
            <Text style={styles.seasonLabel}>{t("teamStandings.season")}</Text>
            <View style={styles.seasonValue}>
              <Text style={styles.seasonText} numberOfLines={1}>
                {SEASONS.find((s) => s.value === selectedSeason)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tableBody}>
          <View style={styles.leftPane} {...panResponder.panHandlers}>
            <View style={styles.leftHeader}>
              <Text style={styles.hText}>#</Text>
              <Text style={[styles.hText, { marginLeft: 10 }]}>
                {t("teamStandings.club")}
              </Text>
            </View>

            {!standings || standings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t("teamStandings.noInfo")}
                </Text>
              </View>
            ) : (
              standings.map((entry) => {
                const rowKey = `${entry.rank}-${entry.team.id}`;
                const isMine = myRowKey === rowKey;
                return (
                  <TouchableOpacity
                    key={rowKey}
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
                    <View
                      style={[styles.leftCell, isMine && styles.rowHighlight]}
                    >
                      <Text
                        style={[styles.rank, isMine && styles.rankHighlight]}
                      >
                        {entry.rank}
                      </Text>
                      <Image
                        source={{ uri: entry.team.logo }}
                        style={styles.teamLogo}
                      />
                      <Text style={styles.teamName} numberOfLines={1}>
                        {entry.team.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

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
                  {t("teamStandings.played")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.win")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.draw")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.lose")}
                </Text>
                <Text style={[styles.hText, styles.colPts]}>
                  {t("teamStandings.points")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.goalsFor")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.goalsAgainst")}
                </Text>
                <Text style={[styles.hText, styles.col]}>
                  {t("teamStandings.goalsDiff")}
                </Text>
                <Text style={[styles.hText, styles.colForm]}>
                  {t("teamStandings.recentForm")}
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
                  const isMine = myRowKey === rowKey;
                  return (
                    <TouchableOpacity
                      key={rowKey}
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
                      <View
                        style={[styles.rightRow, isMine && styles.rowHighlight]}
                      >
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

      {/* 시즌 선택 모달 */}
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

      {/* 리그 선택 모달 */}
      <Modal
        visible={showLeaguePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaguePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLeaguePicker(false)}
        >
          <View style={styles.modalContent}>
            {leaguesList.map((league: League) => (
              <TouchableOpacity
                key={league.id}
                style={[
                  styles.seasonOption,

                  selectedLeague?.name === league.name &&
                    styles.seasonOptionActive,
                ]}
                onPress={() => {
                  setSelectedLeague(league);

                  setShowLeaguePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.seasonOptionText,

                    selectedLeague?.name === league.name &&
                      styles.seasonOptionTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {league.name}
                </Text>

                {selectedLeague?.name === league.name && (
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
    container: { flex: 1, backgroundColor: "white" },

    seasonSelector: {
      flex: 0.5,
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
      overflow: "hidden",
      flex: 1,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      marginTop: 150,
      width: 400,
    },

    emptyText: { fontSize: 14, color: Colors.textSecondary },

    tableWrap: { backgroundColor: Colors.surface },

    // ✅ 표 레이아웃 (추가)
    tableBody: {
      flexDirection: "row",
      alignItems: "flex-start",
      position: "relative",
      backgroundColor: Colors.surface,
    },

    // ✅ 왼쪽 고정 패널 (추가)
    leftPane: {
      width: LEFT_W,
      backgroundColor: Colors.surface,
    },

    leftHeader: {
      height: HEADER_H,
      width: LEFT_W,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    rightHeaderRow: {
      height: HEADER_H,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingRight: 14,
      backgroundColor: Colors.background,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    bodyRow: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    // ✅ 내 팀 하이라이트
    rowHighlight: { backgroundColor: Colors.background },

    leftCell: {
      height: ROW_H,
      width: LEFT_W,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },

    rightRow: {
      height: ROW_H,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },

    // ✅ 가운데 세로 줄 (추가)
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
    rankHighlight: {
      color: Colors.primary,
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
    seasonOptionActive: {
      backgroundColor: Colors.background,
    },
    seasonOptionText: {
      fontSize: 15,
      color: Colors.text,
      flex: 1,
      paddingRight: 10,
    },
    seasonOptionTextActive: {
      fontWeight: "700",
      color: Colors.primary,
    },
  });
