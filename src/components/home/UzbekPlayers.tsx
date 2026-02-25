import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../constants/colors";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { Player } from "../../types";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";

export default function UzbekPlayers() {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: players } = useQuery<Player[]>({
    queryKey: ["players", "uzbek"],
    queryFn: () => api.get(`${ENDPOINTS.players}/uzbek`),
    staleTime: 1000 * 60 * 60,
  });

  if (!players || players.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.flag}>🇺🇿</Text>
          <Text style={styles.title}>{t("players.uzbekAbroad")}</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreText}>{t("players.seeAll")}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 선수 목록 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playerList}
      >
        {players.map((player) => (
          <TouchableOpacity
            key={player._id}
            style={styles.playerCard}
            activeOpacity={0.7}
          >
            <Image
              source={player.photo}
              style={styles.playerPhoto}
              contentFit="cover"
            />
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.playerTeam} numberOfLines={1}>
              {player.currentTeam?.name}
            </Text>
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{player.position}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    flag: {
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
    playerList: {
      paddingHorizontal: 16,
      gap: 12,
    },
    playerCard: {
      backgroundColor: Colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      width: 110,
      gap: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    playerPhoto: {
      width: 64,
      height: 64,
      borderRadius: 32,
    },
    playerName: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.text,
      textAlign: "center",
    },
    playerTeam: {
      fontSize: 11,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    positionBadge: {
      backgroundColor: "#e8f0fe",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    positionText: {
      fontSize: 10,
      color: Colors.primary,
      fontWeight: "600",
    },
  });
