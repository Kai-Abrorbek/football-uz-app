// src/components/player-detail/tabs/PlayerOverviewTab.tsx

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function PlayerOverviewTab({
  player,
  recentMatches,
}: {
  player: any;
  recentMatches: any[];
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const stat = player.statistics?.[0];
  const latestMatch = recentMatches?.[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 선수 사진 */}
      <View style={styles.photoContainer}>
        <Image source={player.photo} style={styles.photo} contentFit="cover" />
      </View>

      {/* 나이 + 소속팀 */}
      <View style={styles.row}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t("player.age")}</Text>
          <Text style={styles.infoValue}>
            {player.age}
            {t("player.years")}
          </Text>
          <Text style={styles.infoSub}>{player.birth?.date}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>{t("player.currentTeam")}</Text>
          <View style={styles.teamRow}>
            <Image
              source={player.currentTeam?.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.infoValue} numberOfLines={2}>
              {player.currentTeam?.name}
            </Text>
          </View>
        </View>
      </View>

      {/* 기록 */}
      {stat && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("player.stats")}</Text>
          <Text style={styles.cardSub}>
            {stat.league?.name} · {player.currentTeam?.name} ·{" "}
            {stat.league?.season}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stat.games?.appearences ?? 0}
              </Text>
              <Text style={styles.statLabel}>{t("player.games")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.goals?.total ?? 0}</Text>
              <Text style={styles.statLabel}>{t("player.goals")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.goals?.assists ?? 0}</Text>
              <Text style={styles.statLabel}>{t("player.assists")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.cards?.yellow ?? 0}</Text>
              <Text style={styles.statLabel}>{t("player.yellowCards")}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 최근 경기 */}
      {latestMatch && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("player.recentMatch")}</Text>
          <TouchableOpacity
            onPress={() => router.push(`/match/${latestMatch._id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.matchRow}>
              <View style={styles.matchTeams}>
                <View style={styles.matchTeamRow}>
                  <Image
                    source={latestMatch.homeTeam.logo}
                    style={styles.matchLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.matchTeamName}>
                    {latestMatch.homeTeam.name}
                  </Text>
                  <Text style={styles.matchScore}>
                    {latestMatch.goals.home}
                  </Text>
                </View>
                <View style={styles.matchTeamRow}>
                  <Image
                    source={latestMatch.awayTeam.logo}
                    style={styles.matchLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.matchTeamName}>
                    {latestMatch.awayTeam.name}
                  </Text>
                  <Text style={styles.matchScore}>
                    {latestMatch.goals.away}
                  </Text>
                </View>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchStatus}>{t("player.fulltime")}</Text>
                <Text style={styles.matchDate}>
                  {new Date(latestMatch.date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* 선수 이벤트 */}
            {latestMatch.playerEvents?.length > 0 && (
              <View style={styles.playerEventsRow}>
                <Image
                  source={player.currentTeam?.logo}
                  style={styles.eventTeamLogo}
                  contentFit="contain"
                />
                <Text style={styles.eventText}>
                  {latestMatch.playerEvents
                    .map((e: any) => {
                      // 어시스트로 기록된 경우
                      if (e.assist?.id === player.apiFootballId)
                        return `🅰️ ${e.time.elapsed}'`;
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
                    })
                    .filter(Boolean)
                    .join("  ")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      marginBottom: 40,
    },
    photoContainer: {
      width: "100%",
      height: 280,
      backgroundColor: Colors.surface,
    },
    photo: { width: "100%", height: "100%" },
    row: { flexDirection: "row", gap: 12, padding: 16 },
    infoCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      gap: 6,
    },
    infoLabel: { fontSize: 13, color: Colors.textSecondary },
    infoValue: { fontSize: 18, fontWeight: "700", color: Colors.text },
    infoSub: { fontSize: 12, color: Colors.textSecondary },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
    },
    teamLogo: { width: 24, height: 24 },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 4,
    },
    cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statItem: { flex: 1, alignItems: "center", gap: 4 },
    statValue: { fontSize: 22, fontWeight: "700", color: Colors.text },
    statLabel: { fontSize: 12, color: Colors.textSecondary },
    statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
    matchRow: { flexDirection: "row", gap: 12 },
    matchTeams: { flex: 1, gap: 8 },
    matchTeamRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    matchLogo: { width: 20, height: 20 },
    matchTeamName: { flex: 1, fontSize: 14, color: Colors.text },
    matchScore: { fontSize: 16, fontWeight: "700", color: Colors.text },
    matchInfo: { alignItems: "flex-end", justifyContent: "center", gap: 4 },
    matchStatus: { fontSize: 12, color: Colors.textSecondary },
    matchDate: { fontSize: 12, color: Colors.textSecondary },
    playerEventsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    eventTeamLogo: { width: 16, height: 16 },
    eventText: { fontSize: 13, color: Colors.textSecondary },
  });
