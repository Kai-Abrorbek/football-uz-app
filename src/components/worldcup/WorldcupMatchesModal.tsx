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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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

  // 그룹 라벨
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

  // 섹션 그룹핑
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

  const renderMatchCard = useCallback(
    (match: Match) => {
      const isFinished = match.status.short === "FT";
      const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
      const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
      const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
      const groupLabel = getGroupLabel(match);

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
          {groupLabel ? (
            <Text style={styles.groupLabel}>{groupLabel}</Text>
          ) : null}

          <View style={styles.body}>
            <View style={styles.teams}>
              <View style={styles.teamRow}>
                <Image
                  source={match.homeTeam.logo}
                  style={styles.logo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.homeTeam.name}
                </Text>
                {(isFinished || isLive) && (
                  <Text style={[styles.score, homeWon && styles.winner]}>
                    {match.goals.home}
                  </Text>
                )}
              </View>
              <View style={styles.teamRow}>
                <Image
                  source={match.awayTeam.logo}
                  style={styles.logo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
                {(isFinished || isLive) && (
                  <Text style={[styles.score, awayWon && styles.winner]}>
                    {match.goals.away}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.right}>
              {isLive ? (
                <View style={styles.liveChip}>
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <View style={styles.dateBox}>
                  {isFinished && (
                    <Text style={styles.status}>{t("worldcup.fulltime")}</Text>
                  )}
                  <Text style={styles.time}>
                    {new Date(match.date).toLocaleDateString(i18n.language, {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </Text>
                  <Text style={styles.time}>
                    {new Date(match.date).toLocaleTimeString(i18n.language, {
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
    },
    [getGroupLabel, onClose, t, i18n.language, styles],
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
          {/* 헤더 */}
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
              renderItem={({ item }) => renderMatchCard(item)}
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
      padding: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    body: { flexDirection: "row", alignItems: "center", gap: 12 },
    teams: { flex: 1, gap: 8 },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 24, height: 24 },
    teamName: { flex: 1, fontSize: 13, fontWeight: "500", color: Colors.text },
    score: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.textSecondary,
      minWidth: 20,
      textAlign: "right",
    },
    winner: { color: Colors.text },
    right: { width: 70, alignItems: "flex-end" },
    liveChip: {
      backgroundColor: "#ef4444",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    liveText: { fontSize: 11, fontWeight: "700", color: "#fff" },
    dateBox: { alignItems: "flex-end", gap: 2 },
    status: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary },
    time: { fontSize: 11, color: Colors.textSecondary },
  });
