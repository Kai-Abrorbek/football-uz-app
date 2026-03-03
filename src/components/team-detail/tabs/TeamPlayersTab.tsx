import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import { getColors } from "../../../constants/colors";
import { ENDPOINTS } from "../../../constants/api";
import { useColors } from "../../../hooks/useColors";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

interface Props {
  teamId: string;
}

export default function TeamPlayersTab({ teamId }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  // 리그 선수 목록
  const { data: players } = useQuery<any>({
    queryKey: ["team-players", teamId],
    queryFn: async () => {
      const res = await api.get(ENDPOINTS.teamPlayers(teamId));
      return res ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });

  if (!players || players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("teamPlayers.noInfo")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {players.map((player: any, index: number) => (
          <TouchableOpacity
            key={index}
            style={styles.playerCard}
            activeOpacity={0.7}
            onPress={() => router.push(`player/${player.apiFootballId}`)}
          >
            {/* 선수 사진 */}
            {player.photo ? (
              <Image
                source={{ uri: player.photo }}
                style={styles.playerPhoto}
              />
            ) : (
              <View style={styles.playerPhotoPlaceholder}>
                <Text style={styles.playerPhotoText}>
                  {player.name?.charAt(0)}
                </Text>
              </View>
            )}

            {/* 선수 정보 */}
            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={styles.playerPosition}>
                {player.position || t("teamPlayers.defaultPosition")}
              </Text>

              {/* 팀 정보 */}
              <View style={styles.teamRow}>
                {player.statistics?.[0]?.team?.logo && (
                  <Image
                    source={{ uri: player.statistics[0].team.logo }}
                    style={styles.teamLogo}
                  />
                )}

                <Text style={styles.teamName} numberOfLines={1}>
                  {player.statistics?.[0]?.team?.name ||
                    t("teamPlayers.defaultTeam")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    emptyText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 12,
      gap: 6,
    },
    playerCard: {
      width: "31.999%",
      backgroundColor: Colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    playerPhoto: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: Colors.border,
    },
    playerPhotoPlaceholder: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    playerPhotoText: {
      fontSize: 32,
      fontWeight: "700",
      color: Colors.textSecondary,
    },
    playerInfo: {
      padding: 10,
      gap: 4,
    },
    playerName: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.text,
    },
    playerPosition: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    teamRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    teamLogo: {
      width: 14,
      height: 14,
    },
    teamName: {
      flex: 1,
      fontSize: 11,
      color: Colors.textSecondary,
    },
  });
