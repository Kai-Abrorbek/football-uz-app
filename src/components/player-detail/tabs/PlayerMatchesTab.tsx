// src/components/player-detail/tabs/PlayerMatchesTab.tsx

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";

export default function PlayerMatchesTab({
  player,
  recentMatches,
}: {
  player: any;
  recentMatches: any[];
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  const renderEvent = (e: any) => {
    // 어시스트로 기록된 경우
    if (e.assist?.id === player.apiFootballId) return `🅰️ ${e.time.elapsed}'`;
    // 골
    if (e.type === "Goal") return `⚽ ${e.time.elapsed}'`;
    // 옐로카드
    if (e.type === "Card" && e.detail === "Yellow Card")
      return `🟨 ${e.time.elapsed}'`;
    // 레드카드
    if (e.type === "Card" && e.detail === "Red Card")
      return `🟥 ${e.time.elapsed}'`;
    // 교체
    if (e.type === "subst") return `🔄 ${e.time.elapsed}'`;
    return null;
  };

  if (!recentMatches?.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t("player.noMatches")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {recentMatches.map((match: any) => {
        const homeWon = match.goals.home > match.goals.away;
        const awayWon = match.goals.away > match.goals.home;

        return (
          <TouchableOpacity
            key={match._id}
            style={styles.card}
            onPress={() => router.push(`/match/${match._id}`)}
            activeOpacity={0.7}
          >
            {/* 경기 결과 */}
            <View style={styles.matchRow}>
              <View style={styles.teams}>
                <View style={styles.teamRow}>
                  <Image
                    source={match.homeTeam.logo}
                    style={styles.logo}
                    contentFit="contain"
                  />
                  <Text
                    style={[styles.teamName, homeWon && styles.winner]}
                    numberOfLines={1}
                  >
                    {match.homeTeam.name}
                  </Text>
                  <Text style={[styles.score, homeWon && styles.winner]}>
                    {match.goals.home}
                  </Text>
                  {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
                <View style={styles.teamRow}>
                  <Image
                    source={match.awayTeam.logo}
                    style={styles.logo}
                    contentFit="contain"
                  />
                  <Text
                    style={[styles.teamName, awayWon && styles.winner]}
                    numberOfLines={1}
                  >
                    {match.awayTeam.name}
                  </Text>
                  <Text style={[styles.score, awayWon && styles.winner]}>
                    {match.goals.away}
                  </Text>
                  {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
                </View>
              </View>

              <View style={styles.matchInfo}>
                <Text style={styles.status}>{t("player.fulltime")}</Text>
                <Text style={styles.date}>
                  {new Date(match.date).toLocaleString(i18n.language, {
                    month: "numeric",
                    day: "numeric",
                    weekday: "short",
                  })}
                </Text>
              </View>
            </View>

            {/* 선수 이벤트 */}
            <View style={styles.eventsRow}>
              <Image
                source={player.currentTeam?.logo}
                style={styles.eventLogo}
                contentFit="contain"
              />
              {match.playerEvents?.length > 0 ? (
                <Text style={styles.eventText}>
                  {match.playerEvents
                    .map(renderEvent)
                    .filter(Boolean)
                    .join("  ")}
                </Text>
              ) : (
                <Text style={styles.eventText}>{t("player.noEvents")}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 14, color: Colors.textSecondary },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    matchRow: { flexDirection: "row", gap: 12 },
    teams: { flex: 1, gap: 8 },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 20, height: 20 },
    teamName: { flex: 1, fontSize: 14, color: Colors.text },
    winner: { fontWeight: "700" },
    score: { fontSize: 16, color: Colors.text },
    winnerIcon: { fontSize: 10, color: Colors.textSecondary },
    matchInfo: { alignItems: "flex-end", justifyContent: "center", gap: 4 },
    status: { fontSize: 12, color: Colors.textSecondary },
    date: { fontSize: 12, color: Colors.textSecondary },
    eventsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    eventLogo: { width: 16, height: 16 },
    eventText: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
  });
