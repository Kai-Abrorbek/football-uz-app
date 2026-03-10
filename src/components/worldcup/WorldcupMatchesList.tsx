import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { Image } from "expo-image";
import { router, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";
import api from "../../services/api";
import { Match } from "../../types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  matches: Match[];
  teamGroupMap?: Record<number, string>;
  onMatchPress?: () => void;
  ListFooterComponent?: React.ReactElement;
}

const getRoundType = (round: string) => {
  if (round?.includes("Group Stage")) return "group";
  return "tournament";
};

function MatchCard({
  match,
  onMatchPress,
  teamGroupMap,
  styles,
  Colors,
  t,
  i18n,
}: any) {
  const router = useRouter();
  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
  const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
  const groupLabel =
    match.round?.replace("Group Stage - ", `${t("worldcup.group")} `) ?? "";

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
      onPress={() => {
        if (onMatchPress) onMatchPress();
        router.push(`/match/${match._id}`);
      }}
      activeOpacity={0.7}
    >
      {match.round?.includes("Group Stage") && teamGroupMap && (
        <Text style={styles.groupLabel}>{groupLabel}</Text>
      )}
      <View style={styles.matchBody}>
        {/* 왼쪽: 팀 및 스코어 */}
        <View style={styles.leftSection}>
          <View style={styles.teamScoreRow}>
            <Image
              source={match.homeTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            <Text style={[styles.score, homeWon && styles.scoreWinner]}>
              {isFinished || isLive ? match.goals.home : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>

          <View style={[styles.teamScoreRow, { marginTop: 12 }]}>
            <Image
              source={match.awayTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            <Text style={[styles.score, awayWon && styles.scoreWinner]}>
              {isFinished || isLive ? match.goals.away : ""}
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
              ? t("worldcup.fulltime", "풀타임")
              : isLive
                ? "LIVE"
                : t("worldcup.scheduled", "예정")}
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
                if (onMatchPress) onMatchPress();
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

export default function WorldcupMatchesList({
  matches,
  onMatchPress,
  teamGroupMap,
}: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  const sections = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((match) => {
      const date = new Date(match.date).toLocaleDateString(i18n.language, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const roundType = getRoundType(match.round ?? "");
      const roundLabel =
        roundType === "group" ? t("worldcup.groupStage") : (match.round ?? "");
      const key = `${roundLabel} · ${date}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const dateA = a.split(" · ")[1];
        const dateB = b.split(" · ")[1];
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      })
      .map(([title, data]) => ({ title, data }));
  }, [matches, i18n.language, t]);

  return (
    <SectionList<Match, any>
      sections={sections}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <MatchCard
          match={item}
          onMatchPress={onMatchPress}
          teamGroupMap={teamGroupMap}
          styles={styles}
          Colors={Colors}
          t={t}
          i18n={i18n}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={<View style={{ height: 40 }} />}
    />
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    sectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
    matchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 10,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    groupLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.textSecondary,
      marginBottom: 12,
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
