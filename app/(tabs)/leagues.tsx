import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors, getColors } from "../../src/constants/colors";
import { CONTINENTS } from "../../src/constants/leauges";
import { useTranslation } from "react-i18next";
import { useColors } from "../../src/hooks/useColors";

interface League {
  _id: string;
  apiFootballId: number;
  name: string;
  country: string;
  logo: string;
  type: string;
  isFeatured?: boolean;
}

export default function LeaguesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeContinent, setActiveContinent] = useState("all");
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  // 인기 리그
  const { data: featuredLeagues } = useQuery<League[]>({
    queryKey: ["featured-leagues"],
    queryFn: () => api.get(ENDPOINTS.featuredLeagues),
    staleTime: 1000 * 60 * 30,
  });

  // 전체 리그
  const { data: allLeagues } = useQuery<League[]>({
    queryKey: ["all-leagues"],
    queryFn: () => api.get(ENDPOINTS.leagues),
    staleTime: 1000 * 60 * 30,
  });

  // 필터링
  const filteredLeagues =
    allLeagues?.filter((league) => {
      // 검색
      if (
        searchQuery &&
        !league.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // 대륙 필터
      if (activeContinent !== "all") {
        const continent = CONTINENTS.find((c) => c.key === activeContinent);
        if (!continent?.countries?.includes(league.country)) {
          return false;
        }
      }

      return true;
    }) || [];

  // 4열 그리드로 변환
  const leagueGrid: League[][] = [];
  for (let i = 0; i < filteredLeagues.length; i += 4) {
    leagueGrid.push(filteredLeagues.slice(i, i + 4));
  }

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
        <Text style={styles.headerTitle}>{t("leagues.title")}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 검색바 */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("leagues.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
            underlineColorAndroid="transparent"
            cursorColor={"white"}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 인기 리그 */}
        {!searchQuery && activeContinent === "all" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("leagues.sections.featured")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredContainer}
            >
              {featuredLeagues?.map((league) => (
                <TouchableOpacity
                  key={league._id}
                  style={styles.featuredCard}
                  onPress={() => router.push(`/league/${league.apiFootballId}`)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={league.logo}
                    style={styles.featuredLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.featuredName} numberOfLines={2}>
                    {league.name}
                  </Text>
                  <Text style={styles.featuredCountry}>{league.country}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 월드컵 배너 */}
        {!searchQuery && activeContinent === "all" && (
          <TouchableOpacity
            style={styles.worldCupBanner}
            activeOpacity={0.8}
            onPress={() => router.push("/worldcup")}
          >
            <View style={styles.worldCupContent}>
              <Text style={styles.worldCupYear}>2026</Text>
              <Text style={styles.worldCupTitle}>
                {t("leagues.worldCup.title")}
              </Text>
              <Text style={styles.worldCupLocation}>
                {t("leagues.worldCup.location")}
              </Text>
            </View>
            <Text style={styles.worldCupEmoji}>🏆</Text>
          </TouchableOpacity>
        )}

        {/* 대륙별 탭 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.continentTabs}
        >
          {CONTINENTS.map((continent) => (
            <TouchableOpacity
              key={continent.key}
              style={[
                styles.continentTab,
                activeContinent === continent.key && styles.continentTabActive,
              ]}
              onPress={() => setActiveContinent(continent.key)}
            >
              <Text
                style={[
                  styles.continentTabText,
                  activeContinent === continent.key &&
                    styles.continentTabTextActive,
                ]}
              >
                {t(continent.i18nKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 전체 리그 그리드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("leagues.sections.all", { count: filteredLeagues.length })}
          </Text>

          {leagueGrid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.leagueRow}>
              {row.map((league) => (
                <TouchableOpacity
                  key={league._id}
                  style={styles.leagueCard}
                  onPress={() => router.push(`/league/${league.apiFootballId}`)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={league.logo}
                    style={styles.leagueLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.leagueName} numberOfLines={2}>
                    {league.name}
                  </Text>
                  <Text style={styles.leagueCountry} numberOfLines={1}>
                    {league.country}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* 빈 칸 채우기 */}
              {row.length < 4 &&
                Array.from({ length: 4 - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.leagueCard} />
                ))}
            </View>
          ))}
        </View>

        {/* 오늘의 주요 경기 */}
        {!searchQuery && activeContinent === "all" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("leagues.sections.todayMatches")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/")}>
                <Text style={styles.sectionMore}>{t("leagues.more")}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.comingSoon}>{t("leagues.comingSoon")}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.surface2,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      gap: 60,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: Colors.surface2,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border2,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: Colors.text,
      textAlign: "center",
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      borderWidth: 0,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: Colors.text,
      borderWidth: 0,
    },
    section: {
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sectionMore: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.primary,
    },

    // 인기 리그
    featuredContainer: {
      paddingHorizontal: 16,
      gap: 12,
    },
    featuredCard: {
      width: 140,
      backgroundColor: Colors.text,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 8,
    },
    featuredLogo: {
      width: 60,
      height: 60,
    },
    featuredName: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.text2,
      textAlign: "center",
    },
    featuredCountry: {
      fontSize: 11,
      color: Colors.text2,
    },

    // 월드컵 배너
    worldCupBanner: {
      marginHorizontal: 16,
      marginTop: 24,
      backgroundColor: "#1a4d8f",
      borderRadius: 16,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    worldCupContent: {
      flex: 1,
    },
    worldCupYear: {
      fontSize: 32,
      fontWeight: "900",
      color: "#ffffff",
    },
    worldCupTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      marginTop: 4,
    },
    worldCupLocation: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      marginTop: 4,
    },
    worldCupEmoji: {
      fontSize: 48,
    },

    // 대륙 탭
    continentTabs: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 8,
    },
    continentTab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.surface2,
      borderWidth: 1,
      borderColor: Colors.border2,
    },
    continentTabActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.text,
    },
    continentTabText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.text,
    },
    continentTabTextActive: {
      color: Colors.text2,
      fontWeight: "700",
    },

    // 리그 그리드
    leagueRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      gap: 8,
      marginBottom: 8,
    },
    leagueCard: {
      flex: 1,
      aspectRatio: 0.85,
      backgroundColor: Colors.text,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    leagueLogo: {
      width: 48,
      height: 48,
    },
    leagueName: {
      fontSize: 11,
      fontWeight: "600",
      color: Colors.text2,
      textAlign: "center",
    },
    leagueCountry: {
      fontSize: 10,
      color: Colors.text2,
      textAlign: "center",
    },

    // 곧 업데이트
    comingSoon: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      paddingVertical: 40,
    },
  });
