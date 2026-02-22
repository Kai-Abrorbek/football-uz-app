import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
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
  const isHalfTime = match.status.short === "HT";
  const isFinished = match.status.short === "FT";
  const isUpcoming = match.status.short === "NS";

  const getTimeDisplay = () => {
    if (isHalfTime) return "하프타임";
    if (isLive) {
      const elapsed = match.status.elapsed || 0;
      const extra = (match.status as any).extra || 0; // 추가 시간
      return extra > 0 ? `${elapsed}+${extra}'` : `${elapsed}'`;
    }
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
      {/* LIVE 뱃지 (왼쪽 상단) */}
      {isLive && !isHalfTime && (
        <View style={styles.liveIndicator}>
          <Text style={styles.liveIndicatorText}>LIVE</Text>
        </View>
      )}

      {/* 홈팀 */}
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

      {/* 스코어/시간 */}
      <View style={styles.scoreContainer}>
        {isUpcoming ? (
          <Text style={styles.upcomingText}>{getTimeDisplay()}</Text>
        ) : (
          <>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{match.goals.home ?? 0}</Text>
              <Text style={styles.scoreDivider}> - </Text>
              <Text style={styles.score}>{match.goals.away ?? 0}</Text>
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{getTimeDisplay()}</Text>
              </View>
            )}
            {isFinished && <Text style={styles.finishedText}>종료</Text>}
          </>
        )}
      </View>

      {/* 원정팀 */}
      <View style={[styles.teamContainer, styles.awayTeam]}>
        <Image
          source={match.awayTeam.logo}
          style={styles.teamLogo}
          contentFit="contain"
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
    position: "relative",
  },
  liveIndicator: {
    position: "absolute",
    top: 8,
    right: 48,
    backgroundColor: Colors.live,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
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
  liveBadge: {
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
