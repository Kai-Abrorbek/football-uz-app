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
import { Colors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";

interface Props {
  leagueId: string;
}

export default function LeaguePlayersTab({ leagueId }: Props) {
  const { t } = useTranslation();

  const { data: players } = useQuery<any>({
    queryKey: ["league-players", leagueId],
    queryFn: () => api.get(`/players/league/${leagueId}`),
    staleTime: 1000 * 60 * 30,
  });

  if (!players || players.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t("leaguePlayers.empty")}</Text>
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
          >
            {player.photo ? (
              <Image
                source={player.photo}
                style={styles.playerPhoto}
                contentFit="cover"
              />
            ) : (
              <View style={styles.playerPhotoPlaceholder}>
                <Text style={styles.playerPhotoText}>
                  {player.name?.charAt(0)}
                </Text>
              </View>
            )}

            <View style={styles.playerInfo}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>

              <Text style={styles.playerPosition}>
                {player.position || t("leaguePlayers.defaultPosition")}
              </Text>

              <View style={styles.teamRow}>
                {player.statistics?.[0].team.logo && (
                  <Image
                    source={player.statistics?.[0].team.logo}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                )}

                <Text style={styles.teamName} numberOfLines={1}>
                  {player.statistics?.[0].team.name ||
                    t("leaguePlayers.defaultTeamName")}
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

const styles = StyleSheet.create({
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
