import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, getColors } from "../../constants/colors";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { News } from "../../types";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";

export default function NewsSection() {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: news } = useQuery<News[]>({
    queryKey: ["news", "latest"],
    queryFn: () => api.get(`${ENDPOINTS.news}?limit=3`),
    staleTime: 1000 * 60 * 5,
  });

  if (!news || news.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("newsSection.title")}</Text>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/news")}
          style={styles.moreBtn}
        >
          <Text style={styles.moreText}>{t("newsSection.seeAll")}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 뉴스 목록 */}
      {news.map((item, index) => (
        <TouchableOpacity
          key={item._id}
          style={[
            styles.newsItem,
            index < news.length - 1 && styles.newsItemBorder,
          ]}
          onPress={() => router.push(`/news/${item._id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.newsContent}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>

            {/* 여기 item.title.en 은 i18n이 아니라 "콘텐츠 언어" 문제라서,
                나중에 language 상태로 item.title[language]로 바꾸는 게 맞음 */}
            <Text style={styles.newsTitle} numberOfLines={2}>
              {item.title.en}
            </Text>

            <Text style={styles.newsDate}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          </View>

          {item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.newsImage}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
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
    newsItem: {
      flexDirection: "row",
      padding: 12,
      gap: 12,
    },
    newsItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    newsContent: {
      flex: 1,
      gap: 4,
    },
    categoryBadge: {
      alignSelf: "flex-start",
      backgroundColor: "#e8f0fe",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    categoryText: {
      fontSize: 10,
      color: Colors.textSecondary,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    newsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.text,
      lineHeight: 20,
    },
    newsDate: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    newsImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
  });
