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
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";

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

export default function LeagueStandingsTab({ leagueId }: Props) {
  const [selectedSeason, setSelectedSeason] = useState("2024");
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);

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

  // ✅ 오른쪽(헤더 + 모든 행) 가로 스크롤 동기화
  const headerRightRef = useRef<ScrollView | null>(null);
  const rowRightRefs = useRef<Record<string, ScrollView | null>>({});
  const isSyncingRef = useRef(false);

  const syncAllRightScrolls = (x: number, sourceKey: "header" | string) => {
    isSyncingRef.current = true;

    // 헤더 동기화
    if (sourceKey !== "header") {
      headerRightRef.current?.scrollTo({ x, animated: false });
    }

    // 행 동기화
    Object.entries(rowRightRefs.current).forEach(([key, ref]) => {
      if (!ref) return;
      if (sourceKey === key) return;
      ref.scrollTo({ x, animated: false });
    });

    // 다음 프레임에서 해제 (루프 방지)
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
            return (
              <View key={rowKey} style={styles.bodyRow}>
                {/* 왼쪽 고정 */}
                <View style={styles.leftCell}>
                  <Text style={styles.rank}>{entry.rank}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowHighlight: { backgroundColor: "#e8f0fe" },

  leftCell: {
    width: LEFT_W,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
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
