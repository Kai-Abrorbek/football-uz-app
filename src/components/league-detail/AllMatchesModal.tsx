import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LeagueMatchesResponse, Match } from "../../types";
import { useColors } from "../../hooks/useColors";
import { ENDPOINTS } from "../../constants/api";
import api from "../../services/api";
import { getColors } from "../../constants/colors";
import { MATCH_SEASON, SEASON } from "../../constants/leauges";

interface Props {
  visible: boolean;
  leagueId: string;
  onClose: () => void;
}

const sortMatches = (arr: Match[]) =>
  [...arr].sort((a, b) => {
    const roundA = Number(a.round?.match(/(\d+)\s*$/)?.[1] ?? 0);
    const roundB = Number(b.round?.match(/(\d+)\s*$/)?.[1] ?? 0);
    if (roundA !== roundB) return roundA - roundB;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

function MatchCard({ match, onClose, styles, Colors, t, i18n }: any) {
  const router = useRouter();
  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const isUpcoming = match.status.short === "NS";
  const homeGoals = match.goals.home ?? 0;
  const awayGoals = match.goals.away ?? 0;
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;

  const today = new Date();
  const matchDate = new Date(match.date);
  const isToday =
    isUpcoming &&
    matchDate.getFullYear() === today.getFullYear() &&
    matchDate.getMonth() === today.getMonth() &&
    matchDate.getDate() === today.getDate();

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
      style={styles.matchCard}
      onPress={() => {
        router.push(`/match/${match._id}`);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.matchBody}>
        {/* 왼쪽: 팀 및 스코어 */}
        <View style={styles.leftSection}>
          <View style={styles.teamScoreRow}>
            <Image
              source={match.homeTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            <Text style={[styles.score, homeWon && styles.scoreWinner]}>
              {isFinished || isLive ? homeGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>

          <View style={[styles.teamScoreRow, { marginTop: 12 }]}>
            <Image
              source={match.awayTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            <Text style={[styles.score, awayWon && styles.scoreWinner]}>
              {isFinished || isLive ? awayGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.divider} />

        {/* 오른쪽: 상태, 날짜, 하이라이트 */}
        <View style={styles.rightSection}>
          <Text style={styles.statusText}>
            {isFinished
              ? t("leagueMatches.fulltime", "풀타임")
              : isLive
                ? "LIVE"
                : isToday
                  ? t("leagueMatches.today", "오늘")
                  : t("leagueMatches.scheduled", "예정")}
          </Text>
          <Text style={styles.dateText}>
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

export default function AllMatchesModal({ visible, leagueId, onClose }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [roundsData, setRoundsData] = useState<number[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadingDirection, setLoadingDirection] = useState<
    "up" | "down" | null
  >(null);

  const minLoadedRound = useRef<number | null>(null);
  const maxLoadedRound = useRef<number | null>(null);
  const isInitialized = useRef(false);
  const isFetchingRef = useRef(false);
  const hasFetchedTopRef = useRef(false);

  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const fetchMatches = useCallback(
    async (
      round: number,
      direction?: "prev" | "next",
    ): Promise<LeagueMatchesResponse | null> => {
      try {
        const directionParam = direction ? `&direction=${direction}` : "";
        const res: any = await api.get(
          `${ENDPOINTS.leagueMatches}?leagueId=${leagueId}&season=${leagueId !== String(369) || leagueId !== String(253) ? MATCH_SEASON : 2026}&round=${round}${directionParam}`,
        );
        return res as LeagueMatchesResponse;
      } catch (e) {
        console.error("fetchMatches error", e);
        return null;
      }
    },
    [leagueId],
  );

  useEffect(() => {
    if (!visible || isInitialized.current) return;
    const init = async () => {
      setIsInitialLoading(true);
      const res = await fetchMatches(0);
      if (!res) {
        setIsInitialLoading(false);
        return;
      }
      setMatches(sortMatches(res.matches ?? []));
      setRoundsData(res.roundsData ?? []);
      minLoadedRound.current = Math.min(...(res.roundsData ?? [0]));
      maxLoadedRound.current = Math.max(...(res.roundsData ?? [0]));
      isInitialized.current = true;
      setIsInitialLoading(false);
    };
    init();
  }, [visible, fetchMatches]);

  useEffect(() => {
    if (!visible) {
      setMatches([]);
      setRoundsData([]);
      setIsInitialLoading(false);
      setLoadingDirection(null);
      minLoadedRound.current = null;
      maxLoadedRound.current = null;
      isInitialized.current = false;
      isFetchingRef.current = false;
      hasFetchedTopRef.current = false;
    }
  }, [visible]);

  const loadNextRound = useCallback(async () => {
    if (isFetchingRef.current) return;
    const max = maxLoadedRound.current;
    if (max === null) return;
    isFetchingRef.current = true;
    setLoadingDirection("down");
    try {
      const res = await fetchMatches(max, "next");
      if (!res?.matches?.length) return;
      const newMax = Math.max(...(res.roundsData ?? [max]));
      if (newMax <= max) return;
      maxLoadedRound.current = newMax;
      setMatches((prev) => {
        const prevIds = new Set(prev.map((m) => m._id));
        const incoming = res.matches.filter((m) => !prevIds.has(m._id));
        return sortMatches([...prev, ...incoming]);
      });
      setRoundsData((prev) =>
        Array.from(new Set([...prev, ...(res.roundsData ?? [])])).sort(
          (a, b) => a - b,
        ),
      );
    } finally {
      isFetchingRef.current = false;
      setLoadingDirection(null);
    }
  }, [fetchMatches]);

  const loadPrevRound = useCallback(async () => {
    if (isFetchingRef.current) return;
    const min = minLoadedRound.current;
    if (min === null || min <= 1) return;
    isFetchingRef.current = true;
    setLoadingDirection("up");
    try {
      const res = await fetchMatches(min, "prev");
      if (!res?.matches?.length) return;
      const newMin = Math.min(...(res.roundsData ?? [min]));
      if (newMin >= min) return;
      minLoadedRound.current = newMin;
      setMatches((prev) => {
        const prevIds = new Set(prev.map((m) => m._id));
        const incoming = res.matches.filter((m) => !prevIds.has(m._id));
        return sortMatches([...incoming, ...prev]);
      });
      setRoundsData((prev) =>
        Array.from(new Set([...prev, ...(res.roundsData ?? [])])).sort(
          (a, b) => a - b,
        ),
      );
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
      const distanceFromBottom = contentHeight - offsetY - layoutHeight;

      if (
        distanceFromBottom > 50 &&
        distanceFromBottom < 150 &&
        !isFetchingRef.current
      ) {
        loadNextRound();
      }
      if (offsetY > 80) hasFetchedTopRef.current = false;
      if (offsetY < 10 && !isFetchingRef.current && !hasFetchedTopRef.current) {
        hasFetchedTopRef.current = true;
        loadPrevRound();
      }
    },
    [loadNextRound, loadPrevRound],
  );

  const sections = useMemo(() => {
    const grouped = matches.reduce((acc: Record<string, Match[]>, match) => {
      const matchRound = Number(match.round?.match(/(\d+)\s*$/)?.[1]);
      if (!roundsData.includes(matchRound)) return acc;
      const key = t("leagueMatches.matchday", {
        current: matchRound,
        total: 38,
      });
      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {});
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [matches, roundsData, t]);

  if (isInitialLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.background }}
        edges={["top"]}
      >
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
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
            <Text style={styles.modalTitle}>
              {t("allMatchesModal.title", {
                league: matches[0]?.league?.name ?? "",
              })}
            </Text>
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

          <SectionList<Match, any>
            sections={sections}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MatchCard
                match={item}
                onClose={onClose}
                styles={styles}
                Colors={Colors}
                t={t}
                i18n={i18n}
              />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.dateSection}>
                <Text style={styles.dateTitle}>{title}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={300}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            ListFooterComponent={
              loadingDirection === "down" ? (
                <ActivityIndicator
                  size="small"
                  color={Colors.primary}
                  style={{ marginVertical: 16 }}
                />
              ) : (
                <View style={{ height: 20 }} />
              )
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
    matchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    matchBody: {
      flexDirection: "row",
      alignItems: "center",
    },
    leftSection: {
      flex: 1,
    },
    teamScoreRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    teamLogo: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    teamName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: Colors.text,
    },
    score: {
      fontSize: 16,
      fontWeight: "400",
      color: Colors.textSecondary,
      textAlign: "right",
    },
    scoreWinner: {
      fontWeight: "600",
      color: Colors.text,
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
    divider: {
      width: 1,
      height: "100%",
      backgroundColor: Colors.border,
      marginHorizontal: 16,
    },
    rightSection: {
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
      marginBottom: 2,
    },
    dateText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    emptySpace: {
      width: 80,
      height: 45,
    },
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
    dateSection: { marginTop: 16 },
    dateTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
  });
