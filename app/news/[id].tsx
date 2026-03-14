import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { News } from "../../src/types"; // 너 타입 위치에 맞게
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { AuthGate } from "../../src/contexts/AuthGate";

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: news, isLoading } = useQuery<News>({
    queryKey: ["news-detail", id],
    queryFn: () => api.get(`${ENDPOINTS.news}/${id}`),
    staleTime: 1000 * 60 * 10,
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishedDate = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - publishedDate.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 60) {
      return t("time.minutesAgo", { count: diffInMinutes });
    }
    if (diffInMinutes < 1440) {
      return t("time.hoursAgo", { count: Math.floor(diffInMinutes / 60) });
    }
    return t("time.daysAgo", { count: Math.floor(diffInMinutes / 1440) });
  };

  const handleShare = async () => {
    if (!news) return;
    try {
      const lang = i18n.language as "en" | "kr" | "uz" | "ru";
      await Share.share({
        message: `${news.title?.[lang] ?? news.title?.en}\n\n${news.sourceUrl}`,
        url: news.sourceUrl,
      });
    } catch (error) {
      console.error(t("newsDetail.shareFail"), error);
    }
  };

  const handleOpenSource = () => {
    if (news?.sourceUrl) Linking.openURL(news.sourceUrl);
  };

  if (isLoading || !news) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lang = i18n.language as "en" | "kr" | "uz" | "ru";

  return (
    <AuthGate>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="bookmark-outline" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 히어로 이미지 */}
          {news.imageUrl && (
            <View style={styles.heroContainer}>
              <Image
                source={news.imageUrl}
                style={styles.heroImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.6)"]}
                style={styles.heroGradient}
              />
            </View>
          )}

          {/* 컨텐츠 */}
          <View style={styles.contentContainer}>
            {/* 카테고리 뱃지 */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {(news.category ?? "").toUpperCase()}
              </Text>
            </View>

            {/* 제목 */}
            <Text style={styles.title}>
              {news.title?.[lang] ?? news.title?.en}
            </Text>

            {/* 메타 정보 */}
            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <View style={styles.sourceContainer}>
                  <Ionicons
                    name="newspaper-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.source}>{news.source}</Text>
                </View>
                <View style={styles.timeContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.time}>
                    {getTimeAgo(news.publishedAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* 요약 */}
            {news.summary && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  {news?.summary?.[lang] ?? news.summary?.en}
                </Text>
              </View>
            )}

            {/* 본문 */}
            <Text style={styles.content}>
              {news.content?.[lang] ?? news.content?.en}
            </Text>

            {/* 원문 보기 */}
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={handleOpenSource}
            >
              <Text style={styles.sourceButtonText}>
                {t("newsDetail.openSource")}
              </Text>
              <Ionicons name="open-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>

            {/* 공유 섹션 */}
            <View style={styles.shareSection}>
              <Text style={styles.shareSectionTitle}>
                {t("newsDetail.shareSectionTitle")}
              </Text>

              <View style={styles.shareButtons}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Ionicons
                    name="share-social"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.shareButtonText}>
                    {t("common.share")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="bookmark" size={24} color={Colors.primary} />
                  <Text style={styles.shareButtonText}>{t("common.save")}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color={Colors.primary}
                  />
                  <Text style={styles.shareButtonText}>
                    {t("common.comments")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </AuthGate>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontSize: 14,
      color: Colors.textSecondary,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    headerActions: {
      flexDirection: "row",
      gap: 8,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    heroContainer: {
      width: "100%",
      height: 300,
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    heroGradient: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 100,
    },
    contentContainer: {
      padding: 20,
    },
    categoryBadge: {
      alignSelf: "flex-start",
      backgroundColor: Colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    categoryText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#ffffff",
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: Colors.text,
      lineHeight: 36,
      marginBottom: 16,
    },
    metaContainer: {
      marginBottom: 20,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    sourceContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    source: {
      fontSize: 13,
      fontWeight: "600",
      color: Colors.primary,
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    time: {
      fontSize: 13,
      color: Colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginBottom: 20,
    },
    summaryContainer: {
      backgroundColor: "#f8f9fa",
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary,
      borderRadius: 8,
      marginBottom: 24,
    },
    summaryText: {
      fontSize: 16,
      lineHeight: 24,
      color: Colors.text,
      fontWeight: "500",
      fontStyle: "italic",
    },
    content: {
      fontSize: 16,
      lineHeight: 28,
      color: Colors.text,
      marginBottom: 32,
    },
    sourceButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 24,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.primary,
      gap: 8,
      marginBottom: 32,
    },
    sourceButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.primary,
    },
    shareSection: {
      backgroundColor: Colors.surface,
      padding: 20,
      borderRadius: 16,
    },
    shareSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      marginBottom: 16,
    },
    shareButtons: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    shareButton: {
      alignItems: "center",
      gap: 8,
    },
    shareButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: Colors.text,
    },
  });
