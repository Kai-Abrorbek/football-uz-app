import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { Match } from "../../types";

interface Props {
  match: Match;
  showGroup?: boolean;
  onPress?: () => void;
}

export default function WorldcupMatchCard({
  match,
  showGroup = true,
  onPress,
}: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
  const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
  const groupLabel =
    match.round?.replace("Group Stage - ", `${t("worldcup.group")} `) ?? "";

  const handlePress = () => {
    if (onPress) onPress();
    router.push(`/match/${match._id}`);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {showGroup && match.round?.includes("Group Stage") && (
        <Text style={styles.groupLabel}>{groupLabel}</Text>
      )}

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
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    card: {
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
