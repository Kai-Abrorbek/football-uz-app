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
import { getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useColors } from "../../hooks/useColors";
import { ENDPOINTS } from "../../constants/api";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MATCH_SEASON } from "../../constants/leauges";

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

// 카드 컴포넌트 분리
function MatchCard({ match, onClose, styles, Colors, t, i18n }: any) {
  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeGoals = match.goals.home ?? "-";
  const awayGoals = match.goals.away ?? "-";
  const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
  const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
  const sectionTitle = match.league
    ? `${match.league.name} · ${match.round || ""}`
    : "";

  const { data: highlight } = useQuery<any>({
    queryKey: ["highlight", match._id],
    queryFn: () =>
      api.get(
        ENDPOINTS.matchHighlight(
          match._id,
          match.homeTeam.name,
          match.awayTeam.name,
          match.date,
        ),
      ),
    enabled: isFinished,
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

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
      <Text style={styles.matchLeagueTitle}>{sectionTitle}</Text>

      <View style={styles.modalMatchRow}>
        {/* 왼쪽: 팀 및 스코어 */}
        <View style={styles.modalLeft}>
          <View style={styles.modalTeamRow}>
            <Image
              source={{ uri: match.homeTeam.logo }}
              style={styles.modalLogo}
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
            <Text
              style={[styles.modalSmallScore, homeWon && styles.winnerText]}
            >
              {isFinished || isLive ? homeGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>

          <View style={[styles.modalTeamRow, { marginTop: 12 }]}>
            <Image
              source={{ uri: match.awayTeam.logo }}
              style={styles.modalLogo}
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
            <Text
              style={[styles.modalSmallScore, awayWon && styles.winnerText]}
            >
              {isFinished || isLive ? awayGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.modalDivider} />

        {/* 오른쪽: 하이라이트 or 날짜/상태 */}
        <View style={styles.modalRight}>
          <Text style={styles.modalRightStatus}>
            {isFinished
              ? t("allMatches.fullTime", "풀타임")
              : isLive
                ? t("allMatches.live", "라이브")
                : t("allMatches.scheduled", "예정")}
          </Text>
          <Text style={styles.modalRightDate}>
            {new Date(match.date).getMonth() + 1}.{" "}
            {new Date(match.date).getDate()}.
          </Text>

          {highlight?.videoId ? (
            <TouchableOpacity
              style={styles.highlightThumb}
              onPress={(e) => {
                e.stopPropagation();
                onClose();
                router.push({
                  pathname: `/highlight/${match._id}`,
                  params: { videoId: highlight.videoId },
                });
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: highlight.thumbnail }}
                style={styles.highlightThumbImg}
                contentFit="cover"
              />
              <View style={styles.highlightOverlay}>
                <Ionicons name="play" size={10} color="#fff" />
                <Text style={styles.highlightTime}>{highlight.duration}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AllMatchesModal({ visible, teamId, onClose }: Props) {
  const { t, i18n } = useTranslation();
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
        params.append("season", MATCH_SEASON.toString());
        if (cursor) params.append("cursor", cursor);
        if (direction) params.append("direction", direction);
        const url = `${ENDPOINTS.teamMatchDetail(teamId)}?${params.toString()}`;
        const res = await api.get(url);
        return res as unknown as TeamMatchesResponse;
      } catch (e) {
        console.error("fetchMatches error", e);
        return null;
      }
    },
    [teamId],
  );

  useEffect(() => {
    if (!visible || isInitialized.current) return;
    const init = async () => {
      setIsInitialLoading(true);
      const res = await fetchMatches();
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
        const incoming = res.matches.filter((m: any) => !prevIds.has(m._id));
        return [...prev, ...incoming];
      });
    } finally {
      isFetchingRef.current = false;
      setLoadingDirection(null);
    }
  }, [fetchMatches]);

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
        const incoming = res.matches.filter((m: any) => !prevIds.has(m._id));
        return [...incoming, ...prev];
      });
    } finally {
      isFetchingRef.current = false;
      setLoadingDirection(null);
    }
  }, [fetchMatches]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      const contentHeight = event.nativeEvent.contentSize.height;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      if (
        contentHeight - offsetY - layoutHeight < 100 &&
        !isFetchingRef.current
      )
        loadNext();
      if (offsetY > 80) hasFetchedTopRef.current = false;
      if (offsetY < 10 && !isFetchingRef.current && !hasFetchedTopRef.current) {
        hasFetchedTopRef.current = true;
        loadPrev();
      }
    },
    [loadNext, loadPrev],
  );

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
            <Text style={styles.modalTitle}>{t("allMatches.title")}</Text>
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

          {isInitialLoading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={100}
            >
              {matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onClose={onClose}
                  styles={styles}
                  Colors={Colors}
                  t={t}
                  i18n={i18n}
                />
              ))}
              {loadingDirection === "down" && (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginVertical: 16 }}
                />
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
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
      marginBottom: 12,
      fontWeight: "500",
    },
    winnerText: { fontWeight: "700", color: Colors.text },
    liveText: { fontSize: 12, color: "red", fontWeight: "700" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
      marginBottom: 20,
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
    modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    modalClose: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    modalMatchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    modalMatchRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    modalLeft: {
      flex: 1,
    },
    modalTeamRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    modalLogo: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    modalTeamName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: Colors.text,
    },
    modalSmallScore: {
      fontSize: 16,
      fontWeight: "400",
      color: Colors.textSecondary,
      textAlign: "right",
    },
    winnerIconContainer: {
      width: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    winnerIcon: {
      fontSize: 10,
      color: Colors.text,
      marginLeft: 4,
    },
    modalDivider: {
      width: 1,
      height: "100%",
      backgroundColor: Colors.border,
      marginHorizontal: 16,
    },
    modalRight: {
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    modalRightStatus: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
      marginBottom: 2,
    },
    modalRightDate: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    modalRightTime: { fontSize: 12, fontWeight: "600", color: Colors.text },
    emptySpace: {
      width: 80,
      height: 45,
    },

    // 하이라이트
    highlightThumb: {
      width: 80,
      height: 45,
      borderRadius: 6,
      backgroundColor: "#1a1a1a",
      overflow: "hidden",
    },
    highlightThumbImg: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    highlightOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderTopLeftRadius: 4,
    },
    highlightTime: {
      fontSize: 10,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 2,
    },
  });
