import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { getColors } from "../../src/constants/colors";
import { useColors } from "../../src/hooks/useColors";
import { useTranslation } from "react-i18next";
import PlayerOverviewTab from "../../src/components/player-detail/tabs/PlayerOverviewTab";
import PlayerStatsTab from "../../src/components/player-detail/tabs/PlayerStatsTab";
import PlayerMatchesTab from "../../src/components/player-detail/tabs/PlayerMatchesTab";
import LeagueTabs from "../../src/components/league-detail/LeagueTabs";

const TABS = [{ key: "overview" }, { key: "stats" }, { key: "matches" }];

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ["player", id],
    queryFn: async () => {
      const res: any = await api.get(ENDPOINTS.playerDetail(Number(id)));
      return res;
    },
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  const player = data?.player;
  const recentMatches = data?.recentMatches ?? [];

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* 헤더 - 뒤로가기는 살려야 함 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Ionicons
            name="person-outline"
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.errorTitle}>{t("player.notFound")}</Text>
          <Text style={styles.errorSub}>{t("player.notFoundSub")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !player) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <PlayerOverviewTab player={player} recentMatches={recentMatches} />
        );
      case "stats":
        return <PlayerStatsTab player={player} />;
      case "matches":
        return (
          <PlayerMatchesTab player={player} recentMatches={recentMatches} />
        );
      default:
        return (
          <PlayerOverviewTab player={player} recentMatches={recentMatches} />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={player.photo}
            style={styles.playerPhoto}
            contentFit="cover"
          />
          <View>
            <Text style={styles.playerName} numberOfLines={1}>
              {player.name}
            </Text>
            <Text style={styles.playerPosition}>{player.position}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 */}
      <LeagueTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 탭 컨텐츠 */}
      <View style={styles.content}>{renderTab()}</View>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    homeButton: {
      marginTop: 20,
      backgroundColor: "#3478f6",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    homeButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 8,
    },
    playerPhoto: { width: 36, height: 36, borderRadius: 18 },
    playerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
    playerPosition: { fontSize: 12, color: Colors.textSecondary },
    headerRight: { flexDirection: "row", alignItems: "center" },
    moreButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    content: { flex: 1 },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      marginTop: 16,
    },
    errorSub: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
  });
