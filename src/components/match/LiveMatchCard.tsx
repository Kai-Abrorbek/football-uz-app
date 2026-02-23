import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";
import { Match } from "../../types";

interface Props {
  match: Match;
}

export default function LiveMatchCard({ match }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/match/${match._id}`)}
      activeOpacity={0.7}
    >
      {/* 리그 + 시간 */}
      <View style={styles.header}>
        <Text style={styles.leagueName} numberOfLines={1}>
          {match.league.name}
        </Text>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTime}>{match.status.elapsed}'</Text>
        </View>
      </View>

      {/* 홈팀 */}
      <View style={styles.teamRow}>
        <Image
          source={{ uri: match.homeTeam.logo }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.teamName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
        <Text style={styles.score}>{match.goals.home ?? 0}</Text>
      </View>

      {/* 원정팀 */}
      <View style={styles.teamRow}>
        <Image
          source={{ uri: match.awayTeam.logo }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.teamName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
        <Text style={styles.score}>{match.goals.away ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginLeft: 16,
    width: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.live,
  },
  liveTime: {
    fontSize: 12,
    color: Colors.live,
    fontWeight: "700",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  logo: {
    width: 22,
    height: 22,
  },
  teamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  score: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 20,
    textAlign: "right",
  },
});
