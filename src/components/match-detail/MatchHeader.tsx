import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useEffect, useState } from "react";
import { useColors } from "../../hooks/useColors";
import { useTranslation } from "react-i18next";
import MatchAlertModal from "./MatchAlertModal";
import { useAuth } from "../../contexts/AuthContext";
import {
  getFollowing,
  toggleFollowLeague,
} from "../../constants/followService";

// ⭐️ 총합 점수 계산을 위해 필요한 라이브러리와 API 임포트 추가
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

interface Props {
  match: Match;
  scrollY: Animated.Value;
  headerHeight: number;
  onHeaderLayout: (height: number) => void;
  scrollDistance: number;
}

export default function MatchHeader({
  match,
  scrollY,
  headerHeight,
  onHeaderLayout,
  scrollDistance,
}: Props) {
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const [isCompactActive, setIsCompactActive] = useState(false);
  const { userData } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowing = async () => {
      if (!userData) return;
      const following = await getFollowing();
      setIsFollowing(following.leagues.includes(match.league.id));
    };
    checkFollowing();
  }, [match.league.id, userData]);

  const handleFollow = async () => {
    if (!userData) {
      router.push("/profile");
      return;
    }
    try {
      const result = await toggleFollowLeague(match.league.id);
      setIsFollowing(result.following);
    } catch (error) {
      console.error("팔로우 실패:", error);
    }
  };

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );
  const isFinished = match.status.short === "FT";
  const isUpcoming = match.status.short === "NS";
  const isHalfTime = match.status.short === "HT";

  // ⭐️ 추가: 1차전/2차전 합산 스코어 계산 로직
  const isKnockoutRound = ROUND_ORDER.includes(match.league.round);

  const { data: h2hMatches = [] } = useQuery<Match[]>({
    queryKey: [
      "knockout-h2h",
      match.league.id,
      match.homeTeam.id,
      match.awayTeam.id,
      match.league.round,
    ],
    queryFn: async () => {
      try {
        const res: any = await api.get(
          `${ENDPOINTS.matches}?leagueId=${match.league.id}&season=${match.league.season}&limit=999&allDates=true`,
        );
        // 방어 코드 적용
        const all = Array.isArray(res) ? res : res?.data || [];
        return all
          .filter(
            (m: Match) =>
              m.league.round === match.league.round &&
              ((m.homeTeam.id === match.homeTeam.id &&
                m.awayTeam.id === match.awayTeam.id) ||
                (m.homeTeam.id === match.awayTeam.id &&
                  m.awayTeam.id === match.homeTeam.id)),
          )
          .sort(
            (a: Match, b: Match) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
      } catch (e) {
        return [];
      }
    },
    enabled: isKnockoutRound,
    staleTime: 1000 * 60 * 30,
  });

  let showAggregate = false;
  let aggHome = match.goals.home ?? 0;
  let aggAway = match.goals.away ?? 0;

  if (isKnockoutRound && h2hMatches.length >= 2) {
    const firstLeg = h2hMatches[0];
    const secondLeg = h2hMatches[1];

    // 현재 경기가 2차전(두 번째 경기)일 때만 총합 표시
    if (
      match._id === secondLeg._id ||
      match.apiFootballId === secondLeg.apiFootballId
    ) {
      showAggregate = true;
      const firstLegHomeGoals = firstLeg.goals.home ?? 0;
      const firstLegAwayGoals = firstLeg.goals.away ?? 0;

      // 1차전 팀 진영(홈/어웨이)에 맞춰 점수 교차 병합
      if (firstLeg.homeTeam.id === match.homeTeam.id) {
        aggHome += firstLegHomeGoals;
        aggAway += firstLegAwayGoals;
      } else {
        aggHome += firstLegAwayGoals;
        aggAway += firstLegHomeGoals;
      }
    }
  }

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value > scrollDistance * 0.5) {
        setIsCompactActive(true);
      } else {
        setIsCompactActive(false);
      }
    });
    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, scrollDistance]);

  const getStatusText = () => {
    if (isHalfTime) return t("matchHeader.halfTime");
    if (isLive) {
      const elapsed = match.status.elapsed || 0;
      const extra = match.status.extra;
      return extra ? `${elapsed}+${extra}'` : `${elapsed}'`;
    }
    if (isFinished) return t("matchHeader.finished");
    const date = new Date(match.date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString())
      return t("matchHeader.today");
    if (date.toDateString() === tomorrow.toDateString())
      return t("matchHeader.tomorrow");
    return date.toLocaleDateString(i18n.language, {
      month: "long",
      day: "numeric",
    });
  };

  const getTimeText = () => {
    if (isHalfTime) return t("matchCard.halfTime");
    if (isLive) {
      const elapsed = match.status.elapsed || 0;
      const extra = (match.status as any).extra || 0;
      return extra > 0 ? `${elapsed}+${extra}'` : `${elapsed}'`;
    }
    if (isFinished) return t("matchCard.finished");
    const date = new Date(match.date);
    return date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const bigHeaderOpacity = scrollY.interpolate({
    inputRange: [0, scrollDistance * 0.8],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [scrollDistance * 0.8, scrollDistance],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const inverseTranslateY = scrollY.interpolate({
    inputRange: [0, scrollDistance],
    outputRange: [0, scrollDistance],
    extrapolate: "clamp",
  });

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => {
        if (headerHeight === 0) onHeaderLayout(e.nativeEvent.layout.height);
      }}
    >
      <Animated.View style={{ opacity: bigHeaderOpacity }}>
        <View style={styles.container}>
          {isLive && !isHalfTime && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveIndicatorText}>LIVE</Text>
            </View>
          )}

          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (router.canGoBack()) router.back();
                else router.replace("/");
              }}
            ></TouchableOpacity>

            <TouchableOpacity
              style={styles.leagueBtn}
              onPress={() => {
                router.push({
                  pathname: `/league/${match.league.id}`,
                  params: { matchData: JSON.stringify(match) },
                });
              }}
            >
              <Image
                source={match.league.logo}
                style={styles.leagueLogo}
                contentFit="contain"
              />
              <Text numberOfLines={1} style={styles.leagueName}>
                {match.league.name}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 10 }}>
              {!isFinished && (
                <TouchableOpacity
                  style={styles.alertBtn}
                  onPress={() => setAlertModalVisible(true)}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={22}
                    color={Colors.text}
                  />
                </TouchableOpacity>
              )}
              <MatchAlertModal
                visible={alertModalVisible}
                onClose={() => setAlertModalVisible(false)}
                matchId={match._id}
              />
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followButtonActive,
                ]}
                onPress={handleFollow}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followButtonTextActive,
                  ]}
                >
                  {isFollowing
                    ? t("matchHeader.following")
                    : t("matchHeader.follow")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.scoreArea}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/team/${match.homeTeam.id}`,
                  params: {
                    team: JSON.stringify(match.homeTeam),
                    leagueId: JSON.stringify(match.league.id),
                  },
                })
              }
            >
              <View style={styles.teamContainer}>
                <Image
                  source={match.homeTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.homeTeam.name}
                </Text>
              </View>
            </Pressable>

            <View style={styles.centerContainer}>
              {isUpcoming ? (
                <>
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                  <Text style={styles.timeText}>{getTimeText()}</Text>
                </>
              ) : (
                <>
                  <View style={styles.scoreRow}>
                    <Text style={styles.score}>{match.goals.home ?? 0}</Text>
                    <Text style={styles.scoreDash}> - </Text>
                    <Text style={styles.score}>{match.goals.away ?? 0}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isLive && styles.statusBadgeLive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isLive && styles.statusBadgeTextLive,
                      ]}
                    >
                      {getStatusText()}
                    </Text>
                  </View>
                </>
              )}
              {/* ⭐️ Round 텍스트 밑에 총합 점수 깔끔하게 추가 */}
              {(match.league.round || showAggregate) && (
                <View style={{ alignItems: "center" }}>
                  {match.league.round && (
                    <Text style={styles.round}>{match.league.round}</Text>
                  )}
                  {showAggregate && (
                    <Text style={styles.aggregateText}>
                      {t(`total`)} {aggHome} - {aggAway}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/team/${match.awayTeam.id}`,
                  params: {
                    team: JSON.stringify(match.awayTeam),
                    leagueId: JSON.stringify(match.league.id),
                  },
                })
              }
            >
              <View style={styles.teamContainer}>
                <Image
                  source={match.awayTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={styles.teamName} numberOfLines={1}>
                  {match.awayTeam.name}
                </Text>
              </View>
            </Pressable>
          </View>

          {match.events && match.events.length > 0 && (
            <ScrollView
              style={styles.eventsContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {(() => {
                const goalEvents = match.events.filter(
                  (e) => e.type === "Goal",
                );
                const redCardEvents = match.events.filter(
                  (e) => e.type === "Card" && e.detail === "Red Card",
                );

                const groupGoalsByPlayer = (events: any[]) => {
                  const map = new Map<
                    number,
                    { name: string; times: string[] }
                  >();
                  events.forEach((e) => {
                    const id = e.player?.id ?? Math.random();
                    const time = e.time.extra
                      ? `${e.time.elapsed}+${e.time.extra}'`
                      : `${e.time.elapsed}'`;
                    if (map.has(id)) {
                      map.get(id)!.times.push(time);
                    } else {
                      map.set(id, {
                        name: e.player?.name?.split(" ").slice(-1)[0] ?? "",
                        times: [time],
                      });
                    }
                  });
                  return Array.from(map.values());
                };

                const homeGoals = groupGoalsByPlayer(
                  goalEvents.filter((e) => e.team?.id === match.homeTeam.id),
                );
                const awayGoals = groupGoalsByPlayer(
                  goalEvents.filter((e) => e.team?.id !== match.homeTeam.id),
                );
                const homeRedCards = redCardEvents.filter(
                  (e) => e.team?.id === match.homeTeam.id,
                );
                const awayRedCards = redCardEvents.filter(
                  (e) => e.team?.id !== match.homeTeam.id,
                );

                return (
                  <View style={{ gap: 8 }}>
                    {goalEvents.length > 0 && (
                      <View style={styles.eventsRow}>
                        <View style={styles.eventsColumn}>
                          {homeGoals.map((g, index) => (
                            <Text key={index} style={styles.eventText}>
                              {g.name} {g.times.join(", ")}
                            </Text>
                          ))}
                        </View>
                        <View style={styles.centerIcon}>
                          <Text style={styles.eventIconText}>⚽</Text>
                        </View>
                        <View
                          style={[
                            styles.eventsColumn,
                            { alignItems: "flex-end" },
                          ]}
                        >
                          {awayGoals.map((g, index) => (
                            <Text key={index} style={styles.eventText}>
                              {g.times.join(", ")} {g.name}
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}
                    {redCardEvents.length > 0 && (
                      <View style={styles.eventsRow}>
                        <View style={styles.eventsColumn}>
                          {homeRedCards.map((event, index) => (
                            <Text key={index} style={styles.eventText}>
                              {event.player?.name?.split(" ").slice(-1)[0]}{" "}
                              {event.time.elapsed}'
                            </Text>
                          ))}
                        </View>
                        <View style={styles.centerIcon}>
                          <View
                            style={{
                              width: 12,
                              height: 16,
                              backgroundColor: "red",
                              borderRadius: 2,
                              transform: [{ rotate: "15deg" }],
                            }}
                          />
                        </View>
                        <View
                          style={[
                            styles.eventsColumn,
                            { alignItems: "flex-end" },
                          ]}
                        >
                          {awayRedCards.map((event, index) => (
                            <Text key={index} style={styles.eventText}>
                              {event.player?.name?.split(" ").slice(-1)[0]}{" "}
                              {event.time.elapsed}'
                            </Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          )}
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={isCompactActive ? "auto" : "none"}
        style={[
          styles.compactHeader,
          {
            opacity: compactHeaderOpacity,
            transform: [{ translateY: inverseTranslateY }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        ></TouchableOpacity>

        <View style={styles.compactCenter}>
          <Image
            source={match.homeTeam.logo}
            style={styles.compactLogo}
            contentFit="contain"
          />
          <Text style={styles.compactScore}>{match.goals.home ?? ""}</Text>
          <View style={styles.compactStatusBadge}>
            <Text
              style={[
                styles.compactStatusText,
                isLive && { color: Colors.live },
              ]}
            >
              {isFinished
                ? "FT"
                : isHalfTime
                  ? "HT"
                  : isLive
                    ? match.status.extra
                      ? `${match.status.elapsed}+${match.status.extra}'`
                      : `${match.status.elapsed}'`
                    : getTimeText()}
            </Text>
            {!isLive && !isFinished && !isHalfTime && (
              <Text style={styles.compactDateText}>
                {new Date(match.date).toLocaleDateString(i18n.language, {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                })}
              </Text>
            )}
          </View>
          <Text style={styles.compactScore}>{match.goals.away ?? ""}</Text>
          <Image
            source={match.awayTeam.logo}
            style={styles.compactLogo}
            contentFit="contain"
          />
        </View>

        <TouchableOpacity
          style={styles.alertBtn}
          onPress={() => setAlertModalVisible(true)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={Colors.text} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: Colors.surface2,
      paddingTop: 30,
    },
    container: {
      backgroundColor: Colors.surface2,
      paddingBottom: 12,
    },
    compactHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface2,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border2,
    },
    compactCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
    },
    compactLogo: { width: 45, height: 45 },
    compactScore: { fontSize: 20, fontWeight: "800", color: Colors.text },
    compactStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      backgroundColor: Colors.background,
      borderRadius: 8,
    },
    compactStatusText: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.textSecondary,
    },
    compactDateText: {
      fontSize: 10,
      color: Colors.textSecondary,
      textAlign: "center",
      marginTop: 2,
    },
    liveIndicator: {
      position: "absolute",
      top: 55,
      left: 180,
      backgroundColor: Colors.live,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      zIndex: 10,
    },
    liveIndicatorText: { fontSize: 11, fontWeight: "800", color: "#ffffff" },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    leagueBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    leagueLogo: {
      width: 30,
      height: 30,
      backgroundColor: Colors.logoBox,
      borderRadius: 50,
    },
    leagueName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      overflow: "hidden",
      width: 130,
    },
    scoreArea: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: "space-between",
    },
    teamContainer: { flex: 1, alignItems: "center", gap: 8 },
    teamLogo: { width: 64, height: 64 },
    teamName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      textAlign: "center",
      maxWidth: 90,
    },
    centerContainer: { flex: 1, alignItems: "center", gap: 6 },
    scoreRow: { flexDirection: "row", alignItems: "center" },
    score: { fontSize: 36, fontWeight: "800", color: Colors.text },
    scoreDash: { fontSize: 36, fontWeight: "300", color: Colors.textSecondary },
    statusBadge: {
      backgroundColor: Colors.background,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    statusBadgeLive: { backgroundColor: "#fff0f0" },
    statusBadgeText: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: "600",
    },
    statusBadgeTextLive: { color: Colors.live },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    timeText: { fontSize: 24, fontWeight: "700", color: Colors.text },
    round: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

    // ⭐️ 새로 추가된 총합 스코어 스타일
    aggregateText: {
      fontSize: 14,
      color: Colors.primary,
      fontWeight: "700",
      marginTop: 2,
      position: "absolute",
      bottom: 90,
    },

    eventsContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      maxHeight: 110,
    },
    eventsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    eventsColumn: { flex: 1, gap: 6 },
    centerIcon: {
      width: 40,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    eventIconText: { fontSize: 18, color: Colors.text },
    eventText: { fontSize: 13, color: Colors.text },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      backgroundColor: Colors.surface,
    },
    followButtonActive: { backgroundColor: Colors.primary },
    followButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.primary,
    },
    followButtonTextActive: { color: "#ffffff" },
    alertBtn: { padding: 6 },
  });
