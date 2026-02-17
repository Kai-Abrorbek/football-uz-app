import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  match: Match;
}

const POSITION_MAP: any = {
  G: "GK",
  D: "DF",
  M: "MF",
  F: "FW",
};

export default function LineupTab({ match }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");

  const lineup = match.lineups;

  if (!lineup || (!lineup.home && !lineup.away)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          라인업은 경기 시작 1시간 전에 공개됩니다
        </Text>
      </View>
    );
  }

  const homeLineup = lineup.home;
  const awayLineup = lineup.away;

  const getFormationRows = (formation: string) => {
    return formation.split("-").map(Number);
  };

  const renderPitch = (teamLineup: any, isHome: boolean) => {
    if (!teamLineup) return null;

    const rows = getFormationRows(teamLineup.formation || "4-3-3");
    const players = teamLineup.startXI || [];

    // 포메이션대로 선수 배치
    let playerIndex = 1; // 0은 골키퍼
    const formationRows = rows.map((count) => {
      const rowPlayers = players.slice(playerIndex, playerIndex + count);
      playerIndex += count;
      return rowPlayers;
    });

    const gk = players[0];

    return (
      <View
        style={[styles.pitch, isHome ? styles.pitchHome : styles.pitchAway]}
      >
        {/* 팀 이름 + 포메이션 */}
        <View style={styles.pitchHeader}>
          <Image
            source={isHome ? match.homeTeam.logo : match.awayTeam.logo}
            style={styles.pitchTeamLogo}
            contentFit="contain"
          />
          <Text style={styles.pitchTeamName}>
            {isHome ? match.homeTeam.name : match.awayTeam.name}
          </Text>
          <Text style={styles.formation}>{teamLineup.formation}</Text>
        </View>

        {/* 필드 */}
        <View style={styles.field}>
          {/* 공격진 → 수비진 순서 (홈팀) / 수비진 → 공격진 순서 (원정팀) */}
          {(isHome ? [...formationRows].reverse() : formationRows).map(
            (row: any[], rowIndex: number) => (
              <View key={rowIndex} style={styles.fieldRow}>
                {row.map((player: any, i: number) => (
                  <View key={i} style={styles.playerSpot}>
                    <View style={styles.playerCircle}>
                      {player?.photo ? (
                        <Image
                          source={player?.photo}
                          style={styles.subPhotoImg}
                          contentFit="contain"
                        />
                      ) : (
                        <Text style={styles.playerNumber}>
                          {player?.number}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player?.playerName?.split(" ").pop()} #{player?.number}
                    </Text>
                  </View>
                ))}
              </View>
            ),
          )}

          {/* 골키퍼 */}
          <View style={styles.fieldRow}>
            <View style={styles.playerSpot}>
              <View style={[styles.playerCircle, styles.gkCircle]}>
                <Text style={styles.playerNumber}>{gk?.number}</Text>
              </View>
              <Text style={styles.playerName} numberOfLines={1}>
                {gk?.playerName?.split(" ").pop()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 팀 선택 탭 */}
      <View style={styles.teamTabs}>
        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === "home" && styles.teamTabActive,
          ]}
          onPress={() => setSelectedTeam("home")}
        >
          <Image
            source={match.homeTeam.logo}
            style={styles.teamTabLogo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.teamTabText,
              selectedTeam === "home" && styles.teamTabTextActive,
            ]}
          >
            {match.homeTeam.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.teamTab,
            selectedTeam === "away" && styles.teamTabActive,
          ]}
          onPress={() => setSelectedTeam("away")}
        >
          <Image
            source={match.awayTeam.logo}
            style={styles.teamTabLogo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.teamTabText,
              selectedTeam === "away" && styles.teamTabTextActive,
            ]}
          >
            {match.awayTeam.name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 피치 */}
      {selectedTeam === "home"
        ? renderPitch(homeLineup, true)
        : renderPitch(awayLineup, false)}

      {/* 후보 선수 */}
      <View style={styles.subsContainer}>
        <View style={styles.subsHeader}>
          <Image
            source={
              selectedTeam === "home"
                ? match.homeTeam.logo
                : match.awayTeam.logo
            }
            style={styles.subsHeaderLogo}
            contentFit="contain"
          />
          <Text style={styles.subsTitle}>후보 선수</Text>
          <Image
            source={
              selectedTeam === "home"
                ? match.awayTeam.logo
                : match.homeTeam.logo
            }
            style={styles.subsHeaderLogo}
            contentFit="contain"
          />
        </View>
        {/* 양 팀 후보 2열 */}
        {(() => {
          const homeSubs = homeLineup?.substitutes || [];
          const awaySubs = awayLineup?.substitutes || [];
          const maxLen = Math.max(homeSubs.length, awaySubs.length);

          return Array.from({ length: maxLen }).map((_, i) => {
            const homePlayer = homeSubs[i];
            const awayPlayer = awaySubs[i];
            console.log(homePlayer);
            return (
              <View key={i} style={styles.subRow}>
                {/* 홈 선수 */}
                {homePlayer ? (
                  <View style={styles.subPlayerCard}>
                    <View style={styles.subPhotoContainer}>
                      <View style={styles.subPhoto}>
                        {homePlayer?.photo ? (
                          <Image
                            source={homePlayer?.photo}
                            style={styles.subPhotoImg}
                            contentFit="contain"
                          />
                        ) : (
                          <Text style={styles.subPhotoText}>
                            {homePlayer.playerName?.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.subArrow}>
                        <Ionicons name="arrow-up" size={8} color="#fff" />
                      </View>
                    </View>
                    <View style={styles.subInfo}>
                      <Text style={styles.subName} numberOfLines={1}>
                        {homePlayer.playerName}
                      </Text>
                      <Text style={styles.subDetail}>#{homePlayer.number}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.subPlayerCard} />
                )}

                {/* 원정 선수 */}
                {awayPlayer ? (
                  <View
                    style={[styles.subPlayerCard, styles.subPlayerCardRight]}
                  >
                    <View style={[styles.subInfo, { alignItems: "flex-end" }]}>
                      <Text style={styles.subName} numberOfLines={1}>
                        {awayPlayer.playerName}
                      </Text>
                      <Text style={styles.subDetail}>#{awayPlayer.number}</Text>
                    </View>
                    <View style={styles.subPhotoContainer}>
                      <View style={styles.subPhoto}>
                        {awayPlayer?.photo ? (
                          <Image
                            source={awayPlayer?.photo}
                            style={styles.subPhotoImg}
                            contentFit="contain"
                          />
                        ) : (
                          <Text style={styles.subPhotoText}>
                            {awayPlayer.playerName?.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.subArrow}>
                        <Ionicons name="arrow-up" size={8} color="#fff" />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.subPlayerCard} />
                )}
              </View>
            );
          });
        })()}

        {/* 감독 */}
        <View style={styles.coachContainer}>
          <Text style={styles.coachTitle}>감독</Text>
          <View style={styles.coachRow}>
            <View style={styles.coachRow}>
              <Text style={styles.coachName}>{match.homeTeam.name} 감독</Text>
              <Text style={styles.coachName}>{match.awayTeam.name} 감독</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  teamTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  teamTabActive: {
    borderBottomColor: Colors.primary,
  },
  teamTabLogo: {
    width: 20,
    height: 20,
  },
  teamTabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  teamTabTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  pitch: {
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  pitchHome: {
    backgroundColor: "#2d8a4e",
  },
  pitchAway: {
    backgroundColor: "#2d6b8a",
  },
  pitchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    gap: 8,
  },
  pitchTeamLogo: {
    width: 24,
    height: 24,
  },
  pitchTeamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  formation: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  field: {
    padding: 16,
    gap: 20,
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  playerSpot: {
    alignItems: "center",
    gap: 4,
    width: 56,
  },
  playerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  gkCircle: {
    backgroundColor: "#ffd700",
  },
  playerNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  playerName: {
    fontSize: 10,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subsContainer: {
    backgroundColor: Colors.surface,
    margin: 12,
    borderRadius: 12,
    padding: 16,
  },
  subsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subPlayer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  subNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  subPos: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  // subsContainer: {
  //   backgroundColor: Colors.surface,
  //   margin: 12,
  //   borderRadius: 12,
  //   overflow: "hidden",
  // },
  subsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subsHeaderLogo: {
    width: 28,
    height: 28,
  },
  // subsTitle: {
  //   fontSize: 15,
  //   fontWeight: "700",
  //   color: Colors.text,
  // },
  subRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subPlayerCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  subPlayerCardRight: {
    flexDirection: "row-reverse",
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  subPhotoContainer: {
    position: "relative",
  },
  subPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  subPhotoText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  subPhotoImg: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  subArrow: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#34a853",
    alignItems: "center",
    justifyContent: "center",
  },
  // subInfo: {
  //   flex: 1,
  //   gap: 2,
  // },
  // subName: {
  //   fontSize: 13,
  //   fontWeight: "600",
  //   color: Colors.text,
  // },
  subDetail: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  coachContainer: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  coachTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  coachRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  coachName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
});
