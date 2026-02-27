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
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LeagueMatchesResponse, Match } from "../../types";
import { useColors } from "../../hooks/useColors";
import { ENDPOINTS } from "../../constants/api";
import api from "../../services/api";
import { getColors } from "../../constants/colors";

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
          `${ENDPOINTS.leagueMatches}?leagueId=${leagueId}&season=${2024}&round=${round}${directionParam}`,
        );
        return res as LeagueMatchesResponse;
      } catch (e) {
        console.error("fetchMatches error", e);
        return null;
      }
    },
    [leagueId],
  );

  // 초기화
  useEffect(() => {
    if (!visible || isInitialized.current) return;

    const init = async () => {
      setIsInitialLoading(true);
      // direction 없이 → 서버가 현재 기준 앞뒤로 줌
      const res = await fetchMatches(0);
      if (!res) {
        setIsInitialLoading(false);
        return;
      }

      const { matches: initialMatches, roundsData: initialRoundsData } = res;

      setMatches(sortMatches(initialMatches ?? []));
      setRoundsData(initialRoundsData ?? []);

      minLoadedRound.current = Math.min(...(initialRoundsData ?? [0]));
      maxLoadedRound.current = Math.max(...(initialRoundsData ?? [0]));

      isInitialized.current = true;
      setIsInitialLoading(false);
    };

    init();
  }, [visible, fetchMatches]);

  // 모달 닫힐 때 초기화
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

  // 다음 라운드 로드 (아래 스크롤) - direction=next
  const loadNextRound = useCallback(async () => {
    if (isFetchingRef.current) return;
    const max = maxLoadedRound.current;
    if (max === null) return;

    isFetchingRef.current = true;
    setLoadingDirection("down");

    try {
      // max 기준으로 next → 서버가 max ~ max+3 범위로 줌
      const res = await fetchMatches(max, "next");
      if (!res?.matches?.length) return;

      const newMax = Math.max(...(res.roundsData ?? [max]));
      // 이전이랑 같으면 더 가져올 데이터 없음
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

  // 이전 라운드 로드 (위 스크롤) - direction=prev
  const loadPrevRound = useCallback(async () => {
    if (isFetchingRef.current) return;
    const min = minLoadedRound.current;
    if (min === null || min <= 1) return;

    isFetchingRef.current = true;
    setLoadingDirection("up");

    try {
      // min 기준으로 prev → 서버가 min-3 ~ min 범위로 줌
      const res = await fetchMatches(min, "prev");
      if (!res?.matches?.length) return;

      const newMin = Math.min(...(res.roundsData ?? [min]));
      // 이전이랑 같으면 더 가져올 데이터 없음
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

  // 맨 위 스크롤 감지
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;

      if (offsetY > 80) {
        // 아래로 내려가면 잠금 해제 → 다시 맨 위 올라올 때 fetch 가능
        hasFetchedTopRef.current = false;
      }

      if (offsetY < 10 && !isFetchingRef.current && !hasFetchedTopRef.current) {
        hasFetchedTopRef.current = true; // 즉시 잠금
        loadPrevRound();
      }
    },
    [loadPrevRound],
  );

  // 그룹핑
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

  const renderMatchCard = (match: Match) => {
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const isUpcoming = match.status.short === "NS";
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;
    const today = new Date();
    const matchDate = new Date(match.date);
    const isToday =
      isUpcoming &&
      matchDate.getFullYear() === today.getFullYear() &&
      matchDate.getMonth() === today.getMonth() &&
      matchDate.getDate() === today.getDate();

    const hasHighlight = isFinished && Math.random() > 0.5;

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.matchCard}
        onPress={() => {
          router.push(`/match/${match._id}`);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.matchBody}>
          <View style={styles.teamsContainer}>
            <View style={styles.teamRow}>
              <Image
                source={match.homeTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeTeam.name}
              </Text>
            </View>
            <View style={styles.teamRow}>
              <Image
                source={match.awayTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayTeam.name}
              </Text>
            </View>
          </View>

          <View style={styles.scoreSection}>
            {isFinished || isLive ? (
              <>
                <View style={styles.scoreRow}>
                  <Text style={[styles.score, homeWon && styles.scoreWinner]}>
                    {homeGoals}
                  </Text>
                  {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
                <View style={styles.scoreRow}>
                  <Text style={[styles.score, awayWon && styles.scoreWinner]}>
                    {awayGoals}
                  </Text>
                  {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
              </>
            ) : (
              <Text style={styles.scheduledText}>
                {t("leagueMatches.scheduled")}
              </Text>
            )}
          </View>

          <View style={styles.rightSection}>
            {hasHighlight ? (
              <View style={styles.highlightThumb}>
                <View style={styles.playIcon}>
                  <Ionicons name="play" size={16} color="#fff" />
                </View>
                <Text style={styles.highlightTime}>2:53</Text>
              </View>
            ) : (
              <View style={styles.dateBox}>
                <Text style={styles.statusText}>
                  {isFinished
                    ? t("leagueMatches.fulltime")
                    : isLive
                      ? "LIVE"
                      : isToday
                        ? t("leagueMatches.today")
                        : ""}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(match.date).toLocaleString(i18n.language, {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
            renderItem={({ item }) => renderMatchCard(item)}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.dateSection}>
                <Text style={styles.dateTitle}>{title}</Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            onEndReached={loadNextRound}
            onEndReachedThreshold={0.3}
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
    matchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    matchBody: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    teamsContainer: {
      flex: 1,
      gap: 8,
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    teamLogo: {
      width: 24,
      height: 24,
    },
    teamName: {
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
      color: Colors.text,
    },
    scoreSection: {
      width: 50,
      gap: 8,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 4,
    },
    score: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.textSecondary,
      minWidth: 28,
      textAlign: "right",
    },
    scoreWinner: {
      color: Colors.text,
    },
    winnerIcon: {
      fontSize: 10,
      color: Colors.text,
    },
    scheduledText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
      textAlign: "center",
    },
    rightSection: {
      width: 80,
      alignItems: "flex-end",
    },
    highlightThumb: {
      width: 80,
      height: 60,
      borderRadius: 8,
      backgroundColor: "#1a1a1a",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    playIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    highlightTime: {
      position: "absolute",
      bottom: 4,
      right: 4,
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    dateBox: {
      alignItems: "flex-end",
      gap: 2,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    timeText: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    dateSection: {
      marginTop: 16,
    },
    dateTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
  });
