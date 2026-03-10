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
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import {
  ENDPOINTS,
  WORLDCUP_LEAGUE_ID,
  WORLDCUP_SEASON,
} from "../../constants/api";
import api from "../../services/api";
import { Match } from "../../types";

interface Props {
  visible: boolean;
  teamGroupMap?: Record<number, string>;
  onClose: () => void;
}

const LIMIT = 40;

function MatchCard({
  match,
  onClose,
  getGroupLabel,
  styles,
  Colors,
  t,
  i18n,
}: any) {
  const router = useRouter();
  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
  const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
  const groupLabel = getGroupLabel(match);

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
      {groupLabel ? <Text style={styles.groupLabel}>{groupLabel}</Text> : null}

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
              {isFinished || isLive ? match.goals.home : ""}
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
              {isFinished || isLive ? match.goals.away : ""}
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
              ? t("worldcup.fulltime", "풀타임")
              : isLive
                ? "LIVE"
                : t("worldcup.scheduled", "예정")}
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

export default function WorldcupMatchesModal({
  visible,
  teamGroupMap,
  onClose,
}: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const isInitialized = useRef(false);
  const isFetchingRef = useRef(false);

  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const fetchMatches = useCallback(async (pageNum: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (pageNum === 1) setIsInitialLoading(true);
    else setIsLoading(true);
    try {
      const res: any = await api.get(
        `${ENDPOINTS.matches}?leagueId=${WORLDCUP_LEAGUE_ID}&season=${WORLDCUP_SEASON}&page=${pageNum}&limit=${LIMIT}`,
      );
      const newMatches: Match[] = res ?? [];
      if (newMatches.length < LIMIT) setHasMore(false);
      setMatches((prev) =>
        pageNum === 1 ? newMatches : [...prev, ...newMatches],
      );
      setPage(pageNum + 1);
    } catch (e) {
      console.error(e);
    } finally {
      if (pageNum === 1) setIsInitialLoading(false);
      else setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!visible || isInitialized.current) return;
    isInitialized.current = true;
    fetchMatches(1);
  }, [visible, fetchMatches]);

  useEffect(() => {
    if (!visible) {
      setMatches([]);
      setPage(1);
      setHasMore(true);
      setIsLoading(false);
      setIsInitialLoading(false);
      isInitialized.current = false;
      isFetchingRef.current = false;
    }
  }, [visible]);

  const getGroupLabel = useCallback(
    (match: Match) => {
      if (!teamGroupMap) return "";
      const group =
        teamGroupMap[match.homeTeam.id] ??
        teamGroupMap[match.awayTeam.id] ??
        "";
      return group.replace("Group ", `${t("worldcup.group")} `);
    },
    [teamGroupMap, t],
  );

  const sections = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((match) => {
      const date = new Date(match.date).toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const isGroupStage = match.round?.includes("Group Stage");
      const roundLabel = isGroupStage
        ? t("worldcup.groupStage")
        : (match.round ?? "");
      const key = `${roundLabel} · ${date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const dateA =
          matches.find((m) => {
            const d = new Date(m.date).toLocaleDateString(i18n.language, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            });
            const isGroup = m.round?.includes("Group Stage");
            return (
              `${isGroup ? t("worldcup.groupStage") : m.round} · ${d}` === a
            );
          })?.date ?? "";
        const dateB =
          matches.find((m) => {
            const d = new Date(m.date).toLocaleDateString(i18n.language, {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            });
            const isGroup = m.round?.includes("Group Stage");
            return (
              `${isGroup ? t("worldcup.groupStage") : m.round} · ${d}` === b
            );
          })?.date ?? "";
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .map(([title, data]) => ({ title, data }));
  }, [matches, i18n.language, t]);

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
              {t("worldcup.matchesModal.title")}
            </Text>
            <TouchableOpacity style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {isInitialLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <SectionList<Match, any>
              sections={sections}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <MatchCard
                  match={item}
                  onClose={onClose}
                  getGroupLabel={getGroupLabel}
                  styles={styles}
                  Colors={Colors}
                  t={t}
                  i18n={i18n}
                />
              )}
              renderSectionHeader={({ section: { title } }) => (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{title}</Text>
                </View>
              )}
              onEndReached={() => {
                if (hasMore) fetchMatches(page);
              }}
              onEndReachedThreshold={0.3}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.primary}
                    style={{ marginVertical: 16 }}
                  />
                ) : (
                  <View style={{ height: 40 }} />
                )
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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
    modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
    modalClose: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
    matchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
      marginBottom: 12,
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
  });
