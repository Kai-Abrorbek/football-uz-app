import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import { Match } from "../../../types";

interface Props {
  matches: Match[];
}

const CARD_WIDTH = 180;
const CARD_HEIGHT = 72;
const CARD_GAP = 12; // 같은 쌍 내 두 카드 간격
const PAIR_GAP = 32; // 쌍과 쌍 사이 간격
const COLUMN_GAP = 60; // 컬럼 사이 연결선 공간

// 2022는 Round of 16부터, 2026은 Round of 32부터
const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

const ROUND_LABELS: Record<string, string> = {
  "Round of 32": "worldcup.bracket.roundOf32",
  "Round of 16": "worldcup.bracket.roundOf16",
  "Quarter-finals": "worldcup.bracket.quarterFinals",
  "Semi-finals": "worldcup.bracket.semiFinals",
  Final: "worldcup.bracket.final",
};

// 한 쌍(pair) 높이 계산
const PAIR_HEIGHT = CARD_HEIGHT * 2 + CARD_GAP;

// n번째 라운드에서 쌍의 총 높이 (간격 포함)
const getPairTotalHeight = (roundIndex: number): number => {
  if (roundIndex === 0) return PAIR_HEIGHT + PAIR_GAP;
  // 다음 라운드는 이전 라운드 2쌍이 1쌍으로 합쳐짐
  return getPairTotalHeight(roundIndex - 1) * 2;
};

// n번째 라운드에서 카드의 Y 중심 오프셋
const getCardCenterY = (
  roundIndex: number,
  pairIndex: number,
  isSecond: boolean,
): number => {
  const pairTotalHeight = getPairTotalHeight(roundIndex);
  const pairStartY = pairIndex * pairTotalHeight;
  const cardOffset = isSecond ? CARD_HEIGHT + CARD_GAP : 0;
  return pairStartY + cardOffset + CARD_HEIGHT / 2;
};

export default function WorldcupBracketTab({ matches }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  // 라운드별 그룹핑
  const roundGroups = useMemo(() => {
    return ROUND_ORDER.reduce(
      (acc, round) => {
        acc[round] = matches
          .filter((m) => m.round === round)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [matches]);

  // 유효한 라운드만 (데이터 있거나 다음 라운드 위해 빈 슬롯 필요한 것)
  const activeRounds = useMemo(() => {
    return ROUND_ORDER.filter((round, idx) => {
      // 데이터 있으면 무조건 포함
      if (roundGroups[round]?.length > 0) return true;
      // 이전 라운드 데이터 있으면 다음 라운드 빈 슬롯 보여줌
      if (idx > 0 && roundGroups[ROUND_ORDER[idx - 1]]?.length > 0) return true;
      return false;
    });
  }, [roundGroups]);

  // 미정 카드
  const renderEmptyCard = useCallback(
    () => (
      <View style={[styles.matchCard, styles.emptyCard]}>
        <View style={styles.teamRow}>
          <View style={styles.emptyLogo} />
          <Text style={styles.undecided}>
            {t("worldcup.bracket.undecided")}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.teamRow}>
          <View style={styles.emptyLogo} />
          <Text style={styles.undecided}>
            {t("worldcup.bracket.undecided")}
          </Text>
        </View>
      </View>
    ),
    [t, styles],
  );

  // 경기 카드
  const renderMatchCard = useCallback(
    (match: Match) => {
      const isFinished = match.status.short === "FT";
      const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
      const homeWon = (match.goals.home ?? 0) > (match.goals.away ?? 0);
      const awayWon = (match.goals.away ?? 0) > (match.goals.home ?? 0);

      return (
        <TouchableOpacity
          key={match._id}
          style={styles.matchCard}
          onPress={() => router.push(`/match/${match._id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.teamRow}>
            <Image
              source={match.homeTeam.logo}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[styles.teamName, homeWon && styles.winner]}
              numberOfLines={1}
            >
              {match.homeTeam.name}
            </Text>
            {(isFinished || isLive) && (
              <Text style={[styles.score, homeWon && styles.winner]}>
                {match.goals.home}
              </Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.teamRow}>
            <Image
              source={match.awayTeam.logo}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[styles.teamName, awayWon && styles.winner]}
              numberOfLines={1}
            >
              {match.awayTeam.name}
            </Text>
            {(isFinished || isLive) && (
              <Text style={[styles.score, awayWon && styles.winner]}>
                {match.goals.away}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [styles],
  );

  // SVG 연결선 렌더링
  const renderConnectors = useCallback(
    (roundIndex: number, pairCount: number) => {
      const svgWidth = COLUMN_GAP;
      const svgHeight = getPairTotalHeight(roundIndex) * pairCount;
      const nextPairTotalHeight = getPairTotalHeight(roundIndex + 1);
      const color = Colors.border;

      const paths: string[] = [];

      for (let pairIdx = 0; pairIdx < pairCount; pairIdx += 2) {
        // 첫 번째 쌍 중심 Y
        const topPairMidY =
          getCardCenterY(roundIndex, pairIdx, false) / 2 +
          getCardCenterY(roundIndex, pairIdx, true) / 2;

        // 두 번째 쌍 중심 Y
        const bottomPairMidY =
          getCardCenterY(roundIndex, pairIdx + 1, false) / 2 +
          getCardCenterY(roundIndex, pairIdx + 1, true) / 2;

        // 다음 라운드 카드 Y (두 쌍의 중간)
        const nextCardY = (topPairMidY + bottomPairMidY) / 2;
        const midX = svgWidth / 2;

        // 위 쌍 → 중간
        paths.push(`M 0 ${topPairMidY} H ${midX} V ${nextCardY} H ${svgWidth}`);
        // 아래 쌍 → 중간
        paths.push(`M 0 ${bottomPairMidY} H ${midX} V ${nextCardY}`);
      }

      return (
        <Svg width={svgWidth} height={svgHeight} style={styles.connector}>
          {paths.map((d, i) => (
            <Path key={i} d={d} stroke={color} strokeWidth={1.5} fill="none" />
          ))}
        </Svg>
      );
    },
    [Colors.border, styles],
  );

  // 컬럼 렌더링
  const renderColumn = useCallback(
    (round: string, roundIndex: number) => {
      const roundMatches = roundGroups[round] ?? [];
      const globalRoundIndex = ROUND_ORDER.indexOf(round);

      // 이 라운드에서 필요한 쌍 개수
      // Round of 32 → 16쌍, Round of 16 → 8쌍, ...
      const firstActiveRound = activeRounds[0];
      const firstGlobalIndex = ROUND_ORDER.indexOf(firstActiveRound);
      const relativeIndex = globalRoundIndex - firstGlobalIndex;

      const pairCount = Math.max(
        1,
        Math.pow(2, activeRounds.length - 1 - roundIndex),
      );

      const pairs: (Match | null)[][] = [];
      for (let i = 0; i < pairCount; i++) {
        pairs.push([
          roundMatches[i * 2] ?? null,
          roundMatches[i * 2 + 1] ?? null,
        ]);
      }

      return (
        <View key={round} style={styles.columnWrapper}>
          {/* 라운드 헤더 */}
          <Text style={styles.roundLabel}>{t(ROUND_LABELS[round])}</Text>

          {/* 카드 컬럼 + 연결선 */}
          <View style={styles.columnContent}>
            <View style={styles.cardsColumn}>
              {pairs.map((pair, pairIdx) => (
                <View
                  key={pairIdx}
                  style={[
                    styles.pair,
                    {
                      marginBottom:
                        pairIdx < pairs.length - 1
                          ? getPairTotalHeight(relativeIndex) - PAIR_HEIGHT
                          : 0,
                    },
                  ]}
                >
                  {pair[0] ? renderMatchCard(pair[0]) : renderEmptyCard()}
                  <View style={{ height: CARD_GAP }} />
                  {pair[1] ? renderMatchCard(pair[1]) : renderEmptyCard()}
                </View>
              ))}
            </View>

            {/* 다음 라운드가 있으면 연결선 */}
            {roundIndex < activeRounds.length - 1 &&
              renderConnectors(relativeIndex, pairCount)}
          </View>
        </View>
      );
    },
    [
      roundGroups,
      activeRounds,
      renderMatchCard,
      renderEmptyCard,
      renderConnectors,
      t,
      styles,
    ],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentContainerStyle={styles.innerContent}
      >
        <View style={styles.bracket}>
          {activeRounds.map((round, idx) => renderColumn(round, idx))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    innerContent: { padding: 16, paddingBottom: 40 },
    bracket: { flexDirection: "row", alignItems: "flex-start" },
    columnWrapper: { flexDirection: "column" },
    roundLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 12,
      textAlign: "center",
      width: CARD_WIDTH,
    },
    columnContent: { flexDirection: "row" },
    cardsColumn: { width: CARD_WIDTH },
    pair: { flexDirection: "column" },
    connector: { marginTop: 28 }, // roundLabel 높이만큼 내려줌
    matchCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: Colors.surface,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      justifyContent: "center",
    },
    emptyCard: { opacity: 0.5 },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    logo: { width: 18, height: 18 },
    emptyLogo: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: Colors.border,
    },
    teamName: { flex: 1, fontSize: 12, color: Colors.textSecondary },
    winner: { color: Colors.text, fontWeight: "700" },
    score: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.textSecondary,
      minWidth: 16,
      textAlign: "right",
    },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 5 },
    undecided: { fontSize: 12, color: Colors.textSecondary },
  });
