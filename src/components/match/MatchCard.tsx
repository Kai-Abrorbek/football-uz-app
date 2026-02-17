import { TouchableOpacity, View, Text, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";
import { Match } from "../../types";

interface Props {
  match: Match;
}

export default function MatchCard({ match }: Props) {
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
    match.status.short,
  );
  const isFinished = match.status.short === "FT";
  const isUpcoming = match.status.short === "NS";

  const getTimeDisplay = () => {
    if (isLive) return `${match.status.elapsed}'`;
    if (isFinished) return "종료";
    const date = new Date(match.date);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/match/${match._id}`)}
      activeOpacity={0.7}
    >
      {/* 홈팀 */}
      <View style={styles.teamContainer}>
        <Image
          source={{ uri: match.homeTeam.logo }}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text style={styles.teamName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
      </View>

      {/* 스코어/시간 */}
      <View style={styles.scoreContainer}>
        {isUpcoming ? (
          <Text style={styles.time}>{getTimeDisplay()}</Text>
        ) : (
          <View style={styles.scoreBox}>
            <Text style={styles.score}>{match.goals.home ?? 0}</Text>
            <Text style={styles.scoreDivider}> - </Text>
            <Text style={styles.score}>{match.goals.away ?? 0}</Text>
          </View>
        )}
        {isLive && (
          <View style={styles.livebage}>
            <Text style={styles.liveBadgeText}>{getTimeDisplay()}</Text>
          </View>
        )}
        {isFinished && <Text style={styles.finishedText}>종료</Text>}
        {isUpcoming && (
          <Text style={styles.upcomingText}>{getTimeDisplay()}</Text>
        )}
      </View>

      {/* 원정팀 */}
      <View style={[styles.teamContainer, styles.awayTeam]}>
        <Image
          source={{ uri: match.awayTeam.logo }}
          style={styles.teamLogo}
          resizeMode="contain"
        />
        <Text style={styles.teamName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  awayTeam: {
    flexDirection: "row-reverse",
  },
  teamLogo: {
    width: 28,
    height: 28,
  },
  teamName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
  },
  scoreContainer: {
    alignItems: "center",
    minWidth: 80,
    gap: 4,
  },
  scoreBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  score: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  scoreDivider: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  time: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  livebage: {
    backgroundColor: "#fff0f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveBadgeText: {
    fontSize: 12,
    color: Colors.live,
    fontWeight: "700",
  },
  finishedText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  upcomingText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
});
