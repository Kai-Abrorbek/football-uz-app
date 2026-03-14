import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { ENDPOINTS } from "../../../constants/api";
import { Colors, getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import AllMatchesModal from "../AllMatchesModal";
import { useColors } from "../../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  teamId: number;
  teamMatches: Match[] | [];
}

// 영상 썸네일을 불러오기 위해 별도 컴포넌트로 분리
function SmallMatchCard({ match, styles, Colors, t, i18n, getLocale }: any) {
  const router = useRouter();
  const isFinished = match.status.short === "FT";
  const isLive = ["1H", "HT", "2H", "ET"].includes(match.status.short);
  const homeGoals = match.goals.home ?? 0;
  const awayGoals = match.goals.away ?? 0;
  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;

  const { data: highlight } = useQuery<any>({
    queryKey: ["highlight", match._id],
    queryFn: () =>
      api.get(
        ENDPOINTS.matchHighlight(
          match._id,
          match.homeTeam.name,
          match.awayTeam.name,
          match.date,
        ),
      ),
    enabled: isFinished,
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
  });

  return (
    <TouchableOpacity
      style={styles.smallCard}
      onPress={() => router.push(`/match/${match._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.matchBody}>
        {/* 왼쪽: 팀 및 스코어 */}
        <View style={styles.leftSection}>
          <View style={styles.teamScoreRow}>
            <Image
              source={{ uri: match.homeTeam.logo }}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
            <Text style={[styles.score, homeWon && styles.scoreWinner]}>
              {isFinished || isLive ? homeGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {homeWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>

          <View style={[styles.teamScoreRow, { marginTop: 12 }]}>
            <Image
              source={{ uri: match.awayTeam.logo }}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
            <Text style={[styles.score, awayWon && styles.scoreWinner]}>
              {isFinished || isLive ? awayGoals : ""}
            </Text>
            <View style={styles.winnerIconContainer}>
              {awayWon && <Text style={styles.winnerIcon}>◀</Text>}
            </View>
          </View>
        </View>

        {/* 세로 구분선 */}
        <View style={styles.divider} />

        {/* 오른쪽: 상태, 날짜, 하이라이트 영상 */}
        <View style={styles.rightSection}>
          <Text style={styles.statusText}>
            {isFinished
              ? t("overview.fullTime", "풀타임")
              : isLive
                ? "LIVE"
                : t("overview.scheduled", "예정")}
          </Text>
          <Text style={styles.dateText}>
            {new Date(match.date).getMonth() + 1}.{" "}
            {new Date(match.date).getDate()}.
          </Text>

          {highlight?.videoId ? (
            <TouchableOpacity
              style={styles.highlightThumb}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: `/highlight/${match._id}`,
                  params: { videoId: highlight.videoId },
                });
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: highlight.thumbnail }}
                style={styles.highlightThumbImg}
                contentFit="cover"
              />
              <View style={styles.highlightOverlay}>
                <Ionicons name="play" size={10} color="#fff" />
                <Text style={styles.highlightTime}>{highlight.duration}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptySpace} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TeamOverviewTab({ teamId, teamMatches }: any) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [showAllMatches, setShowAllMatches] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);

  // 다음 경기 4개 (하이라이트 제외)
  const upcomingMatches = teamMatches?.slice(0, 4) || [];

  // 언어 설정에 따른 로케일 헬퍼
  const getLocale = () => {
    switch (i18n.language) {
      case "ko":
        return "ko-KR";
      case "ru":
        return "ru-RU";
      case "uz":
        return "uz-UZ";
      default:
        return "en-US";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 경기 섹션 타이틀 */}
        <Text style={styles.sectionTitle}>{t("overview.matches")}</Text>

        {/* 다음 경기들 */}
        {upcomingMatches.map((match: any) => (
          <SmallMatchCard
            key={match._id}
            match={match}
            styles={styles}
            Colors={Colors}
            t={t}
            i18n={i18n}
            getLocale={getLocale}
          />
        ))}

        {/* 경기 더보기 버튼 */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowAllMatches(true)}
        >
          <Text style={styles.moreButtonText}>{t("overview.showMore")}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* 전체 경기 모달 */}
      <AllMatchesModal
        visible={showAllMatches}
        teamId={teamId}
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

    // 작은 경기 카드 (통일된 디자인)
    smallCard: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    matchBody: {
      flexDirection: "row",
      alignItems: "center",
    },
    leftSection: {
      flex: 1,
    },
    teamScoreRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    teamLogo: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    teamName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: Colors.text,
    },
    score: {
      fontSize: 16,
      fontWeight: "400",
      color: Colors.textSecondary,
      textAlign: "right",
    },
    scoreWinner: {
      fontWeight: "600",
      color: Colors.text,
    },
    winnerIconContainer: {
      width: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    winnerIcon: {
      fontSize: 10,
      color: Colors.text,
      marginLeft: 4,
    },
    divider: {
      width: 1,
      height: "100%",
      backgroundColor: Colors.border,
      marginHorizontal: 16,
    },
    rightSection: {
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
      marginBottom: 2,
    },
    dateText: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginBottom: 8,
    },
    emptySpace: {
      width: 80,
      height: 45,
    },
    highlightThumb: {
      width: 80,
      height: 45,
      borderRadius: 6,
      backgroundColor: "#1a1a1a",
      overflow: "hidden",
    },
    highlightThumbImg: {
      position: "absolute",
      width: "100%",
      height: "100%",
    },
    highlightOverlay: {
      position: "absolute",
      bottom: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderTopLeftRadius: 4,
    },
    highlightTime: {
      fontSize: 10,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 2,
    },

    // 경기 더보기 버튼
    moreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.surface2,
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

    // 모달 관련 스타일은 AllMatchesModal을 따로 호출하므로 불필요하면 삭제해도 돼
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
      paddingTop: 60,
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
