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
import { useTranslation } from "react-i18next";

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

  // 언어 설정에 따른 로케일 헬퍼
  const getLocale = () => {
    switch (i18n.language) {
      case "ko":
        return "ko-KR";
      case "ru":
        return "ru-RU";
      case "uz":
        return "uz-UZ";
      default:
        return "en-US";
    }
  };

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
      ) {
        loadNext();
      }
      if (offsetY > 80) hasFetchedTopRef.current = false;
      if (offsetY < 10 && !isFetchingRef.current && !hasFetchedTopRef.current) {
        hasFetchedTopRef.current = true;
        loadPrev();
      }
    },
    [loadNext, loadPrev],
  );

  const renderMatchCard = (match: any) => {
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const homeGoals = match.goals.home ?? "-";
    const awayGoals = match.goals.away ?? "-";
    const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
    const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);

    // 섹션 타이틀 (리그 정보)은 데이터가 서버에서 오는 것이므로 그대로 유지
    const sectionTitle = match.league
      ? `${match.league.name} · ${match.round || ""}`
      : "";

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

          <View style={styles.modalRight}>
            {isLive ? (
              <Text style={styles.liveText}>{t("allMatches.live")}</Text>
            ) : isFinished ? (
              <>
                <Text style={styles.modalRightStatus}>
                  {t("allMatches.fullTime")}
                </Text>
                <Text style={styles.modalRightDate}>
                  {new Date(match.date).toLocaleDateString(getLocale(), {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.modalRightDate}>
                  {new Date(match.date).toLocaleDateString(getLocale(), {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
                <Text style={styles.modalRightTime}>
                  {new Date(match.date).toLocaleTimeString(getLocale(), {
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
