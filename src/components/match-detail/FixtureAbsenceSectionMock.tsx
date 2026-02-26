import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { Colors } from "../../constants/colors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TeamSide = "home" | "away";

type Props = {
  // 나중에 API로 바꿀 때 이 값으로 요청하면 됨
  fixtureId: number;
  // 섹션을 외부에서 제어하고 싶으면 쓸 수 있게 열어둠(옵션)
  defaultOpen?: boolean;
  // 기본으로 보여줄 개수
  previewCount?: number;
};

export default function FixtureAbsenceSectionMock({
  fixtureId,
  defaultOpen = true,
  previewCount = 3,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTeam, setActiveTeam] = useState<TeamSide>("home");
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["fixtureAbsences", fixtureId],
    queryFn: async () => {
      const url = `${ENDPOINTS.fixtureabsence(fixtureId)}`;
      const result = await api.get(url);
      return result;
    },
  });

  const team = activeTeam === "home" ? data?.home : data?.away;

  const visiblePlayers = useMemo(() => {
    const list = team?.players ?? [];
    if (expanded) return list;
    return list.slice(0, previewCount);
  }, [team?.players, expanded, previewCount]);

  const hasMore = (team?.players?.length ?? 0) > previewCount;

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((v) => !v);
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const onSelectTeam = (side: TeamSide) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTeam(side);
    setExpanded(false); // 탭 바꾸면 더보기는 접기
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>부상 및 출장 정지</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chevBtn}
            onPress={toggleOpen}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={22}
              color="#666"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      {isOpen && (
        <View>
          {/* Tabs */}
          <View style={styles.tabsRow}>
            <TeamTab
              active={activeTeam === "home"}
              name={data?.home?.name}
              logo={data?.home?.logo}
              onPress={() => onSelectTeam("home")}
            />
            <TeamTab
              active={activeTeam === "away"}
              name={data?.away?.name}
              logo={data?.away?.logo}
              onPress={() => onSelectTeam("away")}
            />
          </View>

          <View style={styles.tabIndicatorWrap}>
            <View
              style={[
                styles.tabIndicator,
                activeTeam === "home" ? { left: "0%" } : { left: "50%" },
              ]}
            />
          </View>

          {/* List */}
          <View style={styles.listWrap}>
            {visiblePlayers.length === 0 ? (
              <Text style={styles.emptyText}>결장자가 없습니다.</Text>
            ) : (
              visiblePlayers.map((p: any) => (
                <AbsenceRow key={p.playerId} p={p} />
              ))
            )}
          </View>

          {/* More */}
          {hasMore && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={toggleExpanded}
              activeOpacity={0.85}
            >
              <Text style={styles.moreText}>더보기</Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#555"
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Menu (⋮) */}
      <Modal transparent visible={menuVisible} animationType="fade">
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => setMenuVisible(false)}
        >
          <View />
        </Pressable>

        <View style={styles.menuSheet}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              // 나중에 실제 데이터일 때 refetch 넣으면 됨
              // refetch();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#222" />
            <Text style={styles.menuText}>새로고침</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#222"
            />
            <Text style={styles.menuText}>정보</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------- Sub Components -------------------- */

function TeamTab({
  active,
  name,
  logo,
  onPress,
}: {
  active: boolean;
  name: string;
  logo?: string | null;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.tabInner}>
        {logo ? (
          <Image source={logo} style={styles.teamLogo} contentFit="contain" />
        ) : (
          <View style={styles.teamLogoPlaceholder} />
        )}
        <Text
          style={[styles.teamName, active && styles.teamNameActive]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AbsenceRow({ p }: { p: any }) {
  return (
    <View style={styles.row}>
      <View style={styles.avatarWrap}>
        {p.photo ? (
          <Image source={p.photo} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Ionicons name="person" size={28} color="#b8b8b8" />
          </View>
        )}

        {/* red + badge */}
        <View style={styles.badge}>
          <Ionicons name="add" size={14} color="#fff" />
        </View>
      </View>

      <View style={styles.rowText}>
        <Text style={styles.playerLine} numberOfLines={1}>
          <Text style={styles.playerName}>{p.name}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.playerMeta}>
            {p.position ?? "포지션"}{" "}
            {typeof p.number === "number" ? `#${p.number}` : ""}
          </Text>
        </Text>

        <Text style={styles.statusText} numberOfLines={1}>
          {p.reason ?? ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },

  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  chevBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: "92%",
  },
  teamLogo: {
    width: 26,
    height: 26,
  },
  teamLogoPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.background,
  },
  teamName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  teamNameActive: {
    color: Colors.text,
  },

  tabIndicatorWrap: {
    height: 2,
    backgroundColor: "#e9e9e9",
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    width: "50%",
    height: 2,
    backgroundColor: "#1f6feb",
  },

  listWrap: {
    paddingTop: 4,
  },
  emptyText: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: "#666",
    fontSize: 14,
  },

  row: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ededed",
  },

  avatarWrap: {
    width: 56,
    height: 56,
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0f0",
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#d32f2f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  rowText: {
    flex: 1,
    gap: 6,
  },
  playerLine: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  dot: {
    color: "#999",
    fontWeight: "600",
  },
  playerMeta: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8a8a8a",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#666",
  },

  moreBtn: {
    marginTop: 14,
    marginHorizontal: 16,
    height: 54,
    borderRadius: 28,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  moreText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuSheet: {
    position: "absolute",
    top: 72,
    right: 16,
    width: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
});
