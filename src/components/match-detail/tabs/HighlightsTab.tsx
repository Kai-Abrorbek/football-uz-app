import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../../constants/colors";
import { Match, MatchEvent, Player } from "../../../types";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  match: Match;
}

export default function HighlightsTab({ match }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );

  const {
    data: liveMatch,
    refetch,
    isLoading,
  } = useQuery<Match>({
    queryKey: ["match-highlights", match._id],
    queryFn: () => api.get(ENDPOINTS.matchDetail(match._id)),
    refetchInterval: isLive ? 1000 * 30 : false, // 라이브면 30초마다
    staleTime: isLive ? 0 : 1000 * 60 * 10,
  });

  const currentMatch = liveMatch || match;
  const events = currentMatch.events || [];

  // 골, 카드, 교체만 필터
  const highlights = events.filter(
    (e) => e.type === "Goal" || e.type === "Card" || e.type === "subst",
  );

  const getPlayerImg = (playerId: number): string => {
    try {
      const { data: player, isError } = useQuery<Player>({
        queryKey: ["player-detail", match._id],
        queryFn: () => api.get(ENDPOINTS.playerDetail(playerId)),
        staleTime: 1000 * 60 * 10,
      });

      return player?.photo!;
    } catch (error: any) {
      console.log(error);
      throw new Error(error.message);
    }
  };

  const renderEvent = (event: MatchEvent, index: number) => {
    const isHomeTeam = event.team?.id === currentMatch.homeTeam.id;

    // 골
    if (event.type === "Goal") {
      return (
        <View key={index} style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Ionicons name="football" size={20} color="#fff" />
            <Text style={styles.goalTitle}>{t("highlights.goal")}</Text>
            <Text style={styles.goalTime}>{event.time.elapsed}'</Text>
          </View>
          <Text style={styles.goalScore}>
            {currentMatch.homeTeam.name} {currentMatch.goals.home} -{" "}
            {currentMatch.goals.away} {currentMatch.awayTeam.name}
          </Text>
          <View style={styles.goalPlayer}>
            <View style={styles.goalPlayerInfo}>
              <Text style={styles.goalPlayerName}>{event.player?.name}</Text>
              <View style={styles.goalPlayerTeam}>
                <Image
                  source={
                    isHomeTeam
                      ? currentMatch.homeTeam.logo
                      : currentMatch.awayTeam.logo
                  }
                  style={styles.goalPlayerLogo}
                  contentFit="contain"
                />
                <Text style={styles.goalPlayerTeamName}>
                  {isHomeTeam
                    ? currentMatch.homeTeam.name
                    : currentMatch.awayTeam.name}
                </Text>
                <Text style={styles.goalPlayerPosition}>
                  · {event.detail || t("highlights.goal")}
                </Text>
              </View>
            </View>
            <View style={styles.goalPlayerPhoto}>
              {getPlayerImg(event.player?.id!) ? (
                <Image
                  source={getPlayerImg(event.player?.id!)}
                  // style={styles.goalPlayerPhotoText}
                  contentFit="contain"
                />
              ) : (
                <Text style={styles.goalPlayerPhotoText}>
                  {event.player?.name?.charAt(0)}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    // 카드
    if (event.type === "Card") {
      const isYellow = event.detail === "Yellow Card";

      return (
        <View key={index} style={styles.cardEvent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>{isYellow ? "🟨" : "🟥"}</Text>
            <Text style={styles.cardTitle}>
              {isYellow ? t("highlights.yellowCard") : t("highlights.redCard")}
            </Text>
            <Text style={styles.cardTime}>{event.time.elapsed}'</Text>
          </View>
          <View style={styles.cardPlayer}>
            <View style={styles.cardPlayerInfo}>
              <Text style={styles.cardPlayerName}>{event.player?.name}</Text>
              <View style={styles.cardPlayerTeam}>
                <Image
                  source={
                    isHomeTeam
                      ? currentMatch.homeTeam.logo
                      : currentMatch.awayTeam.logo
                  }
                  style={styles.cardPlayerLogo}
                  contentFit="contain"
                />
                <Text style={styles.cardPlayerTeamName}>
                  {isHomeTeam
                    ? currentMatch.homeTeam.name
                    : currentMatch.awayTeam.name}
                </Text>
              </View>
            </View>
            <View style={styles.cardPlayerPhoto}>
              <Text style={styles.cardPlayerPhotoText}>
                {event.player?.name?.charAt(0)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // 교체
    if (event.type === "subst") {
      return (
        <View key={index} style={styles.substEvent}>
          <View style={styles.substHeader}>
            <View style={styles.substIcon}>
              <Ionicons name="arrow-up" size={12} color="#34a853" />
              <Ionicons name="arrow-down" size={12} color="#ea4335" />
            </View>
            <Text style={styles.substTitle}>
              {t("highlights.substitution")}
            </Text>
            <Text style={styles.substTime}>{event.time.elapsed}'</Text>
          </View>

          {/* 교체됨 */}
          {event.assist && (
            <View style={[styles.substPlayer, { marginTop: 12 }]}>
              <Text style={[styles.substLabel, styles.substLabelOut]}>
                {t("highlights.subIn")}
              </Text>
              <View style={styles.substPlayerInfo}>
                <Text style={styles.substPlayerName}>{event.assist.name}</Text>
                <View style={styles.substPlayerTeam}>
                  <Image
                    source={
                      isHomeTeam
                        ? currentMatch.homeTeam.logo
                        : currentMatch.awayTeam.logo
                    }
                    style={styles.substPlayerLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.substPlayerTeamName}>
                    {isHomeTeam
                      ? currentMatch.homeTeam.name
                      : currentMatch.awayTeam.name}
                  </Text>
                </View>
              </View>
              <View style={styles.substPlayerPhoto}>
                <Text style={styles.substPlayerPhotoText}>
                  {event.assist.name?.charAt(0)}
                </Text>
              </View>
            </View>
          )}
          {/* 교체 투입 */}
          <View style={styles.substPlayer}>
            <Text style={styles.substLabel}>{t("highlights.subOut")}</Text>
            <View style={styles.substPlayerInfo}>
              <Text style={styles.substPlayerName}>{event.player?.name}</Text>
              <View style={styles.substPlayerTeam}>
                <Image
                  source={
                    isHomeTeam
                      ? currentMatch.homeTeam.logo
                      : currentMatch.awayTeam.logo
                  }
                  style={styles.substPlayerLogo}
                  contentFit="contain"
                />
                <Text style={styles.substPlayerTeamName}>
                  {isHomeTeam
                    ? currentMatch.homeTeam.name
                    : currentMatch.awayTeam.name}
                </Text>
              </View>
            </View>
            <View style={styles.substPlayerPhoto}>
              <Text style={styles.substPlayerPhotoText}>
                {event.player?.name?.charAt(0)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={styles.container}
      // refreshControl={
      //   <RefreshControl refreshing={isLoading} onRefresh={refetch} />
      // }
    >
      {highlights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>{t("highlights.empty")}</Text>
        </View>
      ) : (
        <View style={styles.highlightsContainer}>
          {[...highlights]
            .reverse()
            .map((event, index) => renderEvent(event, index))}
        </View>
      )}

      <View style={{ height: 20 }} />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    highlightsContainer: {
      gap: 12,
      paddingHorizontal: 12,
      paddingTop: 12,
    },

    // 골 카드
    goalCard: {
      backgroundColor: Colors.goalCard,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    goalHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    goalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
      flex: 1,
    },
    goalTime: {
      fontSize: 14,
      fontWeight: "600",
      color: "rgba(255,255,255,0.7)",
    },
    goalScore: {
      fontSize: 15,
      fontWeight: "600",
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
    },
    goalPlayer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    goalPlayerInfo: {
      flex: 1,
      gap: 6,
    },
    goalPlayerName: {
      fontSize: 15,
      fontWeight: "600",
      color: "#ffffff",
    },
    goalPlayerTeam: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    goalPlayerLogo: {
      width: 18,
      height: 18,
    },
    goalPlayerTeamName: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
    },
    goalPlayerPosition: {
      fontSize: 12,
      color: "rgba(255,255,255,0.5)",
    },
    goalPlayerPhoto: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.2)",
    },

    goalPlayerPhotoText: {
      fontSize: 20,
      fontWeight: "700",
      color: "#ffffff",
    },

    // 카드 이벤트
    cardEvent: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardIcon: {
      fontSize: 18,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
      flex: 1,
    },
    cardTime: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    cardPlayer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardPlayerInfo: {
      flex: 1,
      gap: 4,
    },
    cardPlayerName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    cardPlayerTeam: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    cardPlayerLogo: {
      width: 16,
      height: 16,
    },
    cardPlayerTeamName: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    cardPlayerPhoto: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cardPlayerPhotoText: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.textSecondary,
    },

    // 교체 이벤트
    substEvent: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    substHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    substIcon: {
      flexDirection: "row",
    },
    substTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
      flex: 1,
    },
    substTime: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    substPlayer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    substLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: "#ea4335",
      width: 60,
    },
    substLabelOut: {
      color: "#34a853",
    },
    substPlayerInfo: {
      flex: 1,
      gap: 4,
    },
    substPlayerName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    substPlayerTeam: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    substPlayerLogo: {
      width: 16,
      height: 16,
    },
    substPlayerTeamName: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    substPlayerPhoto: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    substPlayerPhotoText: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.textSecondary,
    },
  });
