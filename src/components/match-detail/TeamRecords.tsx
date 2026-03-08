import React from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { Match } from "../../types";
import { Colors, getColors } from "../../constants/colors";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";

interface TeamMatchesProps {
  team1Id: number;
  team2Id: number;
}

export default function TeamMatchesTab({ team1Id, team2Id }: TeamMatchesProps) {
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data, isLoading } = useQuery<{
    homeTeam: Match[];
    awayTeam: Match[];
  }>({
    queryKey: ["team-matches-tab", team1Id, team2Id],
    queryFn: () =>
      api.get(`${ENDPOINTS.teamsRecentMatches(team1Id, team2Id)}?limit=5`),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading || !data)
    return <ActivityIndicator style={{ marginTop: 20 }} />;

  const MatchItem = ({
    match,
    targetTeamId,
  }: {
    match: Match;
    targetTeamId: number;
  }) => {
    const isHome = match.homeTeam.id === targetTeamId;
    const myScore = isHome ? match.goals.home : match.goals.away;
    const opponentScore = isHome ? match.goals.away : match.goals.home;

    let statusColor = "#A0A0A0";
    if (myScore! > opponentScore!) statusColor = "#27AE60";
    if (myScore! < opponentScore!) statusColor = "#EB5757";

    return (
      <View style={styles.matchRow}>
        {/* 홈팀 로고 (항상 왼쪽) */}
        <Image source={{ uri: match.homeTeam.logo }} style={styles.miniLogo} />

        {/* 스코어 */}
        <View style={[styles.resultBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.resultText}>
            {match.goals.home} - {match.goals.away}
          </Text>
        </View>

        {/* 어웨이팀 로고 (항상 오른쪽) */}
        <Image source={{ uri: match.awayTeam.logo }} style={styles.miniLogo} />
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>팀 기록</Text>

      <View style={styles.columnsContainer}>
        {/* 왼쪽: 팀 1 기록 */}
        <View style={styles.column}>
          {data.homeTeam.map((match) => (
            <MatchItem key={match._id} match={match} targetTeamId={team1Id} />
          ))}
        </View>

        {/* 오른쪽: 팀 2 기록 */}
        <View style={styles.column}>
          {data.awayTeam.map((match) => (
            <MatchItem key={match._id} match={match} targetTeamId={team2Id} />
          ))}
        </View>
      </View>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.background,
      borderRadius: 20,
      padding: 20,
      margin: 15,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 20,
      color: Colors.text,
    },
    columnsContainer: {
      flexDirection: "row", // 좌우 배치
      justifyContent: "space-between",
    },
    column: {
      flex: 1,
      gap: 15,
      alignItems: "center",
    },
    matchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    miniLogo: {
      width: 24,
      height: 24,
      resizeMode: "contain",
    },
    scoreBox: {
      width: 65, // 사진의 콤팩트한 사이즈에 맞춤
      height: 30,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    scoreText: {
      color: Colors.text,
      fontSize: 14,
      fontWeight: "bold",
    },
    resultBadge: {
      width: 75, // W/D/L 문자와 스코어가 다 들어가도록 넉넉하게
      height: 32,
      borderRadius: 8, // 너무 둥글지 않게 적당한 곡률
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row", // 문자랑 숫자를 가로로 배치
      elevation: 2, // 안드로이드 그림자
      shadowColor: "#000", // iOS 그림자
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
    },
    resultText: {
      color: Colors.text2, // 배경색 위에서 잘 보이게 흰색
      fontSize: 13,
      fontWeight: "bold",
      letterSpacing: 0.5,
    },
  });
