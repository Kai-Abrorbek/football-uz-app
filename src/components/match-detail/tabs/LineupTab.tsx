import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import Svg, { Rect, Circle, Line, Path } from "react-native-svg";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { Match } from "../../../types";
import {
  buildPlayerEventsMap,
  PlayerEvents,
} from "../../../utils/lineupEvents";
import { nationalityToFlagUrl } from "../../../utils/flag";
import FixtureAbsenceSectionMock from "../FixtureAbsenceSectionMock";

type LineupTab = "stats" | "age" | "country" | null;

const POSITION_MAP: Record<string, string> = {
  G: "GK",
  D: "DF",
  M: "MF",
  F: "FW",
};

// 이름 포맷 함수 (예: Abdukodir Khusanov -> A. Khusanov)
const formatName = (fullName?: string) => {
  if (!fullName) return "Unknown";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const initial = parts[0].charAt(0).toUpperCase();
  const lastName = parts.slice(1).join(" ");
  return `${initial}. ${lastName}`;
};

interface Props {
  match: Match;
}

export default function LineupTab({ match }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const [activeTab, setActiveTab] = useState<LineupTab>(null);

  const lineup = match.lineups;
  const eventsMap = useMemo(
    () => buildPlayerEventsMap(match.events ?? []),
    [match.events],
  );

  const allPlayerIds = useMemo(() => {
    const ids = [
      ...(match.lineups?.home?.startXI ?? []),
      ...(match.lineups?.home?.substitutes ?? []),
      ...(match.lineups?.away?.startXI ?? []),
      ...(match.lineups?.away?.substitutes ?? []),
    ]
      .map((p) => p.playerId)
      .filter(Boolean);
    return [...new Set(ids)];
  }, [match.lineups]);

  const { data: playerInfos } = useQuery<any>({
    queryKey: ["lineupPlayers", match._id],
    queryFn: () => api.post(ENDPOINTS.playersByIds, { ids: allPlayerIds }),
    enabled: allPlayerIds.length > 0,
  });

  const playerMap = useMemo(() => {
    return Object.fromEntries(
      playerInfos?.map((p: any) => [p.apiFootballId, p]) ?? [],
    );
  }, [playerInfos]);

  if (!lineup || (!lineup.home && !lineup.away)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("lineup.notAvailable")}</Text>
      </View>
    );
  }

  const homeLineup = lineup.home;
  const awayLineup = lineup.away;

  const handleTabPress = (tab: LineupTab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  const tabs: { key: LineupTab; label: string }[] = [
    { key: "stats", label: "시즌 통계" },
    { key: "age", label: "나이" },
    { key: "country", label: "국가" },
  ];

  return (
    <View style={styles.container}>
      {/* 탭 버튼들 */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabBtn,
              activeTab === tab.key && styles.tabBtnActive,
            ]}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 축구장 피치 영역 */}
      <View style={styles.pitch}>
        <PitchBackground />

        {/* 원정팀 헤더 (위쪽) */}
        <View style={styles.teamPitchHeader}>
          <View style={styles.teamPitchHeaderLeft}>
            <View style={styles.pitchHeaderLogoWrapper}>
              <Image
                source={match.awayTeam.logo}
                style={styles.pitchHeaderLogo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.pitchHeaderTeamName}>
              {match.awayTeam.name}
            </Text>
          </View>
          <Text style={styles.pitchHeaderFormation}>
            {awayLineup?.formation || "4-3-3"}
          </Text>
        </View>

        {awayLineup ? (
          <FieldHalf
            teamLineup={awayLineup}
            isHome={false}
            activeTab={activeTab}
            eventsMap={eventsMap}
            playerMap={playerMap}
          />
        ) : (
          <HalfPlaceholder label={t("lineup.awayMissing")} />
        )}

        {homeLineup ? (
          <FieldHalf
            teamLineup={homeLineup}
            isHome={true}
            activeTab={activeTab}
            eventsMap={eventsMap}
            playerMap={playerMap}
          />
        ) : (
          <HalfPlaceholder label={t("lineup.homeMissing")} />
        )}

        {/* 홈팀 헤더 (아래쪽) */}
        <View style={styles.teamPitchHeader}>
          <View style={styles.teamPitchHeaderLeft}>
            <View style={styles.pitchHeaderLogoWrapper}>
              <Image
                source={match.homeTeam.logo}
                style={styles.pitchHeaderLogo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.pitchHeaderTeamName}>
              {match.homeTeam.name}
            </Text>
          </View>
          <Text style={styles.pitchHeaderFormation}>
            {homeLineup?.formation || "4-3-3"}
          </Text>
        </View>
      </View>

      {/* 후보 선수 영역 */}
      <SubstitutesSection
        match={match}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        activeTab={activeTab}
        eventsMap={eventsMap}
        playerMap={playerMap}
      />

      <FixtureAbsenceSectionMock fixtureId={match.apiFootballId} />
      <View style={{ height: 40 }} />
    </View>
  );
}

function PitchBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Rect
          x="4%"
          y="2%"
          width="92%"
          height="96%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Line
          x1="4%"
          y1="50%"
          x2="96%"
          y2="50%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
        />
        <Circle
          cx="50%"
          cy="50%"
          r="12%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Circle cx="50%" cy="50%" r="1%" fill="rgba(255,255,255,0.3)" />

        <Rect
          x="25%"
          y="2%"
          width="50%"
          height="14%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Rect
          x="38%"
          y="2%"
          width="24%"
          height="6%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Path
          d="M 40 16 A 1 1 0 0 0 60 16"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
          transform="scale(3.5, 1) translate(-21, 0)"
        />

        <Rect
          x="25%"
          y="84%"
          width="50%"
          height="14%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <Rect
          x="38%"
          y="92%"
          width="24%"
          height="6%"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          fill="none"
        />
      </Svg>
    </View>
  );
}

function FieldHalf({
  teamLineup,
  isHome,
  activeTab,
  eventsMap,
  playerMap,
  team,
}: any) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  const formation = (teamLineup.formation || "4-3-3").trim();
  const rows = formation.split("-").map((n: string) => Number(n));
  const players = teamLineup.startXI || [];

  const gk = players[0];
  let playerIndex = 1;

  const formationRows = rows.map((count: number) => {
    const rowPlayers = players.slice(playerIndex, playerIndex + count);
    playerIndex += count;
    return rowPlayers;
  });

  const orderedRows = isHome ? [...formationRows].reverse() : formationRows;

  return (
    <View style={styles.fieldHalf}>
      {!isHome && (
        <View style={styles.fieldRow}>
          <PlayerCircle
            player={gk}
            isGK
            activeTab={activeTab}
            eventsMap={eventsMap}
            playerMap={playerMap}
          />
        </View>
      )}
      {orderedRows.map((row: any[], i: number) => (
        <View key={i} style={styles.fieldRow}>
          {row.map((player: any, j: number) => (
            <PlayerCircle
              key={`${i}-${j}`}
              player={player}
              activeTab={activeTab}
              eventsMap={eventsMap}
              playerMap={playerMap}
            />
          ))}
        </View>
      ))}
      {isHome && (
        <View style={styles.fieldRow}>
          <PlayerCircle
            player={gk}
            isGK
            activeTab={activeTab}
            eventsMap={eventsMap}
            playerMap={playerMap}
          />
        </View>
      )}
    </View>
  );
}

// ----------------- 선발 선수 서클 -----------------
function PlayerCircle({
  player,
  isGK = false,
  activeTab,
  eventsMap,
  playerMap,
}: any) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  const playerId = player?.player?.id || player?.playerId;
  const rawName = player?.player?.name || player?.playerName;
  const playerNumber = player?.player?.number || player?.number;
  const rating = player?.rating;
  const isCaptain = player?.player?.pos === "C" || player?.captain;

  const displayName = formatName(rawName);
  const initial = rawName?.charAt(0) || "?";

  const events = eventsMap[playerId] ?? null;
  const playerInfo = playerMap[playerId] ?? null;
  const flagUrl = nationalityToFlagUrl(playerInfo?.nationality ?? "");
  const statistics = playerInfo?.statistics?.[0]?.goals;
  const ratingColor = rating
    ? rating >= 8.0
      ? "#10B981"
      : rating >= 7.0
        ? "#84CC16"
        : rating >= 6.0
          ? "#F59E0B"
          : "#EF4444"
    : "rgba(0,0,0,0.6)";

  const renderTabBadge = () => {
    if (activeTab === "stats") {
      return (
        <View style={styles.statsBadgeArea}>
          {rating && (
            <View
              style={[styles.ratingBadge, { backgroundColor: ratingColor }]}
            >
              <Text style={styles.ratingBadgeText}>
                {Number(rating).toFixed(1)}
              </Text>
            </View>
          )}
          {statistics && (statistics.total > 0 || statistics.assists > 0) && (
            <View style={styles.eventGoalArea}>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {statistics.total > 0 && (
                  <View style={styles.eventIconRow}>
                    <Ionicons name="football" size={11} color="#fff" />
                    {statistics.total > 1 && (
                      <Text style={styles.eventCountText}>
                        {statistics.total}
                      </Text>
                    )}
                  </View>
                )}
                {statistics.assists > 0 && (
                  <View style={styles.eventIconRow}>
                    <Ionicons name="footsteps" size={11} color="#fff" />
                    {statistics.assists > 1 && (
                      <Text style={styles.eventCountText}>
                        {statistics.assists}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      );
    }
    if (activeTab === "age" && playerInfo?.age) {
      return (
        <View style={styles.ageBadge}>
          <Text style={styles.ageBadgeText}>{playerInfo.age}</Text>
        </View>
      );
    }
    if (activeTab === "country" && flagUrl) {
      return (
        <Image
          source={{ uri: flagUrl }}
          style={styles.flagBadge}
          contentFit="cover"
        />
      );
    }
    return null;
  };

  const renderEvents = () => {
    if (activeTab !== null || !events) return null;

    return (
      <>
        {events.substitutedOut && (
          <View style={styles.eventSubOut}>
            <Text style={styles.eventSubTime}>{events.substitutedOut}'</Text>
            <View style={styles.subIconCircleRed}>
              <Ionicons name="arrow-back" size={10} color="#fff" />
            </View>
          </View>
        )}

        {events.substitutedIn && (
          <View style={styles.eventSubIn}>
            <Text style={styles.eventSubTime}>{events.substitutedIn}'</Text>
            <View style={styles.subIconCircleGreen}>
              <Ionicons name="arrow-forward" size={10} color="#fff" />
            </View>
          </View>
        )}

        {(events.yellowCard || events.redCard) && (
          <View
            style={[
              styles.eventCard,
              { backgroundColor: events.redCard ? "#EF4444" : "#FBBF24" },
            ]}
          />
        )}

        {(events.goals > 0 || events.assists > 0) && (
          <View style={styles.eventGoalArea}>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {events.goals > 0 && (
                <View style={styles.eventIconRow}>
                  <Ionicons name="football" size={11} color="#fff" />
                  {events.goals > 1 && (
                    <Text style={styles.eventCountText}>{events.goals}</Text>
                  )}
                </View>
              )}
              {events.assists > 0 && (
                <View style={styles.eventIconRow}>
                  <Ionicons name="footsteps" size={11} color="#fff" />
                  {events.assists > 1 && (
                    <Text style={styles.eventCountText}>{events.assists}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <Pressable onPress={() => router.push(`player/${playerId}`)}>
      <View style={styles.playerSpot}>
        {rating && activeTab === null && (
          <View
            style={[styles.ratingBadgeOrg, { backgroundColor: ratingColor }]}
          >
            <Text style={styles.ratingBadgeText}>
              {Number(rating).toFixed(1)}
            </Text>
          </View>
        )}
        <View style={styles.photoWrapper}>
          {renderEvents()}

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

          {renderTabBadge()}
        </View>

        <View style={styles.playerNameRow}>
          {isCaptain && (
            <View style={styles.captainBadge}>
              <Text style={styles.captainText}>C</Text>
            </View>
          )}
          <Text style={styles.playerName} numberOfLines={1}>
            {playerNumber ? `${playerNumber} ` : ""}
            {displayName}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ----------------- 후보 선수 영역 -----------------
function SubstitutesSection({
  match,
  homeLineup,
  awayLineup,
  activeTab,
  eventsMap,
  playerMap,
}: any) {
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

      {Array.from({ length: maxLen }).map((_, i) => (
        <View key={i} style={styles.subRow}>
          {homeSubs[i] ? (
            <SubPlayerCard
              player={homeSubs[i]}
              activeTab={activeTab}
              eventsMap={eventsMap}
              playerMap={playerMap}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {awaySubs[i] ? (
            <SubPlayerCard
              player={awaySubs[i]}
              isRight
              activeTab={activeTab}
              eventsMap={eventsMap}
              playerMap={playerMap}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </View>
  );
}

// ----------------- 후보 선수 카드 -----------------
function SubPlayerCard({
  player,
  isRight = false,
  activeTab,
  eventsMap,
  playerMap,
}: any) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  const playerId = player?.player?.id || player?.playerId;
  const rawName = player?.player?.name || player?.playerName;
  const playerPos = player?.player?.pos || player?.pos;
  const playerNumber = player?.player?.number || player?.number;
  const rating = player?.rating;

  const displayName = formatName(rawName);
  const events = eventsMap[playerId] ?? null;
  const playerInfo = playerMap[playerId] ?? null;
  const flagUrl = nationalityToFlagUrl(playerInfo?.nationality ?? "");

  const ratingColor = rating
    ? rating >= 8.0
      ? "#10B981"
      : rating >= 7.0
        ? "#84CC16"
        : rating >= 6.0
          ? "#F59E0B"
          : "#EF4444"
    : "rgba(0,0,0,0.6)";

  return (
    <Pressable
      onPress={() => router.push(`player/${playerId}`)}
      style={[styles.subPlayerCard, isRight && styles.subPlayerCardRight]}
    >
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
              {rawName?.charAt(0) || "?"}
            </Text>
          </View>
        )}

        {activeTab === "stats" && rating && (
          <View
            style={[styles.subRatingBadge, { backgroundColor: ratingColor }]}
          >
            <Text style={styles.subRatingText}>
              {Number(rating).toFixed(1)}
            </Text>
          </View>
        )}
        {activeTab === "age" && playerInfo?.age && (
          <View style={styles.subAgeBadge}>
            <Text style={styles.subAgeText}>{playerInfo.age}</Text>
          </View>
        )}
        {activeTab === "country" && flagUrl && (
          <Image
            source={{ uri: flagUrl }}
            style={styles.subFlagBadge}
            contentFit="cover"
          />
        )}
      </View>

      <View style={[styles.subInfo, isRight && { alignItems: "flex-end" }]}>
        <Text style={styles.subName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.subDetail}>
          {POSITION_MAP[playerPos] || playerPos || "-"}{" "}
          {playerNumber ? `#${playerNumber}` : ""}
        </Text>

        {activeTab === null && events && (
          <View
            style={[
              styles.subEventsRow,
              isRight && { flexDirection: "row-reverse" },
            ]}
          >
            {events.substitutedIn && (
              <View
                style={[styles.subEventBadge, { backgroundColor: "#10B981" }]}
              >
                <Ionicons name="arrow-forward" size={10} color="#fff" />
                <Text style={styles.subEventTime}>{events.substitutedIn}'</Text>
              </View>
            )}
            {events.substitutedOut && (
              <View
                style={[styles.subEventBadge, { backgroundColor: "#EF4444" }]}
              >
                <Ionicons name="arrow-back" size={10} color="#fff" />
                <Text style={styles.subEventTime}>
                  {events.substitutedOut}'
                </Text>
              </View>
            )}
            {(events.yellowCard || events.redCard) && (
              <View
                style={[
                  styles.subCard,
                  { backgroundColor: events.redCard ? "#EF4444" : "#FBBF24" },
                ]}
              />
            )}
            {events.goals > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Ionicons
                  name="football"
                  size={12}
                  color={Colors.textSecondary}
                />
                {events.goals > 1 && (
                  <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                    {events.goals}
                  </Text>
                )}
              </View>
            )}
            {events.assists > 0 && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
              >
                <Ionicons
                  name="footsteps"
                  size={12}
                  color={Colors.textSecondary}
                />
                {events.assists > 1 && (
                  <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                    {events.assists}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
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
      <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "700" }}>
        {label}
      </Text>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface2 },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: Colors.surface2,
    },
    emptyText: { color: Colors.text, fontSize: 14 },

    tabRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
    },
    tabBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tabBtnActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
    tabTextActive: { color: "#fff", fontWeight: "700" },

    pitch: {
      backgroundColor: "#1D753C",
      marginHorizontal: 12,
      marginVertical: 12,
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
    },

    // 추가된 피치 안쪽 팀 헤더 스타일
    teamPitchHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      zIndex: 1,
      // opacity: 0.5,
      backgroundColor: "#999999",
    },
    teamPitchHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    pitchHeaderLogoWrapper: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    pitchHeaderLogo: {
      width: 20,
      height: 20,
    },
    pitchHeaderTeamName: {
      fontSize: 15,
      fontWeight: "700",
      color: "#fff",
    },
    pitchHeaderFormation: {
      fontSize: 15,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 1,
    },

    fieldHalf: { paddingVertical: 12 },
    fieldRow: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      alignItems: "center",
      marginVertical: 8,
    },

    playerSpot: { alignItems: "center", width: 70 },
    photoWrapper: { position: "relative", marginBottom: 6 },
    playerPhoto: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: "#fff",
      backgroundColor: "#fff",
    },
    gkPhoto: { borderColor: "#FBBF24" },
    playerPhotoPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: Colors.border2,
    },
    gkPhotoPlaceholder: { borderColor: "#FBBF24" },
    playerPhotoText: { fontSize: 16, fontWeight: "700", color: Colors.text },

    playerNameRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    captainBadge: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    captainText: { fontSize: 9, fontWeight: "800", color: "#000" },
    playerName: {
      fontSize: 11,
      color: "#fff",
      fontWeight: "700",
      textShadowColor: "rgba(0, 0, 0, 0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    ratingBadge: {
      position: "absolute",
      top: -50,
      left: 30,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: Colors.border2,
    },
    ratingBadgeOrg: {
      position: "absolute",
      top: -4,
      right: -6,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: Colors.border2,
    },
    ratingBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.text },
    ageBadge: {
      position: "absolute",
      top: -2,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#ddd",
    },
    ageBadgeText: { fontSize: 10, fontWeight: "700", color: "#000" },
    flagBadge: {
      position: "absolute",
      bottom: -2,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: "#fff",
    },

    eventSubOut: {
      position: "absolute",
      top: -8,
      left: -16,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 10,
    },
    eventSubIn: {
      position: "absolute",
      top: -8,
      left: -16,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 10,
    },
    eventSubTime: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      marginRight: 2,
      textShadowColor: "rgba(0,0,0,0.8)",
      textShadowRadius: 2,
    },
    subIconCircleRed: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#fff",
    },
    subIconCircleGreen: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#10B981",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "#fff",
    },

    eventCard: {
      position: "absolute",
      top: "35%",
      left: -6,
      width: 10,
      height: 14,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: "#fff",
      transform: [{ rotate: "-10deg" }],
      zIndex: 10,
    },
    eventGoalArea: {
      position: "absolute",
      bottom: -8,
      left: "50%",
      transform: [{ translateX: -12 }],
      zIndex: 10,
    },
    eventIconRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 8,
    },
    eventCountText: {
      fontSize: 10,
      color: "#fff",
      fontWeight: "700",
      marginLeft: 2,
    },

    subsContainer: {
      backgroundColor: Colors.surface,
      marginTop: 16,
      marginHorizontal: 12,
      borderRadius: 12,
      overflow: "hidden",
    },
    subsHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    subsHeaderLogo: { width: 24, height: 24 },
    subsTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
    subRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },

    subPlayerCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 10,
    },
    subPlayerCardRight: { flexDirection: "row-reverse" },
    subPhotoContainer: { position: "relative" },
    subPhoto: { width: 40, height: 40, borderRadius: 20 },
    subPhotoPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    subPhotoPlaceholderText: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
    },

    subRatingBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderWidth: 1,
      borderColor: Colors.surface,
    },
    subRatingText: { fontSize: 9, fontWeight: "800", color: "#fff" },
    subAgeBadge: {
      position: "absolute",
      bottom: -2,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    subAgeText: { fontSize: 9, fontWeight: "700", color: "#000" },
    subFlagBadge: {
      position: "absolute",
      bottom: -2,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: Colors.surface,
    },

    subInfo: { flex: 1, justifyContent: "center" },
    subName: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
      marginBottom: 2,
    },
    subDetail: { fontSize: 11, color: Colors.textSecondary },

    subEventsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    subEventBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
      gap: 2,
    },
    subEventTime: { fontSize: 10, color: Colors.text, fontWeight: "700" },
    subCard: { width: 8, height: 12, borderRadius: 2 },
    statsBadgeArea: {
      position: "absolute",
      bottom: 2,
      right: 40,
      alignItems: "center",
      gap: 2,
    },
  });
