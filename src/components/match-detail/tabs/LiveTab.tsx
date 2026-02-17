import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../../constants/colors";
import { Match, MatchEvent } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";

interface Props {
  match: Match;
}

export default function LiveTab({ match }: Props) {
  const {
    data: liveMatch,
    refetch,
    isLoading,
  } = useQuery<Match>({
    queryKey: ["match-live", match._id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(match._id)),
    refetchInterval: 1000 * 30, // 30초마다 갱신
    staleTime: 0,
  });

  const currentMatch = liveMatch || match;
  const events = currentMatch.events || [];

  const getEventIcon = (event: MatchEvent) => {
    if (event.type === "Goal") {
      if (event.detail === "Own Goal") return "🔴⚽";
      if (event.detail === "Penalty") return "⚽(P)";
      return "⚽";
    }
    if (event.type === "Card") {
      if (event.detail === "Yellow Card") return "🟨";
      if (event.detail === "Red Card") return "🟥";
      if (event.detail === "Yellow Red Card") return "🟨🟥";
    }
    if (event.type === "subst") return "🔄";
    return "•";
  };

  const isHomeEvent = (event: MatchEvent) =>
    event.team?.id === match.homeTeam.id;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      }
    >
      {/* 라이브 스코어 */}
      <View style={styles.scoreContainer}>
        <View style={styles.teamScore}>
          <Image
            source={currentMatch.homeTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text style={styles.score}>{currentMatch.goals.home ?? 0}</Text>
        </View>

        <View style={styles.centerInfo}>
          {["1H", "HT", "2H", "ET"].includes(currentMatch.status.short) ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {currentMatch.status.short === "HT"
                  ? "HT"
                  : `${currentMatch.status.elapsed}'`}
              </Text>
            </View>
          ) : (
            <Text style={styles.statusText}>
              {currentMatch.status.short === "FT"
                ? "종료"
                : currentMatch.status.short}
            </Text>
          )}
        </View>

        <View style={[styles.teamScore, { flexDirection: "row-reverse" }]}>
          <Image
            source={currentMatch.awayTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text style={styles.score}>{currentMatch.goals.away ?? 0}</Text>
        </View>
      </View>

      {/* 이벤트 타임라인 */}
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>아직 이벤트가 없습니다</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>경기 이벤트</Text>

          {[...events].reverse().map((event, index) => {
            const isHome = isHomeEvent(event);

            return (
              <View
                key={index}
                style={[
                  styles.eventRow,
                  isHome ? styles.eventRowHome : styles.eventRowAway,
                ]}
              >
                {isHome ? (
                  <>
                    {/* 홈팀 이벤트 (왼쪽) */}
                    <View style={styles.eventContent}>
                      <Text style={styles.eventIcon}>
                        {getEventIcon(event)}
                      </Text>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventPlayer}>
                          {event.player?.name}
                        </Text>
                        {event.assist && (
                          <Text style={styles.eventAssist}>
                            어시스트: {event.assist.name}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.eventTimeContainer}>
                      <Text style={styles.eventTime}>
                        {event.time.elapsed}'
                        {event.time.extra ? `+${event.time.extra}` : ""}
                      </Text>
                    </View>
                    <View style={styles.eventSpacer} />
                  </>
                ) : (
                  <>
                    {/* 원정팀 이벤트 (오른쪽) */}
                    <View style={styles.eventSpacer} />
                    <View style={styles.eventTimeContainer}>
                      <Text style={styles.eventTime}>
                        {event.time.elapsed}'
                        {event.time.extra ? `+${event.time.extra}` : ""}
                      </Text>
                    </View>
                    <View
                      style={[styles.eventContent, { alignItems: "flex-end" }]}
                    >
                      <Text style={styles.eventIcon}>
                        {getEventIcon(event)}
                      </Text>
                      <View
                        style={[styles.eventInfo, { alignItems: "flex-end" }]}
                      >
                        <Text style={styles.eventPlayer}>
                          {event.player?.name}
                        </Text>
                        {event.assist && (
                          <Text style={styles.eventAssist}>
                            어시스트: {event.assist.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  teamScore: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamLogo: {
    width: 36,
    height: 36,
  },
  score: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.text,
  },
  centerInfo: {
    alignItems: "center",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live,
  },
  liveText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.live,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeline: {
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  eventRowHome: {},
  eventRowAway: {},
  eventContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventSpacer: {
    flex: 1,
  },
  eventTimeContainer: {
    width: 40,
    alignItems: "center",
  },
  eventTime: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
  eventIcon: {
    fontSize: 16,
  },
  eventInfo: {
    flex: 1,
    gap: 2,
  },
  eventPlayer: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  eventAssist: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
