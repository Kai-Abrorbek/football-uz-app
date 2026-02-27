import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useColors } from "../../hooks/useColors";
import { ENDPOINTS } from "../../constants/api";
import api from "../../services/api";

interface Props {
  visible: boolean;
  teamId: number;
  onClose: () => void;
}

interface TeamMatchesResponse {
  matches: Match[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

// 라운드 문자열에서 섹션 타이틀 추출
const getSectionTitle = (match: Match) => {
  const leagueName = match.league?.name ?? "";
  const round = match.round ?? "";
  return `${leagueName} · ${round}`;
};

export default function AllMatchesModal({ visible, teamId, onClose }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadingDirection, setLoadingDirection] = useState<
    "up" | "down" | null
  >(null);

  const nextCursorRef = useRef<string | null>(null);
  const prevCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isInitialized = useRef(false);
  const isFetchingRef = useRef(false);
  const hasFetchedTopRef = useRef(false);

  const Colors = useColors();
  const styles = getStyles(Colors);

  const fetchMatches = useCallback(
    async (
      cursor?: string,
      direction?: "prev" | "next",
    ): Promise<TeamMatchesResponse | null> => {
      try {
        const params = new URLSearchParams();
        params.append("teamId", String(teamId));
        params.append("limit", "15");
        if (cursor) params.append("cursor", cursor);
        if (direction) params.append("direction", direction);
        const url = `${ENDPOINTS.teamMatchDetail(teamId)}?${params.toString()}`;
        console.log("fetchMatches URL:", url); // ✅ 추가
        const res = await api.get(url);
        return res as unknown as TeamMatchesResponse;
      } catch (e) {
        console.error("fetchMatches error", e);
        return null;
      }
    },
    [teamId],
  );

  // 초기화
  useEffect(() => {
    if (!visible || isInitialized.current) return;

    const init = async () => {
      setIsInitialLoading(true);
      const today = new Date().toISOString();
      // const res = await fetchMatches(today, "next"); // ✅ 오늘 이후 경기부터
      const res = await fetchMatches(); // cursor 없이 → 최신 15개
      if (!res) {
        setIsInitialLoading(false);
        return;
      }

      setMatches(res.matches);
      nextCursorRef.current = res.nextCursor;
      prevCursorRef.current = res.prevCursor;
      hasMoreRef.current = res.hasMore;

      isInitialized.current = true;
      setIsInitialLoading(false);
    };

    init();
  }, [visible, fetchMatches]);

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!visible) {
      setMatches([]);
      setIsInitialLoading(false);
      setLoadingDirection(null);
      nextCursorRef.current = null;
      prevCursorRef.current = null;
      hasMoreRef.current = true;
      isInitialized.current = false;
      isFetchingRef.current = false;
      hasFetchedTopRef.current = false;
    }
  }, [visible]);

  // 다음 (아래 스크롤 - 오래된 경기)
  const loadNext = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    const cursor = nextCursorRef.current;
    if (!cursor) return;

    isFetchingRef.current = true;
    setLoadingDirection("down");

    try {
      const res = await fetchMatches(cursor, "next");
      if (!res?.matches?.length) return;

      nextCursorRef.current = res.nextCursor;
      hasMoreRef.current = res.hasMore;

      setMatches((prev) => {
        const prevIds = new Set(prev.map((m) => m._id));
        const incoming = res.matches.filter((m) => !prevIds.has(m._id));
        return [...prev, ...incoming];
      });
    } finally {
      isFetchingRef.current = false;
      setLoadingDirection(null);
    }
  }, [fetchMatches]);

  // 이전 (위 스크롤 - 더 최신 경기)
  const loadPrev = useCallback(async () => {
    if (isFetchingRef.current) return;
    const cursor = prevCursorRef.current;
    if (!cursor) return;

    isFetchingRef.current = true;
    setLoadingDirection("up");

    try {
      const res = await fetchMatches(cursor, "prev");
      if (!res?.matches?.length) return;

      prevCursorRef.current = res.prevCursor;

      setMatches((prev) => {
        const prevIds = new Set(prev.map((m) => m._id));
        const incoming = res.matches.filter((m) => !prevIds.has(m._id));
        return [...incoming, ...prev];
      });
    } finally {
      isFetchingRef.current = false;
      setLoadingDirection(null);
    }
  }, [fetchMatches]);

  // 맨 위 스크롤 감지
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const contentHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;

      // 아래 끝 감지 → loadNext
      if (
        contentHeight - offsetY - layoutHeight < 100 &&
        !isFetchingRef.current
      ) {
        loadNext();
      }

      // 위 끝 감지 → loadPrev
      if (offsetY > 80) hasFetchedTopRef.current = false;
      if (offsetY < 10 && !isFetchingRef.current && !hasFetchedTopRef.current) {
        hasFetchedTopRef.current = true;
        loadPrev();
      }
    },
    [loadNext, loadPrev],
  );

  const renderMatchCard = (match: Match) => {
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const homeGoals = match.goals.home ?? "-";
    const awayGoals = match.goals.away ?? "-";
    const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
    const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.modalMatchCard}
        activeOpacity={0.85}
        onPress={() => {
          onClose();
          router.push(`/match/${match._id}`);
        }}
      >
        {/* 리그 · 라운드 타이틀 */}
        <Text style={styles.matchLeagueTitle}>{getSectionTitle(match)}</Text>

        <View style={styles.modalMatchRow}>
          {/* 왼쪽: 두 팀 */}
          <View style={styles.modalLeft}>
            <View style={styles.modalTeamRow}>
              <Image
                source={match.homeTeam.logo}
                style={styles.modalLogo}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.modalTeamName,
                  (isFinished || isLive) && homeWon && styles.winnerText,
                ]}
                numberOfLines={1}
              >
                {match.homeTeam.name}
              </Text>
              {(isFinished || isLive) && (
                <Text
                  style={[styles.modalSmallScore, homeWon && styles.winnerText]}
                >
                  {homeGoals}
                </Text>
              )}
            </View>

            <View style={styles.modalTeamRow}>
              <Image
                source={match.awayTeam.logo}
                style={styles.modalLogo}
                contentFit="contain"
              />
              <Text
                style={[
                  styles.modalTeamName,
                  (isFinished || isLive) && awayWon && styles.winnerText,
                ]}
                numberOfLines={1}
              >
                {match.awayTeam.name}
              </Text>
              {(isFinished || isLive) && (
                <Text
                  style={[styles.modalSmallScore, awayWon && styles.winnerText]}
                >
                  {awayGoals}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.modalDivider} />

          {/* 오른쪽: 상태/날짜 */}
          <View style={styles.modalRight}>
            {isLive ? (
              <Text style={styles.liveText}>LIVE</Text>
            ) : isFinished ? (
              <>
                <Text style={styles.modalRightStatus}>풀타임</Text>
                <Text style={styles.modalRightDate}>
                  {new Date(match.date).toLocaleDateString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalRightDate}>
                  {new Date(match.date).toLocaleDateString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
                <Text style={styles.modalRightTime}>
                  {new Date(match.date).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isInitialLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>전체 경기</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loadingDirection === "up" && (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginVertical: 8 }}
            />
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={100}
          >
            {matches.map((match) => renderMatchCard(match))}

            {loadingDirection === "down" && (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: 16 }}
              />
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    matchLeagueTitle: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginBottom: 8,
      fontWeight: "500",
    },
    winnerText: {
      fontWeight: "700",
      color: Colors.text,
    },
    liveText: {
      fontSize: 12,
      color: "red",
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      flex: 1,
      marginTop: 120,
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
    },
    modalClose: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    modalMatchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      padding: 16,
    },
    modalMatchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    modalLeft: {
      flex: 1,
      gap: 10,
    },
    modalTeamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    modalLogo: {
      width: 24,
      height: 24,
    },
    modalTeamName: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
    },
    modalSmallScore: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      minWidth: 20,
      textAlign: "right",
    },
    modalDivider: {
      width: 1,
      height: 50,
      backgroundColor: Colors.border,
    },
    modalRight: {
      alignItems: "flex-end",
      gap: 4,
      minWidth: 70,
    },
    modalRightStatus: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    modalRightDate: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    modalRightTime: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.text,
    },
  });
