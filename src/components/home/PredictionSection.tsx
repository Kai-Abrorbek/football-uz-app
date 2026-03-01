import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { useColors } from "../../hooks/useColors";
import { router } from "expo-router";
import { getColors } from "../../constants/colors";
import {
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Match } from "../../types";

function getDateString(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}

export default function PredictionSection() {
  const Colors = useColors();
  const styles = getStyles(Colors);

  // 오늘 경기 중 인기 경기 3개 가져오기
  const { data: matches } = useQuery<Match[]>({
    queryKey: ["matches", getDateString(0)],
    queryFn: async () => {
      const params: any = {};
      params.date = getDateString(-1); // 테스트용 날짜
      return api.get(ENDPOINTS.matches, { params });
    },
    staleTime: 1000 * 60 * 5,
  });

  // 각 경기의 예측 가져오기
  const { data: predictions } = useQuery<any>({
    queryKey: ["predictions", matches?.map((m: any) => m.apiFootballId)],
    queryFn: async () => {
      if (!matches || matches.length === 0) return [];

      const predictionPromises = matches.map((match: any) =>
        api
          .get(`${ENDPOINTS.prediction(match.apiFootballId)}`)
          .catch(() => null),
      );

      return Promise.all(predictionPromises);
    },
    enabled: !!matches && matches.length > 0,
  });

  if (!matches || matches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={Colors.primary} />
          <Text style={[styles.title, { color: Colors.text }]}>
            AI 경기 예측
          </Text>
        </View>
        <TouchableOpacity>
          <Text style={[styles.viewAll, { color: Colors.primary }]}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      {matches.map((match: any, index: number) => {
        const prediction = predictions?.[index];
        return (
          <TouchableOpacity
            key={match._id}
            style={[
              styles.predictionCard,
              { backgroundColor: Colors.surface, borderColor: Colors.border },
            ]}
            onPress={() => router.push(`/match/${match._id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.matchInfo}>
              <View style={styles.team}>
                <Image
                  source={match.homeTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={[styles.teamName, { color: Colors.text }]}>
                  {match.homeTeam.name}
                </Text>
              </View>

              <View style={styles.vs}>
                <Text style={[styles.vsText, { color: Colors.textSecondary }]}>
                  VS
                </Text>
              </View>

              <View style={styles.team}>
                <Image
                  source={match.awayTeam.logo}
                  style={styles.teamLogo}
                  contentFit="contain"
                />
                <Text style={[styles.teamName, { color: Colors.text }]}>
                  {match.awayTeam.name}
                </Text>
              </View>
            </View>

            {prediction ? (
              <View style={styles.probabilities}>
                <View style={styles.probItem}>
                  <Text
                    style={[styles.probLabel, { color: Colors.textSecondary }]}
                  >
                    홈
                  </Text>
                  <Text style={[styles.probValue, { color: Colors.text }]}>
                    {prediction?.prediction?.homeWinProb}%
                  </Text>
                </View>
                <View style={styles.probItem}>
                  <Text
                    style={[styles.probLabel, { color: Colors.textSecondary }]}
                  >
                    무
                  </Text>
                  <Text style={[styles.probValue, { color: Colors.text }]}>
                    {prediction?.prediction?.drawProb}%
                  </Text>
                </View>
                <View style={styles.probItem}>
                  <Text
                    style={[styles.probLabel, { color: Colors.textSecondary }]}
                  >
                    원정
                  </Text>
                  <Text style={[styles.probValue, { color: Colors.text }]}>
                    {prediction?.prediction?.awayWinProb}%
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.loadingPrediction}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text
                  style={[styles.loadingText, { color: Colors.textSecondary }]}
                >
                  AI 분석 중...
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
    },
    viewAll: {
      fontSize: 14,
      fontWeight: "600",
    },
    predictionCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    matchInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    team: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    teamLogo: {
      width: 32,
      height: 32,
    },
    teamName: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    vs: {
      paddingHorizontal: 12,
    },
    vsText: {
      fontSize: 12,
      fontWeight: "700",
    },
    probabilities: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    probItem: {
      alignItems: "center",
      gap: 4,
    },
    probLabel: {
      fontSize: 11,
    },
    probValue: {
      fontSize: 16,
      fontWeight: "700",
    },
    loadingPrediction: {
      alignItems: "center",
      paddingTop: 12,
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
    },
  });
