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
import AllMatchesModal from "../AllMatchesModal";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  teamId: number;
}

// 카드마다 useQuery 써야 해서 별도 컴포넌트로 분리
function MatchCardWithHighlight({ match, styles, Colors, t, i18n }: any) {
  const router = useRouter();

  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeGoals = match.goals.home ?? 0;
  const awayGoals = match.goals.away ?? 0;
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;

  const { data: highlight } = useQuery<any>({
    queryKey: ["highlight", match._id],
    queryFn: () =>
      api.get(
        ENDPOINTS.matchHighlight(
          match._id,
          match.homeTeam.name,
          match.awayTeam.name,
          match.date,
        ),
      ),
    enabled: isFinished,
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

  return (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => router.push(`/match/${match._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.matchBody}>
        {/* 왼쪽: 팀 및 스코어 */}
        <View style={styles.leftSection}>
          <View style={styles.teamScoreRow}>
            <Image
              source={{ uri: match.homeTeam.logo }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            <Text style={[styles.score, homeWon && styles.scoreWinner]}>
              {isFinished || isLive ? homeGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>

          <View style={[styles.teamScoreRow, { marginTop: 12 }]}>
            <Image
              source={{ uri: match.awayTeam.logo }}
              style={styles.teamLogo}
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            <Text style={[styles.score, awayWon && styles.scoreWinner]}>
              {isFinished || isLive ? awayGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.divider} />

        {/* 오른쪽: 상태, 날짜, 하이라이트 */}
        <View style={styles.rightSection}>
          <Text style={styles.statusText}>
            {isFinished
              ? t("matches.fullTime", "풀타임")
              : isLive
                ? t("matches.live", "라이브")
                : t("matches.scheduled", "예정")}
          </Text>
          <Text style={styles.dateText}>
            {new Date(match.date).getMonth() + 1}.{" "}
            {new Date(match.date).getDate()}.
          </Text>

          {highlight?.videoId ? (
            <TouchableOpacity
              style={styles.highlightThumb}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: `/highlight/${match._id}`,
                  params: { videoId: highlight.videoId },
                });
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: highlight.thumbnail }}
                style={styles.highlightThumbImg}
                contentFit="cover"
              />
              <View style={styles.highlightOverlay}>
                <Ionicons name="play" size={10} color="#fff" />
                <Text style={styles.highlightTime}>{highlight.duration}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TeamMatchesTab({ teamId }: Props) {
  const { t, i18n } = useTranslation();
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
          ([key, dateMatches]: [string, any]) => (
            <View key={key} style={styles.dateSection}>
              <Text style={styles.dateTitle}>{key}</Text>
              {dateMatches.map((match: any) => (
                <MatchCardWithHighlight
                  key={match._id}
                  match={match}
                  styles={styles}
                  Colors={Colors}
                  t={t}
                  i18n={i18n}
                />
              ))}
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
      marginBottom: 20,
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
    dateSection: { marginTop: 16 },
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
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    matchBody: {
      flexDirection: "row",
      alignItems: "center",
    },
    leftSection: {
      flex: 1,
    },
    teamScoreRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    teamLogo: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    teamName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: Colors.text,
    },
    score: {
      fontSize: 16,
      fontWeight: "400",
      color: Colors.textSecondary,
      textAlign: "right",
    },
    scoreWinner: {
      fontWeight: "600",
      color: Colors.text,
    },
    winnerIconContainer: {
      width: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    winnerIcon: {
      fontSize: 10,
      color: Colors.text,
      marginLeft: 4,
    },
    divider: {
      width: 1,
      height: "100%",
      backgroundColor: Colors.border,
      marginHorizontal: 16,
    },
    rightSection: {
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
      marginBottom: 2,
    },
    dateText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    emptySpace: {
      width: 80,
      height: 45,
    },
    highlightThumb: {
      width: 80,
      height: 45,
      borderRadius: 6,
      backgroundColor: "#1a1a1a",
      overflow: "hidden",
    },
    highlightThumbImg: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    highlightOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderTopLeftRadius: 4,
    },
    highlightTime: {
      fontSize: 10,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 2,
    },
  });
