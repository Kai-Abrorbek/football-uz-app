import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { Colors } from "../../constants/colors";
import { Match } from "../../types";

interface Props {
  visible: boolean;
  leagueId: string;
  onClose: () => void;
}

export default function AllMatchesModal({ visible, leagueId, onClose }: Props) {
  const { data: matches } = useQuery<Match[]>({
    queryKey: ["all-league-matches", leagueId],
    queryFn: () => api.get(`${ENDPOINTS.matches}?leagueId=${leagueId}`),
    enabled: visible,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* 바깥(딤) 터치 닫기 */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* 바텀 시트 */}
        <View style={styles.modalSheet}>
          {/* 헤더 */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>프리미어리그 경기</Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* 리스트 */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {matches?.map((match, index) => {
              const isFinished = match.status.short === "FT";
              const homeGoals = match.goals.home ?? "-";
              const awayGoals = match.goals.away ?? "-";
              const totalMatches = matches.length;

              return (
                <View key={match._id}>
                  {/* 경기일 헤더 */}
                  <Text style={styles.modalSectionTitle}>
                    경기일({index + 1}/{totalMatches})
                  </Text>

                  <TouchableOpacity
                    style={styles.modalMatchCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
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
                          {isFinished && (
                            <Text style={styles.modalSmallScore}>
                              {homeGoals}
                            </Text>
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
                          {isFinished && (
                            <Text style={styles.modalSmallScore}>
                              {awayGoals}
                            </Text>
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
                </View>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    flex: 1,
    marginTop: 120,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
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
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalMatchCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
  },
  modalMatchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalLeft: {
    flex: 1,
    gap: 10,
  },
  modalTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalLogo: {
    width: 24,
    height: 24,
  },
  modalTeamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  modalSmallScore: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 20,
    textAlign: "right",
  },
  modalDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  modalRight: {
    alignItems: "flex-end",
    gap: 4,
    minWidth: 70,
  },
  modalRightStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalRightDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  modalRightTime: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
});
