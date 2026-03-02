// src/components/player-detail/tabs/PlayerStatsTab.tsx

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";

export default function PlayerStatsTab({ player }: { player: any }) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const statistics = player.statistics ?? [];

  // 팀별로 그룹핑
  const grouped = statistics.reduce((acc: Record<string, any[]>, stat: any) => {
    const teamName = stat.team?.name ?? "Unknown";
    if (!acc[teamName]) acc[teamName] = [];
    acc[teamName].push(stat);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 팀별 서브탭 없이 팀 이름을 섹션 헤더로 */}
      {Object.entries(grouped).map(([teamName, stats]) => (
        <View key={teamName} style={styles.section}>
          <Text style={styles.teamName}>{teamName}</Text>

          {(stats as any[]).map((stat: any, index: number) => (
            <View key={index} style={styles.card}>
              {/* 리그 이름 */}
              <Text style={styles.leagueName}>{stat.league?.name}</Text>

              {/* 헤더 */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.yearCell]}>
                  {t("player.year")}
                </Text>
                <Text style={styles.headerCell}>{t("player.games")}</Text>
                <Text style={styles.headerCell}>{t("player.goals")}</Text>
                <Text style={styles.headerCell}>{t("player.assists")}</Text>
                <View style={styles.cardIcon}>
                  <View
                    style={{
                      width: 10,
                      height: 14,
                      backgroundColor: "#f5c518",
                      borderRadius: 1,
                      transform: [{ rotate: "5deg" }],
                    }}
                  />
                </View>
                <View style={styles.cardIcon}>
                  <View
                    style={{
                      width: 10,
                      height: 14,
                      backgroundColor: "red",
                      borderRadius: 1,
                      transform: [{ rotate: "5deg" }],
                    }}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              {/* 데이터 */}
              <View style={styles.tableRow}>
                <Text style={[styles.cell, styles.yearCell]}>
                  {stat.league?.season}-
                  {String(stat.league?.season + 1).slice(-2)}
                </Text>
                <Text style={styles.cell}>{stat.games?.appearences ?? 0}</Text>
                <Text style={styles.cell}>{stat.goals?.total ?? 0}</Text>
                <Text style={styles.cell}>{stat.goals?.assists ?? 0}</Text>
                <Text style={styles.cell}>{stat.cards?.yellow ?? 0}</Text>
                <Text style={styles.cell}>{stat.cards?.red ?? 0}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
    section: { marginBottom: 8 },
    teamName: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 12,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    leagueName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 12,
    },
    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    headerCell: {
      flex: 1,
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    yearCell: { flex: 1.2, textAlign: "left" },
    cardIcon: { flex: 1, alignItems: "center" },
    divider: { height: 1, backgroundColor: Colors.border, marginBottom: 8 },
    tableRow: { flexDirection: "row", alignItems: "center" },
    cell: { flex: 1, fontSize: 14, color: Colors.text, textAlign: "center" },
  });
