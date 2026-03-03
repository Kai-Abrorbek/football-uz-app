import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useState } from "react";
import { useColors } from "../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  match: Match;
}

export default function MatchHeader({ match }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );
  const isFinished = match.status.short === "FT";
  const isUpcoming = match.status.short === "NS";
  const isHalfTime = match.status.short === "HT";

  const getStatusText = () => {
    if (isHalfTime) return t("matchHeader.halfTime");
    if (isLive) {
      const elapsed = match.status.elapsed || 0;
      return `${elapsed}'`;
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

  return (
    <View style={styles.container}>
      {/* LIVE 표시 (왼쪽 상단) */}
      {isLive && !isHalfTime && (
        <View style={styles.liveIndicator}>
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      )}
      {/* 리그 + 팔로우 */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          {/* <Ionicons name="arrow-back" size={24} color={Colors.text} /> */}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.leagueBtn}
          onPress={() =>
            router.push({
              pathname: `/league/${match.league.id}`,
              params: {
                matchData: JSON.stringify(match),
              },
            })
          }
        >
          <Image
            source={match.league.logo}
            style={styles.leagueLogo}
            contentFit="contain"
          />
          <Text style={styles.leagueName}>{match.league.name}</Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followButtonActive,
          ]}
          onPress={() => setIsFollowing(!isFollowing)}
        >
          <Text
            style={[
              styles.followButtonText,
              isFollowing && styles.followButtonTextActive,
            ]}
          >
            {isFollowing ? t("matchHeader.following") : t("matchHeader.follow")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 스코어 영역 */}
      <View style={styles.scoreArea}>
        {/* 홈팀 */}
        <Pressable
          onPress={() => {
            router.push({
              pathname: `/team/${match.homeTeam.id}`,
              params: {
                team: JSON.stringify(match.homeTeam),
                leagueId: JSON.stringify(match.league.id),
              },
            });
          }}
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

        {/* 스코어/시간 */}
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
                style={[styles.statusBadge, isLive && styles.statusBadgeLive]}
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
          {match.league.round && (
            <Text style={styles.round}>{match.league.round}</Text>
          )}
        </View>

        {/* 원정팀 */}
        <Pressable
          onPress={() => {
            router.push({
              pathname: `/team/${match.awayTeam.id}`,
              params: {
                team: JSON.stringify(match.awayTeam),
                leagueId: JSON.stringify(match.league.id),
              },
            });
          }}
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

      {/* 이벤트 (골, 레드카드만) */}
      {match.events && match.events.length > 0 && (
        <View style={styles.eventsContainer}>
          {(() => {
            const allEvents = match.events.filter(
              (e) =>
                e.type === "Goal" ||
                (e.type === "Card" && e.detail === "Red Card"),
            );

            const goalEvents = allEvents.filter((e) => e.type === "Goal");
            const redCardEvents = allEvents.filter((e) => e.type === "Card");

            const homeGoals = goalEvents.filter(
              (e) => e.team?.id === match.homeTeam.id,
            );
            const awayGoals = goalEvents.filter(
              (e) => e.team?.id !== match.homeTeam.id,
            );
            const homeRedCards = redCardEvents.filter(
              (e) => e.team?.id === match.homeTeam.id,
            );
            const awayRedCards = redCardEvents.filter(
              (e) => e.team?.id !== match.homeTeam.id,
            );

            return (
              <View style={{ gap: 8 }}>
                {/* 골 섹션 */}
                {goalEvents.length > 0 && (
                  <View style={styles.eventsRow}>
                    <View style={styles.eventsColumn}>
                      {homeGoals.map((event, index) => (
                        <Text key={index} style={styles.eventText}>
                          {event.player?.name?.split(" ").slice(-1)[0]}{" "}
                          {event.time.elapsed}'
                        </Text>
                      ))}
                    </View>

                    <View style={styles.centerIcon}>
                      <Text style={styles.eventIconText}>⚽</Text>
                    </View>

                    <View
                      style={[styles.eventsColumn, { alignItems: "flex-end" }]}
                    >
                      {awayGoals.map((event, index) => (
                        <Text key={index} style={styles.eventText}>
                          {event.player?.name?.split(" ").slice(-1)[0]}{" "}
                          {event.time.elapsed}'
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* 레드카드 섹션 */}
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
                      style={[styles.eventsColumn, { alignItems: "flex-end" }]}
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
        </View>
      )}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      paddingBottom: 12,
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
    liveIndicatorText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#ffffff",
    },
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
    leagueBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    leagueLogo: {
      width: 30,
      height: 30,
      backgroundColor: Colors.background2,
      borderRadius: 50,
    },
    leagueName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    followBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
    },
    followText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#ffffff",
    },
    scoreArea: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      justifyContent: "space-between",
    },
    teamContainer: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    teamLogo: {
      width: 64,
      height: 64,
    },
    teamName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      textAlign: "center",
      overflow: "hidden",
      maxWidth: 90,
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      gap: 6,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    score: {
      fontSize: 36,
      fontWeight: "800",
      color: Colors.text,
    },
    scoreDash: {
      fontSize: 36,
      fontWeight: "300",
      color: Colors.textSecondary,
    },
    statusBadge: {
      backgroundColor: Colors.background,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    statusBadgeLive: {
      backgroundColor: "#fff0f0",
    },
    statusBadgeText: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: "600",
    },
    statusBadgeTextLive: {
      color: Colors.live,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    timeText: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.text,
    },
    round: {
      fontSize: 11,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    eventText: {
      fontSize: 13,
      color: Colors.text,
    },
    eventsContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      maxHeight: 120,
      overflow: "scroll",
    },
    eventsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    eventsColumn: {
      flex: 1,
      gap: 6,
    },
    centerIcon: {
      width: 40,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    eventIconText: {
      fontSize: 18,
      color: Colors.text,
    },
    eventPlayerName: {
      fontSize: 13,
      fontWeight: "500",
      color: Colors.text,
    },

    eventTime: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.primary,
    },
    followButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      backgroundColor: Colors.surface,
    },
    followButtonActive: {
      backgroundColor: Colors.primary,
    },
    followButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.primary,
    },
    followButtonTextActive: {
      color: "#ffffff",
    },
  });
