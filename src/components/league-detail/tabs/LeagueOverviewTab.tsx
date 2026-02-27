import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { Colors, getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useTranslation } from "react-i18next";
import AllMatchesModal from "../AllMatchesModal";
import { useColors } from "../../../hooks/useColors";

interface Props {
  leagueId: string;
  highlightMatch?: Match | null;
}

export default function LeagueOverviewTab({ leagueId, highlightMatch }: Props) {
  const [showAllMatches, setShowAllMatches] = useState(false);
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  // 팀 경기 조회 (테스트용으로 과거 경기 포함)
  const { data: matches } = useQuery<Match[]>({
    queryKey: ["league-matches", leagueId],
    queryFn: () =>
      api.get(`${ENDPOINTS.matches}?leagueId=${leagueId}&limit=20`),
    staleTime: 1000 * 60 * 5,
  });

  // 하이라이트 경기 (없으면 하이라이트 안 보여주기)
  const featuredMatch = highlightMatch;

  // 다음 경기 4개 (하이라이트 제외)
  const upcomingMatches =
    matches?.filter((m) => m._id !== featuredMatch?._id).slice(0, 4) || [];

  const renderFeaturedMatch = () => {
    if (!featuredMatch) return null;

    const isLive = ["1H", "HT", "2H", "ET"].includes(
      featuredMatch.status.short,
    );
    const isFinished = featuredMatch.status.short === "FT";
    const homeGoals = featuredMatch.goals.home ?? 0;
    const awayGoals = featuredMatch.goals.away ?? 0;

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => router.push(`/match/${featuredMatch._id}`)}
        activeOpacity={0.7}
      >
        {/* 헤더 */}
        <Text style={styles.featuredHeader}>
          {featuredMatch.league.name} ·{" "}
          {isFinished
            ? t("leagueOverview.fulltime")
            : isLive
              ? t("leagueOverview.liveWithMinute", {
                  minute: featuredMatch.status.elapsed,
                })
              : new Date(featuredMatch.date).toLocaleDateString(i18n.language, {
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
        </Text>

        {/* 팀들 */}
        <View style={styles.featuredTeams}>
          {/* 홈팀 */}
          <View style={styles.featuredTeam}>
            <Image
              source={featuredMatch.homeTeam.logo}
              style={styles.featuredLogo}
              contentFit="contain"
            />
            <Text style={styles.featuredTeamName}>
              {featuredMatch.homeTeam.name}
            </Text>
          </View>

          {/* 스코어 or 대 */}
          <View style={styles.featuredCenter}>
            {isFinished || isLive ? (
              <>
                <Text style={styles.featuredScore}>{homeGoals}</Text>
                <Text style={styles.featuredScore}>:</Text>
                <Text style={styles.featuredScore}>{awayGoals}</Text>
              </>
            ) : (
              <Text style={styles.featuredVs}>{t("leagueOverview.vs")}</Text>
            )}
          </View>

          {/* 원정팀 */}
          <View style={styles.featuredTeam}>
            <Image
              source={featuredMatch.awayTeam.logo}
              style={styles.featuredLogo}
              contentFit="contain"
            />
            <Text style={styles.featuredTeamName}>
              {featuredMatch.awayTeam.name}
            </Text>
          </View>
        </View>

        {/* 티켓 구매 (예정 경기만) */}
        {!isFinished && !isLive && (
          <TouchableOpacity style={styles.ticketButton}>
            <Ionicons name="ticket-outline" size={16} color={Colors.primary} />
            <Text style={styles.ticketText}>
              {t("leagueOverview.buyTickets")}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderSmallMatchCard = (match: Match) => {
    const isFinished = match.status.short === "FT";
    const homeGoals = match.goals.home ?? 0;
    const awayGoals = match.goals.away ?? 0;

    return (
      <TouchableOpacity
        key={match._id}
        style={styles.smallCard}
        onPress={() => router.push(`/match/${match._id}`)}
        activeOpacity={0.7}
      >
        {/* 팀들 */}
        <View style={styles.smallTeams}>
          {/* 홈팀 */}
          <View style={styles.smallTeamRow}>
            <Image
              source={match.homeTeam.logo}
              style={styles.smallLogo}
              contentFit="contain"
            />
            <Text style={styles.smallTeamName}>{match.homeTeam.name}</Text>
            {isFinished && <Text style={styles.smallScore}>{homeGoals}</Text>}
          </View>

          {/* 원정팀 */}
          <View style={styles.smallTeamRow}>
            <Image
              source={match.awayTeam.logo}
              style={styles.smallLogo}
              contentFit="contain"
            />
            <Text style={styles.smallTeamName}>{match.awayTeam.name}</Text>
            {isFinished && <Text style={styles.smallScore}>{awayGoals}</Text>}
          </View>
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 날짜/시간 or 상태 */}
        <View style={styles.smallRight}>
          {isFinished ? (
            <View>
              <Text style={styles.smallStatus}>
                {t("leagueOverview.fulltime")}
              </Text>
              <Text style={styles.smallDate}>
                {new Date(match.date).toLocaleDateString(i18n.language, {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                })}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.smallDate}>
                {new Date(match.date).toLocaleDateString(i18n.language, {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                })}
              </Text>
              <Text style={styles.smallTime}>
                {new Date(match.date).toLocaleTimeString(i18n.language, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 경기 섹션 타이틀 */}
        <Text style={styles.sectionTitle}>
          {t("leagueOverview.sectionTitle")}
        </Text>

        {/* 하이라이트 경기 */}
        {renderFeaturedMatch()}

        {/* 다음 경기들 */}
        {upcomingMatches.map(renderSmallMatchCard)}

        {/* 경기 더보기 버튼 */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowAllMatches(true)}
        >
          <Text style={styles.moreButtonText}>
            {t("leagueOverview.seeMore")}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
      {/* 전체 경기 모달 */}
      <AllMatchesModal
        visible={showAllMatches}
        leagueId={leagueId}
        onClose={() => setShowAllMatches(false)}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },

    // 하이라이트 경기 카드
    featuredCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 16,
      padding: 20,
      gap: 16,
    },
    featuredHeader: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    featuredTeams: {
      flexDirection: "row",
      alignItems: "center",
      gap: 50,
    },
    featuredTeam: {
      flex: 1,
      alignItems: "center",
      gap: 12,
    },
    featuredLogo: {
      width: 64,
      height: 64,
    },
    featuredTeamName: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.text,
      textAlign: "center",
    },
    featuredCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    featuredScore: {
      fontSize: 36,
      fontWeight: "800",
      color: Colors.text,
    },
    featuredVs: {
      fontSize: 24,
      fontWeight: "700",
      color: Colors.text,
    },
    ticketButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      gap: 6,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: 16,
    },
    ticketText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.primary,
    },

    // 작은 경기 카드
    smallCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    smallTeams: {
      flex: 1,
      gap: 10,
    },
    smallTeamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    smallLogo: {
      width: 28,
      height: 28,
    },
    smallTeamName: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
    },
    divider: {
      width: 1,
      height: 50,
      backgroundColor: Colors.border,
    },
    smallRight: {
      alignItems: "flex-end",
      gap: 4,
    },
    smallDate: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    smallTime: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    smallScore: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      marginLeft: "auto",
      minWidth: 24,
      textAlign: "right",
    },
    smallStatus: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    // 경기 더보기 버튼
    moreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f0e6ff",
      marginHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 6,
      marginTop: 4,
    },
    moreButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
    },
    // 모달
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
      paddingTop: 60, // ✅ 위쪽 공간 (사진처럼 위가 살짝 보이게)
    },
    modalContainer: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
      maxHeight: "91%",
    },
    modalSheet: {
      backgroundColor: Colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      overflow: "hidden",
      maxHeight: "91%",
    },
    modalLeft: {
      flex: 1,
      gap: 10,
    },
    modalTeamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    modalSmallScore: {
      marginLeft: "auto",
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      minWidth: 24,
      textAlign: "right",
    },
    modalDivider: {
      width: 1,
      height: 56,
      backgroundColor: Colors.border,
      marginHorizontal: 12,
    },
    modalRight: {
      width: 90,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    modalRightStatus: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.textSecondary,
    },
    modalRightDate: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.text,
    },
    modalRightTime: {
      fontSize: 13,
      color: Colors.textSecondary,
    },

    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
    },
    modalClose: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    modalMatchCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 12,
      padding: 16,
      gap: 10,
    },
    modalMatchRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    modalTeam: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    modalTeamRight: {
      flexDirection: "row-reverse",
    },
    modalLogo: {
      width: 28,
      height: 28,
    },
    modalTeamName: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
    },
    modalTeamNameRight: {
      textAlign: "right",
    },
    modalScore: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    modalScoreText: {
      fontSize: 20,
      fontWeight: "700",
      color: Colors.text,
      minWidth: 30,
      textAlign: "center",
    },
    modalVs: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    modalDate: {
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "center",
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
  });
