import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { Colors } from "../../src/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../src/contexts/LanguageContext";
import { Redirect, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";

interface News {
  _id: string;
  title: { en: string; uz: string; ru: string };
  content: { en: string; uz: string; ru: string };
  imageUrl: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
}

const CATEGORIES = [
  { id: "all", label: "전체", leagueId: null },
  { id: "premier", label: "EPL", leagueId: 39 },
  { id: "laliga", label: "라리가", leagueId: 140 },
  { id: "ligue1", label: "리그1", leagueId: 61 },
  { id: "bundesliga", label: "분데스", leagueId: 78 },
  { id: "seriea", label: "세리에", leagueId: 135 },
  { id: "saudi", label: "사우디", leagueId: 347 },
  { id: "ucl", label: "UCL", leagueId: 2 },
  { id: "uel", label: "UEL", leagueId: 3 },
  { id: "turkey", label: "터키", leagueId: 203 },
  { id: "worldcup", label: "월드컵", leagueId: 1 },
  { id: "euro", label: "유로", leagueId: 4 },
  { id: "copa", label: "코파", leagueId: 9 },
  { id: "afcon", label: "아프컵", leagueId: 31 },
];

export default function NewsScreen() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { userData, setUser, logout } = useAuth();

  const selectedLeague = CATEGORIES.find(
    (c) => c.id === activeCategory,
  )?.leagueId;

  // 뉴스 조회
  const { data: newsList, refetch } = useQuery<News[]>({
    queryKey: ["news", selectedLeague],
    queryFn: () => {
      if (selectedLeague) {
        return api.get(`${ENDPOINTS.news}/league/${selectedLeague}?limit=30`);
      }
      return api.get(`${ENDPOINTS.news}?limit=30`);
    },
    staleTime: 1000 * 60 * 5,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNewsPress = (url: string) => {
    Linking.openURL(url);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - publishedDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  const renderHeroNews = () => {
    if (!newsList || newsList.length === 0) return null;
    const hero = newsList[0];

    return (
      <TouchableOpacity
        style={styles.heroCard}
        onPress={() => router.push(`/news/${hero._id}`)}
        activeOpacity={0.9}
      >
        {hero.imageUrl && (
          <Image
            source={hero.imageUrl}
            style={styles.heroImage}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          style={styles.heroOverlay}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>주요 뉴스</Text>
            </View>
            {/* 언어 선택 */}
            <View style={styles.languageSelector}>
              {(["en", "uz", "ru"] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langButton,
                    language === lang && styles.langButtonActive,
                  ]}
                  onPress={() => setLanguage(lang)}
                >
                  <Text
                    style={[
                      styles.langButtonText,
                      language === lang && styles.langButtonTextActive,
                    ]}
                  >
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* 뉴스 제목/내용에 언어 적용 */}
            <Text style={styles.heroTitle} numberOfLines={3}>
              {hero.title[language as "en" | "uz" | "ru"]}
            </Text>
            <View style={styles.heroMeta}>
              <Text style={styles.heroSource}>{hero.source}</Text>
              <Text style={styles.heroDot}>•</Text>
              <Text style={styles.heroTime}>
                {getTimeAgo(hero.publishedAt)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderNewsCard = (news: News, index: number) => {
    return (
      <TouchableOpacity
        key={news._id}
        style={styles.newsCard}
        onPress={() => router.push(`/news/${news._id}`)}
        activeOpacity={0.7}
      >
        {news.imageUrl && (
          <Image
            source={news.imageUrl}
            style={styles.newsImage}
            contentFit="cover"
          />
        )}
        <View style={styles.newsContent}>
          <Text style={styles.newsTitle} numberOfLines={2}>
            {news.title[language]}
          </Text>
          <Text style={styles.newsDescription} numberOfLines={2}>
            {news.content[language]}
          </Text>
          <View style={styles.newsMeta}>
            <Text style={styles.newsSource}>{news.source}</Text>
            <Text style={styles.newsDot}>•</Text>
            <Text style={styles.newsTime}>{getTimeAgo(news.publishedAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAdBanner = (index: number) => {
    return (
      <View key={`ad-${index}`} style={styles.adBanner}>
        <Text style={styles.adLabel}>광고</Text>
        <Text style={styles.adText}>Advertisement</Text>
      </View>
    );
  };

  // if (!userData?.user) {
  //   return <Redirect href="/profile" />;
  // }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 헤더 */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>축구 뉴스</Text>
      </View> */}

      {/* 카테고리 탭 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabs}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryTab,
              activeCategory === cat.id && styles.categoryTabActive,
            ]}
            onPress={() => setActiveCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryTabText,
                activeCategory === cat.id && styles.categoryTabTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 뉴스 목록 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 히어로 뉴스 */}
        {renderHeroNews()}

        {/* 뉴스 카드들 */}
        {newsList?.slice(1).map((news, index) => {
          const shouldShowAd = (index + 1) % 4 === 0;
          return (
            <View key={news._id}>
              {renderNewsCard(news, index)}
              {shouldShowAd && renderAdBanner(index)}
            </View>
          );
        })}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
  },
  categoryTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  categoryTabActive: {
    backgroundColor: Colors.text,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },

  // 히어로 뉴스
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    height: 280,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  languageSelector: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
  },
  langButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langButtonActive: {
    backgroundColor: Colors.primary,
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  langButtonTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSource: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  heroDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  heroTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },

  // 뉴스 카드
  newsCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
    gap: 12,
  },
  newsImage: {
    width: 120,
    height: 120,
  },
  newsContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    justifyContent: "space-between",
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  newsDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  newsSource: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  newsDot: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  newsTime: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // 광고 배너
  adBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
  },
  adLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  adText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
