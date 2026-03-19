import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  codegenNativeCommands,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMatches, useLiveMatches } from "../../src/hooks/useMatches";
import { useFeaturedLeagues } from "../../src/hooks/useLeagues";
import MatchCard from "../../src/components/match/MatchCard";
import LiveMatchCard from "../../src/components/match/LiveMatchCard";
import { Image } from "expo-image";
import WorldCupBanner from "../../src/components/home/WorldCupBanner";
import UzbekPlayers from "../../src/components/home/UzbekPlayers";
import NewsSection from "../../src/components/home/NewsSection";
import PredictionSection from "../../src/components/home/PredictionSection";
import HeroBanner from "../../src/components/home/HeroBanner";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import NotificationModal from "../../src/components/notifications/NotificationModal";
import usePushNotifications from "../../src/hooks/usePushNotifications";
import DateSelector from "../../src/components/match-detail/DateSelector";
import { useAuth } from "../../src/contexts/AuthContext";
import { ENDPOINTS } from "../../src/constants/api";
import api from "../../src/services/api";

export const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function HomeScreen() {
  usePushNotifications();
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedLeague, setSelectedLeague] = useState<number | undefined>();
  const { data: leagues } = useFeaturedLeagues();
  const { data: liveMatches } = useLiveMatches();
  const { userData } = useAuth();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const Colors = useColors();
  const styles = getStyles(Colors);

  const {
    data: matches,
    isLoading,
    refetch,
    isError,
  } = useMatches(selectedDate, selectedLeague);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!userData?.user) return;
      try {
        const res: any = await api.get(ENDPOINTS.notifications);
        const unread = (res ?? []).filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      } catch (e) {
        console.error(e);
      }
    };
    fetchUnreadCount();
  }, [userData?.user]);

  const getDateLabel = (dateStr: string): string => {
    const today = formatDate(new Date());
    const yesterday = formatDate(new Date(Date.now() - 86400000));
    const tomorrow = formatDate(new Date(Date.now() + 86400000));

    if (dateStr === today) return t("date.today");
    if (dateStr === yesterday) return t("date.yesterday");
    if (dateStr === tomorrow) return t("date.tomorrow");

    return new Date(dateStr).toLocaleDateString(i18n.language, {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const groupByLeague = (matches: any[]) => {
    if (!matches) return {};
    const grouped = matches.reduce((acc: any, match) => {
      const leagueId = match.league.id;
      if (!acc[leagueId]) {
        acc[leagueId] = { league: match.league, matches: [] };
      }
      acc[leagueId].matches.push(match);
      return acc;
    }, {});

    // 각 리그 내 경기를 시간순 정렬
    Object.values(grouped).forEach((group: any) => {
      group.matches.sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    });

    return grouped;
  };

  const renderDateSection = (
    label: string,
    matches: any[],
    isToday: boolean = false,
  ) => {
    if (!matches || matches.length === 0) return null;

    // 오늘이면 라이브 경기도 포함
    let allMatches = matches;
    if (isToday && liveMatches && liveMatches.length > 0) {
      const liveIds = new Set(liveMatches.map((m) => m._id));
      const newMatches = matches.filter((m) => !liveIds.has(m._id));
      allMatches = [...liveMatches, ...newMatches];
    }

    const grouped = groupByLeague(allMatches);
    const groupList = Object.values(grouped);

    return (
      <View key={label}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{label}</Text>
        </View>

        {groupList.map((group: any, index: number) => (
          <View key={group.league.id}>
            <View style={styles.leagueGroup}>
              <TouchableOpacity style={styles.leagueHeader}>
                <Image
                  source={group.league.logo}
                  style={styles.leagueLogo}
                  contentFit="contain"
                />
                <Text style={styles.leagueName}>{group.league.name}</Text>
                <Text style={styles.leagueCountry}>{group.league.country}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {group.matches.map((match: any) => (
                <MatchCard key={match._id} match={match} />
              ))}
            </View>

            {(index + 1) % 2 === 0 && (
              <View style={styles.adBanner}>
                <Text style={styles.adText}>{t("home.ad.label")}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const isRefatch = () => {
    refetch();
    setSelectedDate(formatDate(new Date()));
  };
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/*  헤더 수정 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚽ FootballUZ</Text>
        {/* // 벨 아이콘 */}
        <TouchableOpacity
          onPress={() => setNotificationModalVisible(true)}
          style={styles.bellButton}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={Colors.text}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {/* // 모달 */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
          onUnreadCountChange={(count) => setUnreadCount(count)}
        />
      </View>
      {/* 리그 칩 (상단) */}
      <View style={styles.leagueChipContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueChipContent}
        >
          <TouchableOpacity
            style={[styles.chip, !selectedLeague && styles.chipActive]}
            onPress={() => setSelectedLeague(undefined)}
          >
            <Text
              style={[
                styles.chipText,
                !selectedLeague && styles.chipTextActive,
              ]}
            >
              {t("home.leagueFilter.all")}
            </Text>
          </TouchableOpacity>

          {leagues?.map((league) => (
            <TouchableOpacity
              key={league._id}
              style={[
                styles.chip,
                selectedLeague === league.apiFootballId && styles.chipActive,
              ]}
              onPress={() =>
                setSelectedLeague(
                  selectedLeague === league.apiFootballId
                    ? undefined
                    : league.apiFootballId,
                )
              }
            >
              <View style={styles.logoBox}>
                <Image
                  source={{ uri: league.logo }}
                  style={styles.chipLogo}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  selectedLeague === league.apiFootballId &&
                    styles.chipTextActive,
                ]}
              >
                {league.name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.allLeaguesBtn}
            onPress={() => router.push("/leagues")}
          >
            <Text style={styles.allLeaguesBtnText}>
              {t("home.leagueFilter.allLeagues")}
            </Text>
            <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ✅ DateSelector를 ScrollView*/}
      <DateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        hasLive={liveMatches ? liveMatches.length > 0 : false}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={isRefatch} />
        }
      >
        <HeroBanner />

        {/* 라이브 경기 */}
        {liveMatches && liveMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.liveHeader}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveMatches.map((match) => (
                <LiveMatchCard key={match._id} match={match} />
              ))}
            </ScrollView>
          </View>
        )}

        {renderDateSection(getDateLabel(selectedDate), matches || [])}

        {!isLoading && !matches?.length && (
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>{t("home.empty.noMatches")}</Text>
          </View>
        )}

        {/* 월드컵 배너 */}
        <WorldCupBanner />

        {/* 우즈벡 선수 */}
        <UzbekPlayers />

        {/* 최신 뉴스 */}
        <NewsSection />

        {/* AI 예측 */}
        <PredictionSection matches={matches ?? []} />

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: 40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface2,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border2,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: Colors.text,
    },
    leagueChipContainer: {
      backgroundColor: Colors.surface2,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border2,
      paddingVertical: 10,
    },
    leagueChipContent: {
      paddingHorizontal: 16,
      alignItems: "center",
      gap: 8,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: Colors.background_compat,
      borderWidth: 1,
      borderColor: Colors.border2,
      gap: 5,
      // iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      // Android
      elevation: 5,
    },
    chipActive: {
      backgroundColor: Colors.tabBarActive,
      borderColor: Colors.primary,
      // iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      // Android
      elevation: 5,
    },

    logoBox: {
      width: 20,
      height: 20,
      borderRadius: 50,
      backgroundColor: Colors.logoBox,
      alignItems: "center",
      justifyContent: "center",
    },
    chipLogo: {
      width: 16,
      height: 16,
    },
    chipText: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    chipTextActive: {
      color: Colors.text2,
    },
    allLeaguesBtn: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.primary,
      gap: 4,
    },
    allLeaguesBtnText: {
      fontSize: 12,
      color: Colors.primary,
      fontWeight: "500",
    },
    section: {
      marginTop: 12,
    },
    liveHeader: {
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: "#fff0f0",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 5,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.live,
    },
    liveText: {
      fontSize: 12,
      fontWeight: "700",
      color: Colors.live,
    },
    dateHeader: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginTop: 8,
    },
    dateHeaderText: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
    },
    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#fff0f0",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 5,
    },
    leagueGroup: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 12,
      overflow: "hidden",
      // iOS
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      // Android
      elevation: 5,
    },
    leagueHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: Colors.background,
      gap: 8,
    },
    leagueLogo: {
      width: 20,
      height: 20,
      backgroundColor: "#f8f8f8",
    },
    leagueName: {
      fontSize: 13,
      fontWeight: "700",
      color: Colors.text,
      flex: 1,
    },
    leagueCountry: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
      gap: 12,
    },
    emptyText: {
      color: Colors.textSecondary,
      fontSize: 15,
    },

    adBanner: {
      marginHorizontal: 16,
      marginVertical: 8,
      height: 60,
      backgroundColor: "#e8f0fe",
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
      borderStyle: "dashed",
    },
    adText: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    bellButton: { position: "relative", padding: 4 },
    badge: {
      position: "absolute",
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#ef4444",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    badgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  });
