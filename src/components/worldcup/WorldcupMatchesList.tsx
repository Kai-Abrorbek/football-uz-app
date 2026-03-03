import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { Match } from "../../types";

interface Props {
  matches: Match[];
  teamGroupMap?: Record<number, string>;
  onMatchPress?: () => void; // 모달에서 쓸 때 닫기용
}

const getRoundType = (round: string) => {
  if (round?.includes("Group Stage")) return "group";
  return "tournament";
};

export default function WorldcupMatchesList({
  matches,
  onMatchPress,
  teamGroupMap,
}: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  // 조 이름 변환 함수
  const getGroupLabel = (
    match: Match,
    teamGroupMap: Record<number, string>,
    t: any,
  ) => {
    const group =
      teamGroupMap[match.homeTeam.id] ?? teamGroupMap[match.awayTeam.id];
    if (!group) return "";
    // "Group A" → "A조" (한국어 기준, i18n으로 처리)
    return group.replace("Group ", `${t("worldcup.group")} `);
  };

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

  const renderMatchCard = (match: Match) => {
    const isFinished = match.status.short === "FT";
    const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
    const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
    const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);
    const groupLabel =
      match.round?.replace("Group Stage - ", `${t("worldcup.group")} `) ?? "";

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.matchCard}
        onPress={() => {
          if (onMatchPress) onMatchPress();
          router.push(`/match/${match._id}`);
        }}
        activeOpacity={0.7}
      >
        {match.round?.includes("Group Stage") && teamGroupMap && (
          <Text style={styles.groupLabel}>
            {getGroupLabel(match, teamGroupMap, t)}
          </Text>
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
  };

  return (
    <SectionList<Match, any>
      sections={sections}
      // scrollEnabled={false}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => renderMatchCard(item)}
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
