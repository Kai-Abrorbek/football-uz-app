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
import { router } from "expo-router";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";

interface Props {
  teamId: number;
  teamMatches: Match[] | [];
}

export default function TeamOverviewTab({ teamId, teamMatches }: Props) {
  const [showAllMatches, setShowAllMatches] = useState(false);

  // 다음 경기 4개 (하이라이트 제외)
  const upcomingMatches = teamMatches.slice(0, 4) || [];

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
            <Text style={styles.smallStatus}>풀타임</Text>
          ) : (
            <>
              <Text style={styles.smallDate}>
                {new Date(match.date).toLocaleDateString("ko-KR", {
                  month: "numeric",
                  day: "numeric",
                  weekday: "short",
                })}
              </Text>
              <Text style={styles.smallTime}>
                {new Date(match.date).toLocaleTimeString("ko-KR", {
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
        <Text style={styles.sectionTitle}>경기</Text>

        {/* 다음 경기들 */}
        {upcomingMatches.map(renderSmallMatchCard)}

        {/* 경기 더보기 버튼 */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowAllMatches(true)}
        >
          <Text style={styles.moreButtonText}>경기 더보기</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
      {/* 전체 경기 모달 */}
      <Modal
        visible={showAllMatches}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllMatches(false)}
      >
        <View style={styles.modalOverlay}>
          {/* 바깥(딤) 터치 닫기 */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAllMatches(false)}
          />

          {/* 바텀 시트 */}
          <View style={styles.modalSheet}>
            {/* 헤더 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>프리미어리그 경기</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowAllMatches(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* 리스트 */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {teamMatches?.map((match) => {
                const isFinished = match.status.short === "FT";
                const homeGoals = match.goals.home ?? "-";
                const awayGoals = match.goals.away ?? "-";

                return (
                  <TouchableOpacity
                    key={match._id}
                    style={styles.modalMatchCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowAllMatches(false);
                      router.push(`/match/${match._id}`);
                    }}
                  >
                    <View style={styles.modalMatchRow}>
                      {/* 왼쪽: 두 팀 */}
                      <View style={styles.modalLeft}>
                        {/* 홈 */}
                        <View style={styles.modalTeamRow}>
                          <Image
                            source={match.homeTeam.logo}
                            style={styles.modalLogo}
                            contentFit="contain"
                          />
                          <Text style={styles.modalTeamName} numberOfLines={1}>
                            {match.homeTeam.name}
                          </Text>
                          {isFinished ? (
                            <Text style={styles.modalSmallScore}>
                              {homeGoals}
                            </Text>
                          ) : (
                            <Text style={styles.modalSmallScore} />
                          )}
                        </View>

                        {/* 원정 */}
                        <View style={styles.modalTeamRow}>
                          <Image
                            source={match.awayTeam.logo}
                            style={styles.modalLogo}
                            contentFit="contain"
                          />
                          <Text style={styles.modalTeamName} numberOfLines={1}>
                            {match.awayTeam.name}
                          </Text>
                          {isFinished ? (
                            <Text style={styles.modalSmallScore}>
                              {awayGoals}
                            </Text>
                          ) : (
                            <Text style={styles.modalSmallScore} />
                          )}
                        </View>
                      </View>

                      {/* 가운데 구분선 */}
                      <View style={styles.modalDivider} />

                      {/* 오른쪽: 상태/시간 */}
                      <View style={styles.modalRight}>
                        {isFinished ? (
                          <>
                            <Text style={styles.modalRightStatus}>풀타임</Text>
                            <Text style={styles.modalRightDate}>
                              {new Date(match.date).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "numeric",
                                  day: "numeric",
                                  weekday: "short",
                                },
                              )}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={styles.modalRightDate}>
                              {new Date(match.date).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "numeric",
                                  day: "numeric",
                                  weekday: "short",
                                },
                              )}
                            </Text>
                            <Text style={styles.modalRightTime}>
                              {new Date(match.date).toLocaleTimeString(
                                "ko-KR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
