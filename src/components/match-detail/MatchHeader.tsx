import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { Match } from "../../types";
import { useState } from "react";

interface Props {
  match: Match;
}

export default function MatchHeader({ match }: Props) {
  const [isFollowing, setIsFollowing] = useState(false);

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );
  const isFinished = match.status.short === "FT";
  const isUpcoming = match.status.short === "NS";

  const getStatusText = () => {
    if (isLive) return `${match.status.elapsed}'`;
    if (match.status.short === "HT") return "HT";
    if (isFinished) return "종료";
    const date = new Date(match.date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "오늘";
    if (date.toDateString() === tomorrow.toDateString()) return "내일";
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  const getTimeText = () => {
    if (isLive || isFinished) return null;
    const date = new Date(match.date);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      {/* 리그 + 팔로우 */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
            {isFollowing ? "팔로잉" : "팔로우"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 스코어 영역 */}
      <View style={styles.scoreArea}>
        {/* 홈팀 */}
        <View style={styles.teamContainer}>
          <Image
            source={match.homeTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text style={styles.teamName}>{match.homeTeam.name}</Text>
        </View>

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
        <View style={styles.teamContainer}>
          <Image
            source={match.awayTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text style={styles.teamName}>{match.awayTeam.name}</Text>
        </View>
      </View>

      {/* 이벤트 (골, 카드) */}
      {/* 이벤트 (골, 레드카드만) */}
      {match.events && match.events.length > 0 && (
        <View style={styles.eventsContainer}>
          {match.events
            .filter(
              (e) =>
                e.type === "Goal" ||
                (e.type === "Card" && e.detail === "Red Card"),
            )
            .map((event, index) => {
              const isHomeTeam = event.team?.id === match.homeTeam.id;

              return (
                <View key={index} style={styles.eventRow}>
                  {/* 홈팀 이벤트 (왼쪽) */}
                  {isHomeTeam ? (
                    <>
                      <View style={styles.eventLeft}>
                        <Text style={styles.eventPlayerName}>
                          {event.player?.name?.split(" ").slice(-1)[0]}
                        </Text>
                        <Text style={styles.eventTime}>
                          {event.time.elapsed}'
                        </Text>
                      </View>
                      <View style={styles.eventIcon}>
                        <Text style={styles.eventIconText}>
                          {event.type === "Goal" ? "⚽" : "🟥"}
                        </Text>
                      </View>
                      <View style={styles.eventRight} />
                    </>
                  ) : (
                    <>
                      <View style={styles.eventLeft} />
                      <View style={styles.eventIcon}>
                        <Text style={styles.eventIconText}>
                          {event.type === "Goal" ? "⚽" : "🟥"}
                        </Text>
                      </View>
                      <View style={styles.eventRight}>
                        <Text style={styles.eventTime}>
                          {event.time.elapsed}'
                        </Text>
                        <Text style={styles.eventPlayerName}>
                          {event.player?.name?.split(" ").slice(-1)[0]}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingBottom: 12,
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
    width: 20,
    height: 20,
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
    gap: 8,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  eventRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  eventIcon: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  eventIconText: {
    fontSize: 16,
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
