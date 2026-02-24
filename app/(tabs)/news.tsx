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
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

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
  { id: "all", i18nKey: "news.category.all", leagueId: null },
  { id: "premier", i18nKey: "news.category.premier", leagueId: 39 },
  { id: "laliga", i18nKey: "news.category.laliga", leagueId: 140 },
  { id: "ligue1", i18nKey: "news.category.ligue1", leagueId: 61 },
  { id: "bundesliga", i18nKey: "news.category.bundesliga", leagueId: 78 },
  { id: "seriea", i18nKey: "news.category.seriea", leagueId: 135 },
  { id: "saudi", i18nKey: "news.category.saudi", leagueId: 347 },
  { id: "ucl", i18nKey: "news.category.ucl", leagueId: 2 },
  { id: "uel", i18nKey: "news.category.uel", leagueId: 3 },
  { id: "turkey", i18nKey: "news.category.turkey", leagueId: 203 },
  { id: "worldcup", i18nKey: "news.category.worldcup", leagueId: 1 },
  { id: "euro", i18nKey: "news.category.euro", leagueId: 4 },
  { id: "copa", i18nKey: "news.category.copa", leagueId: 9 },
  { id: "afcon", i18nKey: "news.category.afcon", leagueId: 31 },
] as const;

export default function NewsScreen() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const selectedLeague = CATEGORIES.find(
    (c) => c.id === activeCategory,
  )?.leagueId;

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

    if (diffInMinutes < 1) return t("news.timeAgo.justNow");
    if (diffInMinutes < 60)
      return t("news.timeAgo.minutes", { count: diffInMinutes });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInMinutes < 1440)
      return t("news.timeAgo.hours", { count: diffInHours });

    const diffInDays = Math.floor(diffInMinutes / 1440);
    return t("news.timeAgo.days", { count: diffInDays });
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
              <Text style={styles.heroBadgeText}>{t("news.heroBadge")}</Text>
            </View>

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

  const renderNewsCard = (news: News) => {
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
        <Text style={styles.adLabel}>{t("news.adLabel")}</Text>
        <Text style={styles.adText}>{t("news.adText")}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
              {t(cat.i18nKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderHeroNews()}

        {newsList?.slice(1).map((news, index) => {
          const shouldShowAd = (index + 1) % 4 === 0;
          return (
            <View key={news._id}>
              {renderNewsCard(news)}
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
