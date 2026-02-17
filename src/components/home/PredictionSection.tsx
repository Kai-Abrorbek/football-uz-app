import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

export default function PredictionSection() {
  const { data: predictions } = useQuery<any[]>({
    queryKey: ["predictions", "latest"],
    queryFn: async () => {
      const res: any = await api.get(`${ENDPOINTS.predictions}?limit=3`);
      return Array.isArray(res) ? res : res.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });
  if (!predictions || predictions.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.title}>AI Predictions</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 예측 목록 */}
      {predictions.map((pred: any, index: number) => (
        <TouchableOpacity
          key={pred._id}
          style={[
            styles.predItem,
            index < predictions.length - 1 && styles.predItemBorder,
          ]}
          onPress={() => router.push(`/match/${pred.apiFootballId}`)}
          activeOpacity={0.7}
        >
          {/* 팀 */}
          <View style={styles.teamsRow}>
            <View style={styles.team}>
              <Image
                source={pred.homeTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {pred.homeTeam.name}
              </Text>
            </View>

            {/* 확률 바 */}
            <View style={styles.probContainer}>
              <View style={styles.probBar}>
                <View
                  style={[
                    styles.probHome,
                    { flex: pred.prediction.homeWinProb },
                  ]}
                />
                <View
                  style={[styles.probDraw, { flex: pred.prediction.drawProb }]}
                />
                <View
                  style={[
                    styles.probAway,
                    { flex: pred.prediction.awayWinProb },
                  ]}
                />
              </View>
              <View style={styles.probNumbers}>
                <Text style={styles.probText}>
                  {pred.prediction.homeWinProb}%
                </Text>
                <Text style={styles.probText}>{pred.prediction.drawProb}%</Text>
                <Text style={styles.probText}>
                  {pred.prediction.awayWinProb}%
                </Text>
              </View>
            </View>

            <View style={[styles.team, styles.awayTeam]}>
              <Image
                source={pred.awayTeam.logo}
                style={styles.teamLogo}
                contentFit="contain"
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {pred.awayTeam.name}
              </Text>
            </View>
          </View>

          {/* 신뢰도 */}
          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceText}>
              Confidence: {pred.confidence}%
            </Text>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${pred.confidence}%` },
                ]}
              />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  moreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  moreText: {
    fontSize: 13,
    color: Colors.primary,
  },
  predItem: {
    padding: 14,
    gap: 10,
  },
  predItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  teamsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  team: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  awayTeam: {
    alignItems: "center",
  },
  teamLogo: {
    width: 32,
    height: 32,
  },
  teamName: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text,
    textAlign: "center",
  },
  probContainer: {
    flex: 2,
    gap: 4,
  },
  probBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  probHome: {
    backgroundColor: "#4285f4",
  },
  probDraw: {
    backgroundColor: "#9e9e9e",
  },
  probAway: {
    backgroundColor: "#ea4335",
  },
  probNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  probText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: Colors.textSecondary,
    width: 100,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
});
