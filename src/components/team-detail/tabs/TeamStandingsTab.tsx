import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { StandingEntry, Team } from "../../../types";

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
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [selectedLeague, setSelectedLeague] = useState<League>();
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const [showLeaguePicker, setShowLeaguePicker] = useState(false);

  // ✅ 세로 스크롤 ref
  const verticalRef = useRef<ScrollView | null>(null);

  // 해당 되는 모든 리그 정보 조회
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
  }, [leaguesList, { ...selectedLeague }]);

  // 순위표 조회
  const { data: standingsData } = useQuery<any>({
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

  // ✅ 내 팀 엔트리 찾기
  const myEntry = useMemo(
    () => standings.find((s) => String(s.team.id) === String(teamId)),
    [standings, teamId],
  );
  const myRowKey = myEntry ? `${myEntry.rank}-${myEntry.team.id}` : null;

  // ✅ 내 팀 rank로 자동 스크롤 이동
  useEffect(() => {
    if (!myEntry) return;
    const index = Math.max(0, myEntry.rank - 1);
    const y = TOP_UI_H + HEADER_H + index * ROW_H;

    requestAnimationFrame(() => {
      verticalRef.current?.scrollTo({ y, animated: true });
    });
  }, [myEntry]);

  // ✅ 오른쪽(헤더 + 모든 행) 가로 스크롤 동기화
  const headerRightRef = useRef<ScrollView | null>(null);
  const rowRightRefs = useRef<Record<string, ScrollView | null>>({});
  const isSyncingRef = useRef(false);

  const syncAllRightScrolls = (x: number, sourceKey: "header" | string) => {
    isSyncingRef.current = true;

    if (sourceKey !== "header") {
      headerRightRef.current?.scrollTo({ x, animated: false });
    }

    Object.entries(rowRightRefs.current).forEach(([key, ref]) => {
      if (!ref) return;
      if (sourceKey === key) return;
      ref.scrollTo({ x, animated: false });
    });

    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  };

  const onRightScroll =
    (sourceKey: "header" | string) =>
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isSyncingRef.current) return;
      const x = e.nativeEvent.contentOffset.x;
      syncAllRightScrolls(x, sourceKey);
    };

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
    <ScrollView
      ref={verticalRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tableWrap}>
        <View style={{ flexDirection: "row", gap: 40, flex: 1 }}>
          {/* 리그 선택 */}
          <TouchableOpacity
            style={styles.seasonSelector}
            onPress={() => setShowLeaguePicker(true)}
          >
            <Text style={styles.seasonLabel}>리그</Text>
            <View style={styles.seasonValue}>
              <Text style={styles.seasonText} numberOfLines={1}>
                {selectedLeague?.name || "선택"}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </View>
          </TouchableOpacity>

          {/* 시즌 선택 */}
          <TouchableOpacity
            style={styles.seasonSelector}
            onPress={() => setShowSeasonPicker(true)}
          >
            <Text style={styles.seasonLabel}>시즌</Text>
            <View style={styles.seasonValue}>
              <Text style={styles.seasonText} numberOfLines={1}>
                {SEASONS.find((s) => s.value === selectedSeason)?.label}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRow}>
          {/* 왼쪽 고정 */}
          <View style={styles.leftHeader}>
            <Text style={styles.hText}>#</Text>
            <Text style={[styles.hText, { marginLeft: 10 }]}>클럽</Text>
          </View>

          {/* 오른쪽 스크롤(헤더) */}
          <ScrollView
            ref={(r) => {
              headerRightRef.current = r;
            }}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={onRightScroll("header")}
            scrollEventThrottle={16}
          >
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
          </ScrollView>
        </View>

        {/* 바디 */}
        {!standings || standings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>순위 정보가 없습니다</Text>
          </View>
        ) : (
          standings.map((entry) => {
            const formArr = (entry.form || "")
              .split("")
              .filter(Boolean)
              .slice(-5);

            const rowKey = `${entry.rank}-${entry.team.id}`;
            const isMine = myRowKey === rowKey;

            return (
              <View
                key={rowKey}
                style={[styles.bodyRow, isMine && styles.rowHighlight]}
              >
                {/* 왼쪽 고정 */}
                <View style={styles.leftCell}>
                  <Text style={[styles.rank, isMine && styles.rankHighlight]}>
                    {entry.rank}
                  </Text>
                  <Image
                    source={entry.team.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {entry.team.name}
                  </Text>
                </View>

                {/* 오른쪽 스크롤(행) */}
                <ScrollView
                  ref={(r) => {
                    rowRightRefs.current[rowKey] = r;
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  onScroll={onRightScroll(rowKey)}
                  scrollEventThrottle={16}
                >
                  <View style={styles.rightRow}>
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
                </ScrollView>
              </View>
            );
          })
        )}
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

const styles = StyleSheet.create({
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
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary },

  tableWrap: { backgroundColor: Colors.surface },

  headerRow: {
    height: HEADER_H,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  leftHeader: {
    width: LEFT_W,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  rightHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingRight: 14,
  },

  bodyRow: {
    height: ROW_H, // ✅ 스크롤 계산용
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // ✅ 내 팀 하이라이트
  rowHighlight: { backgroundColor: "#c2dbfb" },

  leftCell: {
    width: LEFT_W,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },

  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 14,
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
    backgroundColor: "#f0f0f0",
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
