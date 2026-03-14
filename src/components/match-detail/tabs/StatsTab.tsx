import { View, Text, StyleSheet, ScrollView } from "react-native";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  match: Match;
}

// API-Football type 문자열 → 내부 키 매핑
const STAT_TYPE_MAP: Record<string, string> = {
  "Shots on Goal": "shotsOnTarget",
  "Shots off Goal": "shotsOffGoal",
  "Total Shots": "totalShots",
  "Blocked Shots": "blockedShots",
  "Shots insidebox": "shotsInsidebox",
  "Shots outsidebox": "shotsOutsidebox",
  Fouls: "fouls",
  "Corner Kicks": "corners",
  Offsides: "offsides",
  "Ball Possession": "ballPossession",
  "Yellow Cards": "yellowCards",
  "Red Cards": "redCards",
  "Goalkeeper Saves": "goalkeeperSaves",
  "Total passes": "totalPasses",
  "Passes accurate": "accuratePasses",
  "Passes %": "passAccuracy",
  expected_goals: "expectedGoals",
  goals_prevented: "goalsPrevented",
};

// statisticsRaw 배열을 { key: value } 객체로 변환
const parseRawStats = (rawStats: { type: string; value: any }[]) => {
  const result: Record<string, any> = {};
  rawStats.forEach(({ type, value }) => {
    const key = STAT_TYPE_MAP[type];
    if (key) result[key] = value;
  });
  return result;
};

export default function StatsTab({ match }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const homeColor = match.homeTeam.color ?? "#4285f4";
  const awayColor = match.awayTeam.color ?? "#ea4335";

  // statisticsRaw 기준으로 홈/어웨이 파싱
  const homeRaw = match.statisticsRaw?.find(
    (s: any) => s.team.id === match.homeTeam.id,
  );
  const awayRaw = match.statisticsRaw?.find(
    (s: any) => s.team.id === match.awayTeam.id,
  );

  const homeStats = homeRaw ? parseRawStats(homeRaw.statistics) : {};
  const awayStats = awayRaw ? parseRawStats(awayRaw.statistics) : {};

  const hasData = match.statisticsRaw && match.statisticsRaw.length > 0;

  if (!hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("matchStats.empty")}</Text>
      </View>
    );
  }

  const getVal = (stats: Record<string, any>, key: string): number => {
    const val = stats[key];
    if (val === null || val === undefined) return 0;
    if (typeof val === "string" && val.includes("%")) return parseFloat(val);
    return Number(val) || 0;
  };

  const getRawVal = (stats: Record<string, any>, key: string): string => {
    const val = stats[key];
    if (val === null || val === undefined) return "0";
    return String(val);
  };

  // 일반 stat 행 - 높은 쪽 버블 팀 컬러
  const renderStatRow = (labelKey: string, key: string, isLast = false) => {
    const hVal = getVal(homeStats, key);
    const aVal = getVal(awayStats, key);
    const hRaw = getRawVal(homeStats, key);
    const aRaw = getRawVal(awayStats, key);
    const isHomeBetter = hVal > aVal;
    const isAwayBetter = aVal > hVal;

    return (
      <View key={key} style={[styles.statRow, isLast && styles.statRowLast]}>
        {/* 홈 버블 */}
        <View style={styles.bubbleWrap}>
          <View
            style={[
              styles.bubble,
              isHomeBetter && { backgroundColor: homeColor },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isHomeBetter && styles.bubbleTextHighlight,
              ]}
            >
              {hRaw}
            </Text>
          </View>
        </View>

        <Text style={styles.statLabel}>{t(labelKey)}</Text>

        {/* 어웨이 버블 */}
        <View style={[styles.bubbleWrap, { alignItems: "flex-end" }]}>
          <View
            style={[
              styles.bubble,
              isAwayBetter && { backgroundColor: awayColor },
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isAwayBetter && styles.bubbleTextHighlight,
              ]}
            >
              {aRaw}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 점유율 큰 바
  const renderPossession = () => {
    const hVal = getVal(homeStats, "ballPossession");
    const aVal = getVal(awayStats, "ballPossession");
    const total = hVal + aVal;
    const hFlex = total > 0 ? (hVal / total) * 100 : 50;
    const aFlex = total > 0 ? (aVal / total) * 100 : 50;

    return (
      <View style={styles.possessionContainer}>
        <Text style={styles.possessionLabel}>
          {t("matchStats.stats.ballPossession")}
        </Text>
        <View style={styles.possessionBar}>
          <View
            style={[
              styles.possessionSide,
              {
                flex: hFlex,
                backgroundColor: homeColor,
                borderTopLeftRadius: 22,
                borderBottomLeftRadius: 22,
              },
            ]}
          >
            <Text style={styles.possessionText}>
              {hVal > 0 ? `${hVal}%` : "0%"}
            </Text>
          </View>
          <View
            style={[
              styles.possessionSide,
              {
                flex: aFlex,
                backgroundColor: awayColor,
                borderTopRightRadius: 22,
                borderBottomRightRadius: 22,
                alignItems: "flex-end",
              },
            ]}
          >
            <Text style={styles.possessionText}>
              {aVal > 0 ? `${aVal}%` : "0%"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 슛 중첩 카드
  const renderShotSection = () => {
    const missed = {
      h: getVal(homeStats, "shotsOffGoal"),
      a: getVal(awayStats, "shotsOffGoal"),
    };
    const onTarget = {
      h: getVal(homeStats, "shotsOnTarget"),
      a: getVal(awayStats, "shotsOnTarget"),
    };

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("matchStats.sections.shots")}</Text>

        {renderStatRow("matchStats.stats.totalShots", "totalShots")}

        {/* 빗나간 슛 외곽 카드 */}
        <View style={styles.nestedOuter}>
          <View style={styles.nestedOuterRow}>
            <View style={styles.bubbleWrap}>
              <View
                style={[
                  styles.bubble,
                  missed.h > missed.a && { backgroundColor: homeColor },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    missed.h > missed.a && styles.bubbleTextHighlight,
                  ]}
                >
                  {getRawVal(homeStats, "shotsOffGoal")}
                </Text>
              </View>
            </View>
            <Text style={styles.statLabel}>
              {t("matchStats.stats.shotsOffGoal")}
            </Text>
            <View style={[styles.bubbleWrap, { alignItems: "flex-end" }]}>
              <View
                style={[
                  styles.bubble,
                  missed.a > missed.h && { backgroundColor: awayColor },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    missed.a > missed.h && styles.bubbleTextHighlight,
                  ]}
                >
                  {getRawVal(awayStats, "shotsOffGoal")}
                </Text>
              </View>
            </View>
          </View>

          {/* 유효 슈팅 내부 카드 */}
          <View style={styles.nestedInner}>
            <View style={styles.bubbleWrap}>
              <View
                style={[
                  styles.bubble,
                  onTarget.h > onTarget.a && { backgroundColor: homeColor },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    onTarget.h > onTarget.a && styles.bubbleTextHighlight,
                  ]}
                >
                  {getRawVal(homeStats, "shotsOnTarget")}
                </Text>
              </View>
            </View>
            <Text style={styles.statLabel}>
              {t("matchStats.stats.shotsOnTarget")}
            </Text>
            <View style={[styles.bubbleWrap, { alignItems: "flex-end" }]}>
              <View
                style={[
                  styles.bubble,
                  onTarget.a > onTarget.h && { backgroundColor: awayColor },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    onTarget.a > onTarget.h && styles.bubbleTextHighlight,
                  ]}
                >
                  {getRawVal(awayStats, "shotsOnTarget")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {renderStatRow("matchStats.stats.blockedShots", "blockedShots")}
        {renderStatRow("matchStats.stats.goalkeeperSaves", "goalkeeperSaves")}
        {renderStatRow("matchStats.stats.shotsInsidebox", "shotsInsidebox")}
        {renderStatRow(
          "matchStats.stats.shotsOutsidebox",
          "shotsOutsidebox",
          true,
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 주요 통계 ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("matchStats.sections.main")}</Text>
        {renderPossession()}
        {renderStatRow("matchStats.stats.expectedGoals", "expectedGoals")}
        {renderStatRow("matchStats.stats.totalShots", "totalShots")}
        {renderStatRow("matchStats.stats.shotsOnTarget", "shotsOnTarget")}
        {renderStatRow("matchStats.stats.accuratePasses", "accuratePasses")}
        {renderStatRow("matchStats.stats.fouls", "fouls")}
        {renderStatRow("matchStats.stats.offsides", "offsides")}
        {renderStatRow("matchStats.stats.corners", "corners", true)}
      </View>

      {/* ── 슛 ── */}
      {renderShotSection()}

      {/* ── 패스 ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("matchStats.sections.passes")}</Text>
        {renderStatRow("matchStats.stats.totalPasses", "totalPasses")}
        {renderStatRow("matchStats.stats.accuratePasses", "accuratePasses")}
        {renderStatRow("matchStats.stats.passAccuracy", "passAccuracy", true)}
      </View>

      {/* ── 수비 ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("matchStats.sections.defense")}</Text>
        {renderStatRow("matchStats.stats.goalkeeperSaves", "goalkeeperSaves")}
        {renderStatRow(
          "matchStats.stats.goalsPrevented",
          "goalsPrevented",
          true,
        )}
      </View>

      {/* ── 반칙 ── */}
      <View style={[styles.card, { marginBottom: 24 }]}>
        <Text style={styles.cardTitle}>{t("matchStats.sections.fouls")}</Text>
        {renderStatRow("matchStats.stats.fouls", "fouls")}
        {renderStatRow("matchStats.stats.yellowCards", "yellowCards")}
        {renderStatRow("matchStats.stats.redCards", "redCards", true)}
      </View>
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.surface2,
    },
    contentContainer: {
      padding: 12,
      gap: 12,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: Colors.surface2,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.text,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      textAlign: "center",
      marginBottom: 12,
    },

    // 점유율
    possessionContainer: {
      marginBottom: 12,
    },
    possessionLabel: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "center",
      marginBottom: 10,
    },
    possessionBar: {
      flexDirection: "row",
      height: 44,
      borderRadius: 22,
      overflow: "hidden",
    },
    possessionSide: {
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    possessionText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#ffffff",
    },

    // 일반 행
    statRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    statRowLast: {
      borderBottomWidth: 0,
    },
    statLabel: {
      flex: 1,
      fontSize: 13,
      color: Colors.text,
      textAlign: "center",
    },

    // 버블
    bubbleWrap: {
      width: 70,
      alignItems: "flex-start",
    },
    bubble: {
      minWidth: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    bubbleText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
    },
    bubbleTextHighlight: {
      color: "#ffffff",
      fontWeight: "800",
    },

    // 슛 중첩
    nestedOuter: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      padding: 12,
      marginVertical: 4,
    },
    nestedOuterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    nestedInner: {
      backgroundColor: Colors.border,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
  });
