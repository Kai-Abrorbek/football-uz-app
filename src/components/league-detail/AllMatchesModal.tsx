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
import { Colors, getColors } from "../../constants/colors";
import { Match } from "../../types";
import { useColors } from "../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Props {
  visible: boolean;
  leagueId: string;
  onClose: () => void;
}

export default function AllMatchesModal({ visible, leagueId, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["all-league-matches", leagueId],
    queryFn: () => api.get(`${ENDPOINTS.matches}?leagueId=${leagueId}`),
    enabled: visible,
    staleTime: 1000 * 60 * 5,
  });

  const leagueName = matches?.[0]?.league?.name ?? "";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {t("allMatchesModal.title", { league: leagueName })}
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {matches?.map((match, index) => {
              const isFinished = match.status.short === "FT";
              const homeGoals = match.goals.home ?? "-";
              const awayGoals = match.goals.away ?? "-";
              const totalMatches = matches.length;

              return (
                <View key={match._id}>
                  <Text style={styles.modalSectionTitle}>
                    {t("allMatchesModal.matchday", {
                      current: index + 1,
                      total: totalMatches,
                    })}
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
                      <View style={styles.modalLeft}>
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

                      <View style={styles.modalDivider} />

                      <View style={styles.modalRight}>
                        {isFinished ? (
                          <>
                            <Text style={styles.modalRightStatus}>
                              {t("allMatchesModal.fulltime")}
                            </Text>
                            <Text style={styles.modalRightDate}>
                              {new Date(match.date).toLocaleDateString(
                                i18n.language,
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
                                i18n.language,
                                {
                                  month: "numeric",
                                  day: "numeric",
                                  weekday: "short",
                                },
                              )}
                            </Text>
                            <Text style={styles.modalRightTime}>
                              {new Date(match.date).toLocaleTimeString(
                                i18n.language,
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
const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
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
