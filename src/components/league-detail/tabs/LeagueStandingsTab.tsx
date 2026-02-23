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
import { Colors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { router } from "expo-router";

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
  form?: string; // "WWDLW"
};

const LEFT_W = 190;
const COL_W = 32;
const FORM_W = 140;
const ROW_H = 44; // 원하는 높이로 조절
const HEADER_H = 40;

export default function LeagueStandingsTab({ leagueId }: Props) {
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);

  // ✅ 오른쪽 “단 하나”의 가로 스크롤
  const rightScrollRef = useRef<ScrollView>(null);

  // ✅ 현재 가로 스크롤 위치 추적 (왼쪽 드래그 -> scrollTo에 사용)
  const currentXRef = useRef(0);

  // ✅ 가운데 구분선: x>0이면 표시
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

  // ✅ 왼쪽 영역에서도 드래그하면 오른쪽 가로 스크롤을 움직이게
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        // 가로 제스처만 잡고(세로 스크롤 방해 최소화)
        const ax = Math.abs(g.dx);
        const ay = Math.abs(g.dy);
        return ax > 6 && ax > ay;
      },
      onPanResponderMove: (_, g) => {
        // 손가락이 오른쪽으로(dx>0) 가면, 스크롤은 왼쪽으로( x 감소 )
        const nextX = Math.max(0, currentXRef.current - g.dx);
        rightScrollRef.current?.scrollTo({ x: nextX, animated: false });

        // divider 상태도 같이 반영
        const nextDivider = nextX > 0;
        if (lastDividerRef.current !== nextDivider) {
          lastDividerRef.current = nextDivider;
          setShowMidDivider(nextDivider);
        }
      },
    }),
  ).current;

  // 순위표 조회
  const { data: standingsData } = useQuery<any>({
    queryKey: ["league-standings", leagueId, selectedSeason],
    queryFn: () =>
      api.get(
        ENDPOINTS.leagueStandingsAndSeason(
          Number(leagueId),
          Number(selectedSeason),
        ),
      ),
    staleTime: 1000 * 60 * 30,
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.tableWrap}>
        {/* 시즌 선택 */}
        <TouchableOpacity
          style={styles.seasonSelector}
          onPress={() => setShowSeasonPicker(true)}
        >
          <View>
            <Text style={styles.seasonLabel}>시즌</Text>
            <View style={styles.seasonValue}>
              <Text style={styles.seasonText}>
                {SEASONS.find((s) => s.value === selectedSeason)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ✅ 표 본체: 왼쪽(고정) + 오른쪽(가로 스크롤 1개) */}
        <View style={styles.tableBody}>
          {/* 왼쪽 고정 영역 (여기서 드래그해도 오른쪽이 움직이게) */}
          <View style={styles.leftPane} {...panResponder.panHandlers}>
            <View style={styles.leftHeader}>
              <Text style={styles.hText}>#</Text>
              <Text style={[styles.hText, { marginLeft: 10 }]}>클럽</Text>
            </View>

            {!standings || standings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>순위 정보가 없습니다</Text>
              </View>
            ) : (
              standings.map((entry) => {
                const rowKey = `${entry.rank}-${entry.team.id}`;
                return (
                  <TouchableOpacity
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
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* 오른쪽 스크롤 영역 (헤더 + 행들) - ✅ ScrollView는 딱 1개 */}
          <ScrollView
            ref={rightScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onTableRightScroll}
            scrollEventThrottle={16}
          >
            <View>
              {/* 오른쪽 헤더 */}
              <View style={styles.rightHeaderRow}>
                <Text style={[styles.hText, styles.col]}>경기</Text>
                <Text style={[styles.hText, styles.col]}>승</Text>
                <Text style={[styles.hText, styles.col]}>무</Text>
                <Text style={[styles.hText, styles.col]}>패</Text>
                <Text style={[styles.hText, styles.colPts]}>승점</Text>
                <Text style={[styles.hText, styles.col]}>득점</Text>
                <Text style={[styles.hText, styles.col]}>실점</Text>
                <Text style={[styles.hText, styles.col]}>득실</Text>
                <Text style={[styles.hText, styles.colForm]}>최근 5경기</Text>
              </View>

              {/* 오른쪽 바디 */}
              {!standings || standings.length === 0 ? null : (
                <View>
                  {standings.map((entry) => {
                    const formArr = (entry.form || "")
                      .split("")
                      .filter(Boolean)
                      .slice(-5);

                    const rowKey = `${entry.rank}-${entry.team.id}`;
                    return (
                      <TouchableOpacity
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

                          <Text
                            style={[styles.bText, styles.colPts, styles.pts]}
                          >
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
              )}
            </View>
          </ScrollView>

          {/* ✅ 가운데 세로 구분선(스크롤 시작 시 등장) */}
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

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },

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
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: HEADER_H,
  },

  rightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 14,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: HEADER_H,
  },

  leftCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: ROW_H,
  },

  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingRight: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    height: ROW_H,
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
    backgroundColor: "#f0f0f0",
  },
  seasonOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  seasonOptionTextActive: {
    fontWeight: "700",
    color: Colors.primary,
  },
});
