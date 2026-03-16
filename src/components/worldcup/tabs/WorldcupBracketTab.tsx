import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import { Match } from "../../../types";
import {
  ENDPOINTS,
  WORLDCUP_LEAGUE_ID,
  WORLDCUP_SEASON,
} from "../../../constants/api";
import api from "../../../services/api";
import { useQuery } from "@tanstack/react-query";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH / 2 - 48;
const CARD_HEIGHT = 80;
const CARD_GAP = 16; // 카드 간격
const CONNECTOR_WIDTH = 32; // 연결선 너비
const LABEL_HEIGHT = 40; // 라운드 텍스트 영역 고정 높이 (선 핀트가 어긋나지 않게 고정)

// 오른쪽 컬럼(승자) 카드가 왼쪽 두 카드의 정중앙에 오기 위한 간격 계산
const RIGHT_FIRST_MARGIN_TOP = (CARD_HEIGHT + CARD_GAP) / 2;
const RIGHT_CARD_GAP = CARD_HEIGHT + CARD_GAP * 2;

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

const SLIDES = [
  ["Round of 32", "Round of 16"],
  ["Round of 16", "Quarter-finals"],
  ["Quarter-finals", "Semi-finals"],
  ["Semi-finals", "Final"],
];

export default function WorldcupBracketTab() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["worldcup-ROUND_ORDER"],
    queryFn: async () => {
      const res: any = await api.get(
        `${ENDPOINTS.matches}?leagueId=${WORLDCUP_LEAGUE_ID}&season=${WORLDCUP_SEASON}&limit=999`,
      );
      return res ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

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

  const activeSlides = useMemo(() => {
    return SLIDES.filter(
      ([left, right]) =>
        roundGroups[left]?.length > 0 || roundGroups[right]?.length > 0,
    );
  }, [roundGroups]);

  const renderEmptyCard = () => (
    <View style={[styles.matchCard, styles.emptyCard]}>
      <Text style={styles.dateText}>-</Text>
      <View style={styles.teamRow}>
        <View style={styles.emptyLogo} />
        <Text style={styles.undecided}>{t("worldcup.bracket.undecided")}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.teamRow}>
        <View style={styles.emptyLogo} />
        <Text style={styles.undecided}>{t("worldcup.bracket.undecided")}</Text>
      </View>
    </View>
  );

  const renderMatchCard = (match: Match) => {
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
        <Text style={styles.dateText}>
          {new Date(match.date).toLocaleDateString(i18n.language, {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
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
  };

  const renderConnectors = (leftCount: number) => {
    const pairCount = Math.floor(leftCount / 2);
    const svgHeight = leftCount * CARD_HEIGHT + (leftCount - 1) * CARD_GAP;
    const paths: string[] = [];

    for (let i = 0; i < pairCount; i++) {
      // 왼쪽 위 카드 중심점
      const topY = 2 * i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      // 왼쪽 아래 카드 중심점
      const bottomY = (2 * i + 1) * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      // 오른쪽 승자 카드 중심점
      const midY = (topY + bottomY) / 2;
      const midX = CONNECTOR_WIDTH / 2;

      paths.push(`M 0 ${topY} H ${midX} V ${midY} H ${CONNECTOR_WIDTH}`);
      paths.push(`M 0 ${bottomY} H ${midX} V ${midY}`);
    }

    return (
      <Svg width={CONNECTOR_WIDTH} height={svgHeight}>
        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={Colors.border}
            strokeWidth={1.5}
            fill="none"
          />
        ))}
      </Svg>
    );
  };

  const renderSlide = ({ item, idx }: { item: string[]; idx: number }) => {
    const [leftRound, rightRound] = item;
    const leftMatches = roundGroups[leftRound] ?? [];
    const rightMatches = roundGroups[rightRound] ?? [];

    const leftCount = leftMatches.length || getExpectedCount(leftRound);
    const rightCount = Math.ceil(leftCount / 2);

    return (
      <ScrollView
        style={{ width: SCREEN_WIDTH }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.slideContent}
        nestedScrollEnabled={true}
      >
        <View style={styles.slideRow}>
          {/* 왼쪽 컬럼 */}
          <View style={styles.column}>
            <View style={styles.labelContainer}>
              <Text style={styles.roundLabel}>
                {t(ROUND_LABELS[leftRound])}
              </Text>
            </View>
            {Array.from({ length: leftCount }).map((_, idx) => (
              <View
                key={idx}
                style={{ marginBottom: idx < leftCount - 1 ? CARD_GAP : 0 }}
              >
                {leftMatches[idx]
                  ? renderMatchCard(leftMatches[idx])
                  : renderEmptyCard()}
              </View>
            ))}
          </View>

          {/* 연결선 */}
          <View style={styles.connectorWrapper}>
            <View style={{ height: LABEL_HEIGHT }} />
            {renderConnectors(leftCount)}
          </View>

          {/* 오른쪽 컬럼 */}
          <View style={styles.column}>
            <View style={styles.labelContainer}>
              <Text style={styles.roundLabel}>
                {t(ROUND_LABELS[rightRound])}
              </Text>
            </View>
            {Array.from({ length: rightCount }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  marginTop: idx === 0 ? RIGHT_FIRST_MARGIN_TOP : 0,
                  marginBottom: idx < rightCount - 1 ? RIGHT_CARD_GAP : 0,
                }}
              >
                {rightMatches[idx]
                  ? renderMatchCard(rightMatches[idx])
                  : renderEmptyCard()}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {(activeSlides.length > 0 ? activeSlides : SLIDES).map((item, idx) => (
        <View key={idx.toString()}>{renderSlide({ item, idx })}</View>
      ))}
    </ScrollView>
  );
}

// 라운드별 예상 '경기 수' (팀 수가 아님)
const getExpectedCount = (round: string) => {
  switch (round) {
    case "Round of 32":
      return 16;
    case "Round of 16":
      return 8;
    case "Quarter-finals":
      return 4;
    case "Semi-finals":
      return 2;
    case "Final":
      return 1;
    default:
      return 1;
  }
};

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    slideContent: { padding: 16, paddingBottom: 40 },
    slideRow: { flexDirection: "row" },
    column: { width: CARD_WIDTH },
    labelContainer: {
      height: LABEL_HEIGHT,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    roundLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
      textAlign: "center",
    },
    connectorWrapper: {
      width: CONNECTOR_WIDTH,
      alignItems: "center",
      paddingBottom: 8, // 라벨 아래 마진과 맞춤
    },
    matchCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT, // 높이 고정 필수
      backgroundColor: Colors.surface2,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: Colors.text,
      justifyContent: "center", // 내부 수직 정렬
    },
    emptyCard: { opacity: 0.4 },
    dateText: { fontSize: 11, color: Colors.text, marginBottom: 6 },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    logo: { width: 18, height: 18 },
    emptyLogo: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: Colors.text,
    },
    teamName: { flex: 1, fontSize: 12, color: Colors.text },
    winner: { color: Colors.text, fontWeight: "700" },
    score: { fontSize: 13, fontWeight: "700", color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
    undecided: { fontSize: 12, color: Colors.text },
  });
