import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../../constants/colors";
import { Match } from "../../../types";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  match: Match;
}

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = 210;

export default function PlayerRatingTab({ match }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [ratings, setRatings] = useState<{ [key: number]: number }>({});

  const lineup = match.lineups;

  if (!lineup || (!lineup.home && !lineup.away)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>라인업 정보가 없습니다</Text>
      </View>
    );
  }

  const currentLineup = selectedTeam === "home" ? lineup.home : lineup.away;
  const players = currentLineup?.startXI || [];

  const handleRating = (playerId: number, rating: number) => {
    setRatings((prev) => ({ ...prev, [playerId]: rating }));
  };

  const tabLeft = selectedTeam === "home" ? 0 : SCREEN_W / 2;

  const data = useMemo(
    () =>
      players.map((p: any, idx: number) => ({
        ...p,
        _key: `${p.playerId ?? idx}-${selectedTeam}`,
      })),
    [players, selectedTeam],
  );

  function BestRatingsSection() {
    const items = [
      {
        rank: 1,
        name: "C. 에체베리",
        detail: "18분, 1슈팅, 0골, 0도움",
        rating: 4.1,
      },
      {
        rank: 2,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 3,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 4,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 5,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 6,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 7,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 8,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 9,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 10,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
      {
        rank: 11,
        name: "T. 르마",
        detail: "67분, 1골, 1슈팅, 0도움",
        rating: 4.0,
      },
    ];

    return (
      <ScrollView
        style={styles.bestWrap}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        contentContainerStyle={{ paddingBottom: 12 }}
      >
        <Text style={styles.bestTitle}>이 경기의 최고 평점</Text>
        <Text style={styles.bestSub}>사용자 평가 233,378개 기준</Text>

        {items.map((it) => (
          <View key={it.rank} style={styles.bestRow}>
            <Text style={styles.bestRank}>{it.rank}</Text>

            <View style={styles.bestInfo}>
              <Text style={styles.bestName}>{it.name}</Text>
              <Text style={styles.bestDetail}>{it.detail}</Text>
            </View>

            <View style={styles.bestRight}>
              <View style={styles.bestPhoto} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{it.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={12} color="#f4c542" />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>이 경기에 출전한 선수 평가하기</Text>
      </View>

      <View style={styles.teamTabs}>
        <TouchableOpacity
          style={styles.teamTab}
          onPress={() => setSelectedTeam("home")}
          activeOpacity={0.8}
        >
          <Image
            source={match.homeTeam.logo}
            style={styles.tabLogo}
            contentFit="contain"
          />
          <Text style={styles.tabText}>{match.homeTeam.name}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.teamTab}
          onPress={() => setSelectedTeam("away")}
          activeOpacity={0.8}
        >
          <Image
            source={match.awayTeam.logo}
            style={styles.tabLogo}
            contentFit="contain"
          />
          <Text style={styles.tabText}>{match.awayTeam.name}</Text>
        </TouchableOpacity>

        <View style={[styles.tabIndicator, { left: tabLeft }]} />
      </View>

      {/* 선수 카드 2열 그리드 */}
      <FlatList
        data={data}
        keyExtractor={(item: any) => item._key}
        horizontal
        style={{ width: 450 }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playerList}
        renderItem={({ item }: any) => {
          const playerRating = ratings[item.playerId] || 0;
          const lastName =
            item.playerName?.split(" ").slice(-1)[0] || "Unknown";

          return (
            <View style={[styles.playerCard, { width: CARD_W }]}>
              {/* 더보기 */}
              <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
                <Ionicons
                  name="ellipsis-vertical"
                  size={16}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {/* 상단: 사진 + 정보 */}
              <View style={styles.topRow}>
                <View style={styles.photoWrap}>
                  {item.photo ? (
                    <Image
                      source={item.photo}
                      style={styles.photo}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.photoFallback}>
                      <Text style={styles.photoFallbackText}>
                        {item.playerName?.charAt(0) || "?"}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {lastName}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.pos} #{item.number}
                  </Text>
                </View>
              </View>

              {/* 별점 */}
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(item.playerId, star)}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={star <= playerRating ? "star" : "star-outline"}
                      size={18}
                      color={star <= playerRating ? "#f4c542" : "#d0d0d0"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }}
      />
      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          선수 평점은 합산되며 다른 사용자에게는 평균 평점이 표시됩니다.
        </Text>
      </View>

      {/* 최고 평점 섹션 */}
      <BestRatingsSection />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary },

  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.text },

  teamTabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    position: "relative",
  },
  teamTab: {
    width: SCREEN_W / 2,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabLogo: { width: 18, height: 18 },
  tabText: { fontSize: 13, fontWeight: "700", color: Colors.text },

  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: SCREEN_W / 2,
    height: 3,
    backgroundColor: Colors.primary,
  },

  playerList: {
    paddingHorizontal: 10,
    // paddingVertical: 16,
    gap: 12,
    marginTop: 10,
    // marginBottom: 10,
  },
  playerCard: {
    height: 450,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    minHeight: 108,
    position: "relative",
  },

  moreBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 18,
  },

  photoWrap: { width: 44, height: 44 },
  photo: { width: 44, height: 44, borderRadius: 22 },
  photoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textSecondary,
  },

  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: "800", color: Colors.text },
  sub: { fontSize: 12, color: Colors.textSecondary },

  stars: {
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  noteBox: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  noteText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  bestWrap: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
  },

  bestTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
    paddingHorizontal: 16,
  },
  bestSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },

  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 70, // 추가
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },

  bestRank: {
    width: 22,
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text,
  },
  bestInfo: {
    flex: 1,
    gap: 4,
  },
  bestName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  bestDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  bestRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  bestPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff3cd",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.text,
  },
  bestPhotoText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  bestTeamLogo: {
    width: 20,
    height: 20,
  },
});
