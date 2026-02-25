import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  match: Match;
}

const POSITION_MAP: Record<string, string> = {
  G: "GK",
  D: "DF",
  M: "MF",
  F: "FW",
};

export default function LineupTab({ match }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const lineup = match.lineups;

  if (!lineup || (!lineup.home && !lineup.away)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("lineup.notAvailable")}</Text>
      </View>
    );
  }

  const homeLineup = lineup.home;
  const awayLineup = lineup.away;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 포메이션 헤더 */}
      <View style={styles.formationHeader}>
        <View style={styles.teamHeader}>
          <Image
            source={match.homeTeam.logo}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <Text style={styles.headerTeamName} numberOfLines={1}>
            {match.homeTeam.name}
          </Text>
          <Text style={styles.headerFormation}>
            {homeLineup?.formation || "4-3-3"}
          </Text>
        </View>

        <View style={[styles.teamHeader, { justifyContent: "flex-end" }]}>
          <Text style={styles.headerFormation}>
            {awayLineup?.formation || "4-3-3"}
          </Text>
          <Text
            style={[styles.headerTeamName, { textAlign: "right" }]}
            numberOfLines={1}
          >
            {match.awayTeam.name}
          </Text>
          <Image
            source={match.awayTeam.logo}
            style={styles.headerLogo}
            contentFit="contain"
          />
        </View>
      </View>

      {/* 피치 */}
      <View style={styles.pitch}>
        {/* 원정팀 (위) */}
        {awayLineup ? (
          <FieldHalf teamLineup={awayLineup} isHome={false} />
        ) : (
          <HalfPlaceholder label={t("lineup.awayMissing")} />
        )}

        {/* 중앙선 */}
        <View style={styles.centerLine} />

        {/* 홈팀 (아래) */}
        {homeLineup ? (
          <FieldHalf teamLineup={homeLineup} isHome={true} />
        ) : (
          <HalfPlaceholder label={t("lineup.homeMissing")} />
        )}
      </View>

      {/* 후보 선수 */}
      <SubstitutesSection
        match={match}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
      />

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

/**
 * 사진처럼 "서로 마주보는" 배치 핵심:
 * - 위(원정): GK(맨위) -> DF -> MF -> FW(센터라인 쪽)
 * - 아래(홈): FW(센터라인 쪽) -> MF -> DF -> GK(맨아래)
 */
function FieldHalf({
  teamLineup,
  isHome,
}: {
  teamLineup: any;
  isHome: boolean;
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  const formation = (teamLineup.formation || "4-3-3").trim();
  const rows = formation.split("-").map((n: string) => Number(n));
  const players = teamLineup.startXI || [];

  const gk = players[0];
  let playerIndex = 1;

  // formationRows는 항상 [DF], [MF], [FW] 순서로 만든다
  const formationRows = rows.map((count: number) => {
    const rowPlayers = players.slice(playerIndex, playerIndex + count);
    playerIndex += count;
    return rowPlayers;
  });

  // ✅ 홈(아래)은 센터라인 쪽이 "윗부분"이라 공격부터 보여야 함
  const orderedRows = isHome ? [...formationRows].reverse() : formationRows;

  return (
    <View style={styles.fieldHalf}>
      {/* 원정(위): GK 먼저 */}
      {!isHome && (
        <View style={styles.fieldRow}>
          <PlayerCircle player={gk} isGK />
        </View>
      )}

      {/* 라인들 */}
      {orderedRows.map((row: any[], i: number) => (
        <View key={i} style={styles.fieldRow}>
          {row.map((player: any, j: number) => (
            <PlayerCircle key={`${i}-${j}`} player={player} />
          ))}
        </View>
      ))}

      {/* 홈(아래): GK 마지막 */}
      {isHome && (
        <View style={styles.fieldRow}>
          <PlayerCircle player={gk} isGK />
        </View>
      )}
    </View>
  );
}

function PlayerCircle({
  player,
  isGK = false,
}: {
  player: any;
  isGK?: boolean;
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const lastName = player?.playerName?.split(" ").slice(-1)[0] || "Unknown";
  const initial = player?.playerName?.charAt(0) || "?";

  return (
    <View style={styles.playerSpot}>
      {player?.photo ? (
        <Image
          source={player.photo}
          style={[styles.playerPhoto, isGK && styles.gkPhoto]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.playerPhotoPlaceholder,
            isGK && styles.gkPhotoPlaceholder,
          ]}
        >
          <Text style={styles.playerPhotoText}>{initial}</Text>
        </View>
      )}
      <Text style={styles.playerName} numberOfLines={1}>
        {lastName}
      </Text>
    </View>
  );
}

function SubstitutesSection({
  match,
  homeLineup,
  awayLineup,
}: {
  match: Match;
  homeLineup: any;
  awayLineup: any;
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const homeSubs = homeLineup?.substitutes || [];
  const awaySubs = awayLineup?.substitutes || [];
  const maxLen = Math.max(homeSubs.length, awaySubs.length);

  return (
    <View style={styles.subsContainer}>
      <View style={styles.subsHeader}>
        <Image
          source={match.homeTeam.logo}
          style={styles.subsHeaderLogo}
          contentFit="contain"
        />
        <Text style={styles.subsTitle}>{t("lineup.substitutes")}</Text>
        <Image
          source={match.awayTeam.logo}
          style={styles.subsHeaderLogo}
          contentFit="contain"
        />
      </View>

      {Array.from({ length: maxLen }).map((_, i) => {
        const homePlayer = homeSubs[i];
        const awayPlayer = awaySubs[i];

        return (
          <View key={i} style={styles.subRow}>
            {homePlayer ? (
              <SubPlayerCard player={homePlayer} />
            ) : (
              <View style={styles.subPlayerCard} />
            )}
            {awayPlayer ? (
              <SubPlayerCard player={awayPlayer} isRight />
            ) : (
              <View style={styles.subPlayerCard} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function SubPlayerCard({
  player,
  isRight = false,
}: {
  player: any;
  isRight?: boolean;
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const lastName =
    player?.playerName?.split(" ").slice(-1)[0] || t("lineup.unknown");

  return (
    <View style={[styles.subPlayerCard, isRight && styles.subPlayerCardRight]}>
      <View style={styles.subPhotoContainer}>
        {player?.photo ? (
          <Image
            source={player.photo}
            style={styles.subPhoto}
            contentFit="cover"
          />
        ) : (
          <View style={styles.subPhotoPlaceholder}>
            <Text style={styles.subPhotoPlaceholderText}>
              {player?.playerName?.charAt(0) || "?"}
            </Text>
          </View>
        )}

        <View style={styles.subArrow}>
          <Ionicons name="arrow-up" size={8} color="#fff" />
        </View>
      </View>

      <View style={[styles.subInfo, isRight && { alignItems: "flex-end" }]}>
        <Text style={styles.subName} numberOfLines={1}>
          {lastName}
        </Text>
        <Text style={styles.subDetail}>
          {POSITION_MAP[player?.pos] || player?.pos || "-"} #
          {player?.number ?? "-"}
        </Text>
      </View>
    </View>
  );
}

function HalfPlaceholder({ label }: { label: string }) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  return (
    <View
      style={[
        styles.fieldHalf,
        { justifyContent: "center", alignItems: "center" },
      ]}
    >
      <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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

    formationHeader: {
      flexDirection: "row",
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: 10,
    },
    teamHeader: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerLogo: {
      width: 24,
      height: 24,
    },
    headerTeamName: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
      flex: 1,
    },
    headerFormation: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.primary,
    },

    pitch: {
      margin: 12,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#2d8a4e",
    },
    centerLine: {
      height: 2,
      backgroundColor: "rgba(255,255,255,0.5)",
    },

    fieldHalf: {
      paddingHorizontal: 14,
      paddingVertical: 16,
      gap: 18,
    },
    fieldRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },

    playerSpot: {
      alignItems: "center",
      gap: 6,
      flex: 1,
      maxWidth: 80,
    },
    playerPhoto: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      borderColor: "#ffffff",
      backgroundColor: Colors.border,
    },
    gkPhoto: {
      borderColor: "#ffd700",
    },
    playerPhotoPlaceholder: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 3,
      borderColor: "#ffffff",
      backgroundColor: "rgba(255,255,255,0.3)",
      alignItems: "center",
      justifyContent: "center",
    },
    gkPhotoPlaceholder: {
      borderColor: "#ffd700",
      backgroundColor: "rgba(255,215,0,0.3)",
    },
    playerPhotoText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
    },
    playerName: {
      fontSize: 11,
      color: "#ffffff",
      textAlign: "center",
      fontWeight: "700",
      textShadowColor: "rgba(0,0,0,0.75)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },

    subsContainer: {
      backgroundColor: Colors.surface,
      margin: 12,
      borderRadius: 12,
      overflow: "hidden",
    },
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
    subsTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
    },

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
      minHeight: 64,
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
      borderWidth: 2,
      borderColor: "#fff",
    },
    subPhotoPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    subPhotoPlaceholderText: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.textSecondary,
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
    subInfo: {
      flex: 1,
      gap: 2,
    },
    subName: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    subDetail: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
  });
