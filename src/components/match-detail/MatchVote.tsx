import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";

interface Props {
  matchId: string;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
}

interface VoteResult {
  total: number;
  home: { count: number; percent: number };
  draw: { count: number; percent: number };
  away: { count: number; percent: number };
  userVote: "home" | "draw" | "away" | null;
}

export default function MatchVote({ matchId, homeTeam, awayTeam }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { userData } = useAuth();
  const queryClient = useQueryClient();

  const { data: voteData, isLoading } = useQuery<VoteResult>({
    queryKey: ["vote", matchId],
    queryFn: () => api.get(ENDPOINTS.matchVote(matchId)),
    staleTime: 1000 * 60 * 5,
  });

  const { mutate: vote, isPending } = useMutation({
    mutationFn: (v: "home" | "draw" | "away") =>
      api.post(ENDPOINTS.matchVoteSubmit(matchId), { vote: v }),
    onMutate: async (v) => {
      await queryClient.cancelQueries({ queryKey: ["vote", matchId] });
      const prev = queryClient.getQueryData<VoteResult>(["vote", matchId]);

      if (prev) {
        queryClient.setQueryData(["vote", matchId], {
          ...prev,
          userVote: v,
          total: prev.total + 1,
        });
      }

      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(["vote", matchId], ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["vote", matchId] });
    },
  });

  const handleVote = (v: "home" | "draw" | "away") => {
    if (!userData?.user || isPending) return;
    vote(v);
  };

  if (isLoading)
    return <ActivityIndicator color={Colors.primary} style={{ padding: 20 }} />;

  const hasVoted = !!voteData?.userVote;

  // ✅ 투표 후 결과 UI
  if (hasVoted && voteData) {
    // 💡 가장 높은 퍼센트 값 찾기
    const maxPercent = Math.max(
      voteData.home.percent,
      voteData.draw.percent,
      voteData.away.percent,
    );

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>누가 이길까요?</Text>
          <Text style={styles.total}>
            총 득표: {voteData.total.toLocaleString()}
          </Text>
        </View>

        <View style={styles.resultRow}>
          {/* 홈팀 결과 */}
          <View style={styles.resultItem}>
            <Image
              source={homeTeam.logo}
              style={styles.teamLogoSmall}
              contentFit="contain"
            />
            <Text
              style={[
                styles.resultPercent,
                voteData.home.percent === maxPercent && { color: "#10B981" }, // 최고득표 초록색
                voteData.userVote === "home" && styles.votedText,
              ]}
            >
              {voteData.home.percent}%
            </Text>
          </View>

          {/* 비김 결과 */}
          <View style={styles.resultItem}>
            <Text style={styles.drawLabel}>비김</Text>
            <Text
              style={[
                styles.resultPercent,
                voteData.draw.percent === maxPercent && { color: "#10B981" }, // 최고득표 초록색
                voteData.userVote === "draw" && styles.votedText,
              ]}
            >
              {voteData.draw.percent}%
            </Text>
          </View>

          {/* 원정팀 결과 */}
          <View style={styles.resultItem}>
            <Image
              source={awayTeam.logo}
              style={styles.teamLogoSmall}
              contentFit="contain"
            />
            <Text
              style={[
                styles.resultPercent,
                voteData.away.percent === maxPercent && { color: "#10B981" }, // 최고득표 초록색
                voteData.userVote === "away" && styles.votedText,
              ]}
            >
              {voteData.away.percent}%
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.predictBtn} activeOpacity={0.8}>
          <View style={styles.predictIcon} />
          <Text style={styles.predictBtnText}>플레이 FotMob Predict</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ 투표 전 버튼 UI
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>누가 이길까요?</Text>
        {voteData && voteData.total >= 0 && (
          <Text style={styles.total}>
            총 득표: {voteData.total.toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.voteBtn}
          onPress={() => handleVote("home")}
          disabled={isPending}
          activeOpacity={0.7}
        >
          <Image
            source={homeTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteBtn}
          onPress={() => handleVote("draw")}
          disabled={isPending}
          activeOpacity={0.7}
        >
          <Text style={styles.voteDrawText}>비김</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.voteBtn}
          onPress={() => handleVote("away")}
          disabled={isPending}
          activeOpacity={0.7}
        >
          <Image
            source={awayTeam.logo}
            style={styles.teamLogo}
            contentFit="contain"
          />
        </TouchableOpacity>
      </View>

      {!userData?.user && (
        <Text style={styles.loginHint}>투표하려면 로그인이 필요합니다.</Text>
      )}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    card: {
      padding: 16,
      backgroundColor: Colors.surface,
      borderRadius: 16,
      marginHorizontal: 16,
      marginVertical: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: { fontSize: 16, fontWeight: "700", color: Colors.text },
    total: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },

    buttons: { flexDirection: "row", gap: 10 },
    voteBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    teamLogo: { width: 32, height: 32 },
    voteDrawText: { fontSize: 15, fontWeight: "600", color: Colors.text },

    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 8,
      marginBottom: 24,
    },
    resultItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    teamLogoSmall: { width: 24, height: 24 },
    drawLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: "600" },
    resultPercent: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    votedText: {
      fontWeight: "800",
    },

    predictBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.background,
      paddingVertical: 14,
      borderRadius: 24,
      gap: 8,
    },
    predictIcon: {
      width: 16,
      height: 16,
      backgroundColor: Colors.primary,
      borderRadius: 4,
      transform: [{ rotate: "45deg" }],
    },
    predictBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.text,
    },

    loginHint: {
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "center",
      marginTop: 12,
    },
  });
