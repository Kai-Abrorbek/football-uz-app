import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import AllMatchesModal from "../AllMatchesModal";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  teamId: number;
}

export default function TeamMatchesTab({ teamId }: { teamId: number }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [showAllMatches, setShowAllMatches] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: matches } = useQuery<any[]>({
    queryKey: ["team-matches-tab", teamId],
    queryFn: () => api.get(`${ENDPOINTS.teamMatchRecent(teamId)}`),
    staleTime: 1000 * 60 * 5,
  });

  const groupedMatches =
    matches?.reduce((acc: any, match) => {
      const round = match.round ?? "";
      const leagueName = match.league?.name ?? "";
      const key = `${leagueName} · ${round}`;

      if (!acc[key]) acc[key] = [];
      acc[key].push(match);
      return acc;
    }, {}) ?? {};

  const renderMatchCard = (match: any) => {
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;
    const hasHighlight = isFinished && Math.random() > 0.5;

    // 현재 앱 언어 설정에 맞춰 날짜 로케일 변경
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

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.matchCard}
        onPress={() => router.push(`/match/${match._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.matchBody}>
          <View style={styles.teamsContainer}>
            <View style={styles.teamRow}>
              <Image
                source={{ uri: match.homeTeam.logo }}
                style={styles.teamLogo}
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeTeam.name}
              </Text>
            </View>
            <View style={styles.teamRow}>
              <Image
                source={{ uri: match.awayTeam.logo }}
                style={styles.teamLogo}
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
              <Text style={styles.scheduledText}>{t("matches.scheduled")}</Text>
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
                    ? t("matches.fullTime")
                    : isLive
                      ? t("matches.live")
                      : t("matches.tomorrow")}
                </Text>
                <Text style={styles.timeText}>
                  {new Date(match.date).toLocaleString(getLocale(), {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => setShowAllMatches(true)}
      >
        <Text style={styles.moreButtonText}>{t("matches.showMore")}</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(groupedMatches).map(
          ([date, dateMatches]: [string, any]) => (
            <View key={date} style={styles.dateSection}>
              <Text style={styles.dateTitle}>{date}</Text>
              {dateMatches.map((match: any) => renderMatchCard(match))}
            </View>
          ),
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      <AllMatchesModal
        visible={showAllMatches}
        teamId={teamId}
        onClose={() => setShowAllMatches(false)}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    moreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    moreButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
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
      color: Colors.live,
    },
    timeText: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
  });
