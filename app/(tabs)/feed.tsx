import React, { useCallback, useRef, useState } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";
import YoutubeIframe from "react-native-youtube-iframe";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../../src/services/api";
import { ENDPOINTS } from "../../src/constants/api";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const LIMIT = 10;

function FeedItem({
  item,
  isActive,
  insets,
}: {
  item: any;
  isActive: boolean;
  insets: any;
}) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const match = item.match;
  const homeGoals = match?.goals?.home ?? 0;
  const awayGoals = match?.goals?.away ?? 0;
  const isFinished = match?.status?.short === "FT";

  return (
    <View style={styles.itemContainer}>
      {match && (
        <View style={[styles.matchInfo, { paddingTop: insets.top + 4 }]}>
          <View style={styles.teamInfo}>
            <Image
              source={match.homeTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.homeTeam.name}
            </Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.score}>
              {isFinished ? `${homeGoals} - ${awayGoals}` : "vs"}
            </Text>
          </View>
          <View style={styles.teamInfo}>
            <Image
              source={match.awayTeam.logo}
              style={styles.teamLogo}
              contentFit="contain"
            />
            <Text style={styles.teamName} numberOfLines={1}>
              {match.awayTeam.name}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.videoWrapper}>
        <YoutubeIframe
          key={isActive ? item._id : `${item._id}-inactive`}
          height={SCREEN_W * (9 / 16)}
          width={SCREEN_W}
          videoId={item.videoId}
          play={isActive} // isActive가 false면 자동 pause
          webViewProps={{
            androidLayerType: "hardware",
            mediaPlaybackRequiresUserAction: false,
          }}
          initialPlayerParams={{
            autoplay: 1,
            controls: 1,
          }}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {match && (
          <TouchableOpacity
            style={styles.matchBtn}
            onPress={() => router.push(`/match/${item.matchId}`)}
          >
            <Ionicons name="football-outline" size={16} color="#fff" />
            <Text style={styles.matchBtnText}>경기 보기</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["highlights-feed"],
      queryFn: ({ pageParam = 1 }) =>
        api.get(ENDPOINTS.highlights(pageParam, LIMIT)),
      getNextPageParam: (lastPage: any) =>
        lastPage.hasMore ? lastPage.page + 1 : undefined,
      initialPageParam: 1,
    });

  const items = data?.pages.flatMap((p: any) => p.items) ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
        // 마지막 3개 남으면 다음 페이지 로드
        if (idx >= items.length - 3 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    },
    [items.length, hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <FeedItem item={item} isActive={index === currentIndex} insets={insets} />
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>하이라이트</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_H}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="large"
              color="#fff"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
    itemContainer: {
      height: SCREEN_H,
      width: SCREEN_W,
      backgroundColor: "#000",
      justifyContent: "space-around",
    },
    videoWrapper: {
      width: SCREEN_W,
      height: SCREEN_W * (9 / 16),
    },
    infoBox: {
      padding: 16,
      gap: 10,
      backgroundColor: "#000",
    },
    overlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      gap: 10,
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    matchBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      alignSelf: "flex-start",
    },
    matchBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#fff",
    },

    matchInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 24,
      gap: 8,
    },
    teamInfo: {
      flex: 1,
      alignItems: "center",
      gap: 8,
    },
    teamLogo: {
      width: 52,
      height: 52,
    },
    teamName: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
      textAlign: "center",
    },
    scoreBox: {
      paddingHorizontal: 16,
      alignItems: "center",
    },
    score: {
      fontSize: 28,
      fontWeight: "900",
      color: "#fff",
    },
  });
