import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import { ENDPOINTS, WORLDCUP_LEAGUE_ID } from "../../../constants/api";

export default function WorldcupPlayersTab() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const { data: players = [], isLoading } = useQuery<any[]>({
    queryKey: ["worldcup-players"],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.topScorers(WORLDCUP_LEAGUE_ID));
      return res ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const renderPlayer = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.playerCard}
      onPress={() => router.push(`/player/${item.apiFootballId}`)}
      activeOpacity={0.7}
    >
      {/* 선수 사진 */}
      <Image
        source={item?.photo}
        style={styles.playerPhoto}
        contentFit="cover"
      />

      {/* 정보 */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerName} numberOfLines={2}>
          {item?.name}
        </Text>
        <Text style={styles.playerPosition} numberOfLines={1}>
          {item?.position}
        </Text>
        <View style={styles.nationalityRow}>
          <Image
            source={item?.currentTeam?.logo}
            style={styles.flagIcon}
            contentFit="contain"
          />
          <Text style={styles.nationality} numberOfLines={1}>
            {item?.nationality}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.container} />;
  }

  return (
    <FlatList
      data={players}
      keyExtractor={(_, index) => index.toString()}
      renderItem={renderPlayer}
      numColumns={3}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={<View style={{ height: 40 }} />}
    />
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    list: { padding: 8, backgroundColor: Colors.background },
    playerCard: {
      flex: 1,
      margin: 6,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    playerPosition: {
      fontSize: 11,
      color: Colors.textSecondary,
      paddingHorizontal: 8,
      paddingBottom: 8,
    },
    playerPhoto: { width: "100%", aspectRatio: 0.85 },
    playerInfo: { padding: 8, gap: 3 },
    playerName: { fontSize: 12, fontWeight: "700", color: Colors.text },
    nationalityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    flagIcon: { width: 16, height: 16 },
    nationality: { fontSize: 11, color: Colors.textSecondary },
  });
