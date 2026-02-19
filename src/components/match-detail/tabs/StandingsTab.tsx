import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";

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

export default function StandingsTab({ match }: Props) {
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

  if (!standings || standings.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>순위 정보가 없습니다</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.tableWrap}>
        {/* 헤더 */}
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
              style={[styles.bodyRow, isHighlighted && styles.rowHighlight]}
            >
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
                  <Text style={[styles.bText, styles.col]}>{entry.played}</Text>
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
        })}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
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
});
