import { useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import BracketMatchModal from "../BracketMatchModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CARD_WIDTH = SCREEN_WIDTH / 2 - 48;
const CARD_HEIGHT = 100;
const CARD_GAP = 16;
const CONNECTOR_WIDTH = 32;
const LABEL_HEIGHT = 40;

const RIGHT_FIRST_MARGIN_TOP = (CARD_HEIGHT + CARD_GAP) / 2;
const RIGHT_CARD_GAP = CARD_HEIGHT + CARD_GAP * 2;

const ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

const SLIDES = [
  ["Round of 32", "Round of 16"],
  ["Round of 16", "Quarter-finals"],
  ["Quarter-finals", "Semi-finals"],
  ["Semi-finals", "Final"],
];

const TABS = ["playoff", "round_of_16", "quarter_final", "finalmatch", "final"];

interface Props {
  match: Match;
}

export default function PlayoffScreen({ match }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<Match[]>([]);

  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();
  const horizontalScrollRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const { data: allMatches = [] } = useQuery<Match[]>({
    queryKey: ["worldcup-bracket", match.league.id],
    queryFn: async () => {
      const res: any = await api.get(
        `${ENDPOINTS.matches}?leagueId=${match.league.id}&season=${match.league.season}&limit=999&allDates=true`,
      );
      return res ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  const { data: allSlots = {} } = useQuery({
    queryKey: ["worldcup-bracket-slots", match.league.id],
    queryFn: async () => {
      const slotsMap: Record<string, any[]> = {};
      await Promise.all(
        ROUND_ORDER.map(async (round) => {
          try {
            const res: any = await api.get(
              `/bracket/slots?leagueId=${match.league.id}&season=${match.league.season}&round=${round}`,
            );

            slotsMap[round] = Array.isArray(res?.slots) ? res.slots : [];
          } catch (e) {
            slotsMap[round] = [];
          }
        }),
      );
      return slotsMap;
    },
    staleTime: 1000 * 60 * 30,
  });

  const roundGroups = useMemo(() => {
    return ROUND_ORDER.reduce(
      (acc, round) => {
        acc[round] = allMatches
          .filter((m) => m.round === round)
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
        return acc;
      },
      {} as Record<string, Match[]>,
    );
  }, [allMatches]);

  const getDateRangeLabel = (round: string) => {
    const matches = roundGroups[round] ?? [];
    if (matches.length === 0) return " ";
    const dates = matches.map((m) => new Date(m.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const fmt = (d: Date) =>
      d.toLocaleDateString(i18n.language, { month: "numeric", day: "numeric" });
    return minDate.toDateString() === maxDate.toDateString()
      ? fmt(minDate)
      : `${fmt(minDate)} | ${fmt(maxDate)}`;
  };

  const changeTab = (idx: number) => {
    horizontalScrollRef.current?.scrollTo({
      x: idx * SCREEN_WIDTH,
      animated: true,
    });
    setActiveSlideIndex(idx);
    tabScrollRef.current?.scrollTo({
      x: idx * 80,
      animated: true,
    });
  };

  const handleHorizontalScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== activeSlideIndex) {
      setActiveSlideIndex(index);
      tabScrollRef.current?.scrollTo({
        x: index * 80,
        animated: true,
      });
    }
  };

  const renderEmptyCard = () => (
    <View style={[styles.matchCard, styles.emptyCard]}>
      <View style={styles.teamRow}>
        <View style={styles.emptyLogo} />
        <Text style={styles.undecided}>TBD</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.teamRow}>
        <View style={styles.emptyLogo} />
        <Text style={styles.undecided}>TBD</Text>
      </View>
    </View>
  );

  const renderSlotCard = (slot: any) => {
    const homeTeam = slot.teams?.[0];
    const awayTeam = slot.teams?.[1];

    return (
      <View style={[styles.matchCard, { opacity: 0.8 }]}>
        <Text style={styles.aggLabel}>예정</Text>
        <View style={styles.teamRow}>
          {homeTeam?.teamLogo ? (
            <Image
              source={{ uri: homeTeam.teamLogo }}
              style={styles.logo}
              contentFit="contain"
            />
          ) : (
            <View style={styles.emptyLogo} />
          )}
          <Text style={styles.teamName} numberOfLines={1}>
            {homeTeam?.teamName || "TBD"}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.teamRow}>
          {awayTeam?.teamLogo ? (
            <Image
              source={{ uri: awayTeam.teamLogo }}
              style={styles.logo}
              contentFit="contain"
            />
          ) : (
            <View style={styles.emptyLogo} />
          )}
          <Text style={styles.teamName} numberOfLines={1}>
            {awayTeam?.teamName || "TBD"}
          </Text>
        </View>
      </View>
    );
  };

  const getWinner = (matches: Match[]) => {
    const agg = getAggregateScore(matches);

    if (agg.home > agg.away) return "home";
    if (agg.away > agg.home) return "away";

    const lastMatch = matches[matches.length - 1];

    // ⭐️ 기준이 마지막 경기로 통일됐으니, 복잡한 if문 다 빼고 바로 페널티 비교!
    if (
      lastMatch.score?.penalty?.home !== null &&
      lastMatch.score?.penalty?.away !== null
    ) {
      const penHome = lastMatch?.score?.penalty?.home ?? 0;
      const penAway = lastMatch?.score?.penalty?.away ?? 0;

      if (penHome > penAway) return "home";
      if (penAway > penHome) return "away";
    }

    return null;
  };

  const renderPairCard = (matches: Match[]) => {
    const first = matches[matches.length - 1];
    const agg = getAggregateScore(matches);
    const showScore = matches.some((m) =>
      ["FT", "AET", "PEN", "1H", "HT", "2H", "ET"].includes(m.status.short),
    );
    const winner = showScore ? getWinner(matches) : null;
    const homeWon = winner === "home";
    const awayWon = winner === "away";
    return (
      <TouchableOpacity
        key={first._id}
        style={[
          styles.matchCard,
          first.apiFootballId === match.apiFootballId
            ? { borderWidth: 1, borderColor: "red" }
            : "",
        ]}
        onPress={() => {
          setSelectedMatches(matches);
          setModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.aggLabel}>누적</Text>
        <View style={styles.teamRow}>
          <Image
            source={first.homeTeam.logo}
            style={styles.logo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.teamName,
              showScore && homeWon && styles.winner,
              showScore && awayWon && styles.loser,
            ]}
            numberOfLines={1}
          >
            {first.homeTeam.name}
          </Text>
          {showScore && (
            <Text style={[styles.score, homeWon && styles.winner]}>
              {agg.home}
            </Text>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.teamRow}>
          <Image
            source={first.awayTeam.logo}
            style={styles.logo}
            contentFit="contain"
          />
          <Text
            style={[
              styles.teamName,
              showScore && awayWon && styles.winner,
              showScore && homeWon && styles.loser,
            ]}
            numberOfLines={1}
          >
            {first.awayTeam.name}
          </Text>
          {showScore && (
            <Text style={[styles.score, awayWon && styles.winner]}>
              {agg.away}
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
      const topY = 2 * i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      const bottomY = (2 * i + 1) * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
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

  const renderStraightConnectors = (count: number) => {
    const svgHeight = count * CARD_HEIGHT + (count - 1) * CARD_GAP;
    const paths: string[] = [];
    for (let i = 0; i < count; i++) {
      const y = i * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      paths.push(`M 0 ${y} H ${CONNECTOR_WIDTH}`);
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

  const groupByTeamPair = (matches: Match[]) => {
    const pairs = new Map<string, Match[]>();

    matches.forEach((m) => {
      const id1 = Math.min(m.homeTeam.id, m.awayTeam.id);
      const id2 = Math.max(m.homeTeam.id, m.awayTeam.id);
      const key = `${id1}-${id2}`;

      if (!pairs.has(key)) {
        pairs.set(key, []);
      }
      pairs.get(key)!.push(m);
    });

    return Array.from(pairs.values()).map((pair) =>
      pair.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    );
  };

  const getAggregateScore = (matches: Match[]) => {
    if (matches.length === 0) return { home: 0, away: 0 };

    // ⭐️ 화면에 보여주는 마지막 경기(lastMatch)의 홈팀 ID를 기준으로 통일!
    const baseHomeId = matches[matches.length - 1].homeTeam.id;
    let home = 0;
    let away = 0;

    matches.forEach((m) => {
      if (m.homeTeam.id === baseHomeId) {
        home += m.goals.home ?? 0;
        away += m.goals.away ?? 0;
      } else {
        home += m.goals.away ?? 0;
        away += m.goals.home ?? 0;
      }
    });

    return { home, away };
  };

  const renderSlide = (item: string[]) => {
    const [leftRound, rightRound] = item;

    const leftMatches = roundGroups[leftRound] ?? [];
    const rightMatches = roundGroups[rightRound] ?? [];
    const leftPairs = groupByTeamPair(leftMatches);
    const rightPairs = groupByTeamPair(rightMatches);

    const leftSlots = allSlots[leftRound] ?? [];
    const rightSlots = allSlots[rightRound] ?? [];

    const leftCount = getExpectedCount(leftRound);
    const rightCount = getExpectedCount(rightRound);
    const leftDateLabel = getDateRangeLabel(leftRound);
    const rightDateLabel = getDateRangeLabel(rightRound);

    const isPlayoffSlide = leftRound === "Round of 32";

    const getCardContent = (idx: number, pairs: Match[][], slots: any[]) => {
      const slot = slots.find((s) => s.slotIndex === idx);

      if (slot && slot.teams?.length >= 2) {
        const team1Id = slot.teams[0].teamId;
        const team2Id = slot.teams[1].teamId;

        const actualPair = pairs.find((pair) => {
          const m = pair[0];
          const matchTeamIds = [m.homeTeam.id, m.awayTeam.id];
          return (
            matchTeamIds.includes(team1Id) && matchTeamIds.includes(team2Id)
          );
        });

        return actualPair ? renderPairCard(actualPair) : renderSlotCard(slot);
      }

      if (pairs[idx]) {
        return renderPairCard(pairs[idx]);
      }

      return renderEmptyCard();
    };

    return (
      <ScrollView
        style={{ width: SCREEN_WIDTH }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.slideContent}
        nestedScrollEnabled={true}
      >
        <View style={styles.dateHeaderRow}>
          <View style={{ width: CARD_WIDTH }}>
            <Text style={styles.dateHeader}>{leftDateLabel || " "}</Text>
          </View>
          <View style={{ width: CONNECTOR_WIDTH }} />
          <View style={{ width: CARD_WIDTH }}>
            <Text style={styles.dateHeader}>{rightDateLabel || " "}</Text>
          </View>
        </View>

        <View style={styles.slideRow}>
          {/* 왼쪽 컬럼 */}
          <View style={styles.column}>
            {Array.from({ length: leftCount }).map((_, idx) => (
              <View
                key={idx}
                style={{ marginBottom: idx < leftCount - 1 ? CARD_GAP : 0 }}
              >
                {getCardContent(idx, leftPairs, leftSlots)}
              </View>
            ))}
          </View>

          <View style={styles.connectorWrapper}>
            {isPlayoffSlide
              ? renderStraightConnectors(leftCount)
              : renderConnectors(leftCount)}
          </View>

          {/* 오른쪽 컬럼 */}
          <View style={styles.column}>
            {Array.from({ length: rightCount }).map((_, idx) => (
              <View
                key={idx}
                style={{
                  marginTop: isPlayoffSlide
                    ? 0
                    : idx === 0
                      ? RIGHT_FIRST_MARGIN_TOP
                      : 0,
                  marginBottom: isPlayoffSlide
                    ? idx < rightCount - 1
                      ? CARD_GAP
                      : 0
                    : idx < rightCount - 1
                      ? RIGHT_CARD_GAP
                      : 0,
                }}
              >
                {getCardContent(idx, rightPairs, rightSlots)}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBarContainer}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {TABS.map((tab, idx) => (
            <Pressable
              key={tab}
              onPress={() => changeTab(idx)}
              style={[
                styles.tabItem,
                activeSlideIndex === idx && styles.activeTabItem,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeSlideIndex === idx && styles.activeTabText,
                ]}
              >
                {t(tab)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleHorizontalScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((item, idx) => (
          <View key={idx}>{renderSlide(item)}</View>
        ))}
      </ScrollView>

      {selectedMatches.length > 0 && (
        <BracketMatchModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          matches={selectedMatches}
        />
      )}
    </View>
  );
}

const getExpectedCount = (round: string) => {
  switch (round) {
    case "Round of 32":
      return 8;
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
    container: { flex: 1, backgroundColor: Colors.background },
    tabBarContainer: {
      backgroundColor: Colors.surface,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    tabScroll: { paddingHorizontal: 16, gap: 10 },
    tabItem: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: Colors.background,
    },
    activeTabItem: { backgroundColor: Colors.text },
    tabText: { fontSize: 14, color: Colors.textSecondary },
    activeTabText: { color: Colors.background, fontWeight: "700" },
    slideContent: { padding: 16, paddingBottom: 60 },
    dateHeaderRow: {
      flexDirection: "row",
      marginBottom: 12,
    },
    dateHeader: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    slideRow: { flexDirection: "row", alignItems: "flex-start" },
    column: { width: CARD_WIDTH },
    connectorWrapper: {
      width: CONNECTOR_WIDTH,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    matchCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      justifyContent: "center",
      gap: 2,
    },
    emptyCard: { opacity: 0.4 },
    aggLabel: {
      fontSize: 10,
      color: Colors.textSecondary,
      marginBottom: 2,
    },
    dateLabel: {
      fontSize: 11,
      color: Colors.textSecondary,
      marginBottom: 2,
    },
    teamRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    logo: { width: 20, height: 20 },
    emptyLogo: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: Colors.border,
    },
    teamName: { flex: 1, fontSize: 12, color: Colors.text, width: 30 },
    winner: { fontWeight: "700" },
    loser: { textDecorationLine: "line-through", opacity: 0.5 },
    score: { fontSize: 13, fontWeight: "700", color: Colors.text },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
    undecided: { fontSize: 12, color: Colors.textSecondary },
  });
