import { useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import {
  ENDPOINTS,
  WORLDCUP_LEAGUE_ID,
  WORLDCUP_SEASON,
} from "../../../constants/api";

export default function WorldcupStandingsTab() {
  const [scrolledGroups, setScrolledGroups] = useState<Record<string, boolean>>(
    {},
  );
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["worldcup-standings"],
    queryFn: async () => {
      const res: any = await api.get(
        ENDPOINTS.leagueStandings(WORLDCUP_LEAGUE_ID),
      );
      return res;
    },
    staleTime: 1000 * 60 * 30,
  });

  // standings는 2차원 배열 [[GroupA팀들], [GroupB팀들], ...]
  const groups: any[][] = data?.standings ?? [];

  if (isLoading) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {groups.map((group, groupIdx) => {
        const groupName = group[0]?.group ?? `Group ${groupIdx + 1}`;
        return (
          // 그룹 하나의 구조
          <View style={styles.groupSection} key={groupIdx}>
            <Text style={styles.groupTitle}>{groupName}</Text>

            <View style={styles.tableContainer}>
              {/* 왼쪽 고정 컬럼 */}
              <View
                style={[
                  styles.leftColumn,
                  scrolledGroups[groupName] && styles.leftColumnBorder,
                ]}
              >
                {/* 헤더 */}
                <View style={styles.headerRow}>
                  <Text style={styles.headerCell}></Text>
                  <Text style={styles.headerCell}></Text>
                  <Text style={[styles.headerCell, styles.teamHeaderCell]}>
                    {t("worldcup.standings.team")}
                  </Text>
                </View>
                {/* 팀 행들 */}
                {group.map((item, index) => (
                  <View
                    key={item.team.id}
                    style={[styles.leftRow, index < 2 && styles.topTeam]}
                  >
                    <Text style={styles.rank}>{item.rank}</Text>
                    <Image
                      source={item.team.logo}
                      style={styles.logo}
                      contentFit="contain"
                    />
                    <Text style={styles.teamName} numberOfLines={1}>
                      {item.team.name}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 오른쪽 스크롤 컬럼 - 헤더 + 데이터 통째로 */}
              <ScrollView
                onScroll={(e) =>
                  setScrolledGroups((prev) => ({
                    ...prev,
                    [groupName]: e.nativeEvent.contentOffset.x > 0,
                  }))
                }
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.rightScroll}
                scrollEventThrottle={16}
              >
                <View>
                  {/* 헤더 */}
                  <View style={styles.statsHeaderRow}>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.played")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.win")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.draw")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.lose")}
                    </Text>
                    <Text style={[styles.headerCell, styles.points]}>
                      {t("worldcup.standings.points")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.gf")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.ga")}
                    </Text>
                    <Text style={styles.headerCell}>
                      {t("worldcup.standings.gd")}
                    </Text>
                  </View>
                  {/* 데이터 행들 */}
                  {group.map((item, index) => (
                    <View key={item.team.id} style={styles.statsRow}>
                      <Text style={styles.statCell}>{item?.played}</Text>
                      <Text style={styles.statCell}>{item?.win}</Text>
                      <Text style={styles.statCell}>{item?.draw}</Text>
                      <Text style={styles.statCell}>{item?.lose}</Text>
                      <Text style={[styles.statCell, styles.points]}>
                        {item.points}
                      </Text>
                      <Text style={styles.statCell}>{item?.goalsFor}</Text>
                      <Text style={styles.statCell}>{item?.goalsAgainst}</Text>
                      <Text style={styles.statCell}>
                        {item.goalsDiff > 0
                          ? `+${item.goalsDiff}`
                          : item.goalsDiff}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        );
      })}

      <View
        style={{
          flex: 1,
          backgroundColor: "#eceaea",
          borderColor: "#d2d1d1",
          borderWidth: 1,
          padding: 10,
          margin: 15,
          borderRadius: 10,
          gap: 15,
        }}
      >
        <Text style={{ color: Colors.text, fontWeight: "600" }}>
          {t("worldcup.qualifier")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Text
            style={{ width: 15, height: 15, backgroundColor: "blue" }}
          ></Text>
          <Text>{t("worldcup.playoff")}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const STAT_CELL_WIDTH = 36;
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 32;
const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    groupSection: { marginTop: 16 },
    groupTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    leftFixed: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      width: 160,
    },
    teamHeaderCell: { flex: 1 },
    headerCell: {
      width: STAT_CELL_WIDTH,
      fontSize: 11,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    topTeam: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
    rank: {
      width: 24,
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    logo: { width: 24, height: 24 },
    teamName: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: "500" },
    statCell: {
      width: STAT_CELL_WIDTH,
      fontSize: 13,
      color: Colors.text,
      textAlign: "center",
    },
    points: { fontWeight: "700" },
    groupDivider: { height: 8, backgroundColor: Colors.background },
    tableContainer: { flexDirection: "row" },
    leftColumn: { width: 160 },
    leftColumnBorder: {
      borderRightWidth: 1,
      borderRightColor: Colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
    },
    headerRow: {
      height: HEADER_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    leftRow: {
      height: ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    statsHeaderRow: {
      height: HEADER_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    statsRow: {
      height: ROW_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    rightScroll: { flex: 1 },
  });
