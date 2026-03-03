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
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { ENDPOINTS } from "../../constants/api";
import { getColors } from "../../constants/colors";
import { useColors } from "../../hooks/useColors";
import { router } from "expo-router";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TeamSide = "home" | "away";

type Props = {
  fixtureId: number;
  defaultOpen?: boolean;
  previewCount?: number;
};

import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

// 프로젝트 설정에 따라 수정 필요
// import { api, ENDPOINTS } from "@/api";
// import { useColors } from "@/hooks/useColors";
// import { getStyles } from "./styles";

export default function FixtureAbsenceSectionMock({
  fixtureId,
  defaultOpen = true,
  previewCount = 3,
}: any) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
  const [expanded, setExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // 아래 훅들과 스타일은 아브로르의 프로젝트 환경에 맞게 정의되어 있다고 가정할게
  const Colors = useColors();
  const styles = getStyles(Colors);

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
    setIsOpen((v: any) => !v);
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const onSelectTeam = (side: "home" | "away") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTeam(side);
    setExpanded(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t("absence.title")}</Text>

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
              <Text style={styles.emptyText}>{t("absence.noAbsentees")}</Text>
            ) : (
              visiblePlayers.map((p: any) => (
                <AbsenceRow key={p.playerId} p={p} t={t} router={router} />
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
              <Text style={styles.moreText}>{t("absence.more")}</Text>
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
              // refetch(); // 필요한 경우 활성화
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#222" />
            <Text style={styles.menuText}>{t("absence.refresh")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setMenuVisible(false)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#222"
            />
            <Text style={styles.menuText}>{t("absence.info")}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------- Sub Components -------------------- */

function TeamTab({ active, name, logo, onPress }: any) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  return (
    <TouchableOpacity
      style={styles.tabBtn}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.tabInner}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.teamLogo} />
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

function AbsenceRow({ p, t, router }: any) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  return (
    <Pressable onPress={() => router.push(`player/${p.playerId}`)}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          {p.photo ? (
            <Image source={{ uri: p.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={28} color="#b8b8b8" />
            </View>
          )}
          <View style={styles.badge}>
            <Ionicons name="add" size={14} color="#fff" />
          </View>
        </View>

        <View style={styles.rowText}>
          <Text style={styles.playerLine} numberOfLines={1}>
            <Text style={styles.playerName}>{p.name}</Text>
            <Text style={styles.dot}> · </Text>
            <Text style={styles.playerMeta}>
              {p.position ?? t("absence.position")}{" "}
              {typeof p.number === "number" ? `#${p.number}` : ""}
            </Text>
          </Text>

          <Text style={styles.statusText} numberOfLines={1}>
            {p.reason ?? ""}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
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
      color: Colors.text,
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
      backgroundColor: Colors.background,
    },
    tabIndicator: {
      position: "absolute",
      top: 0,
      width: "50%",
      height: 2,
      backgroundColor: Colors.tabBarActive,
    },

    listWrap: {
      paddingTop: 4,
    },
    emptyText: {
      paddingHorizontal: 18,
      paddingVertical: 14,
      color: Colors.text,
      fontSize: 14,
    },

    row: {
      paddingHorizontal: 18,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
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
      backgroundColor: Colors.background,
    },
    avatarFallback: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.background,
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
      borderColor: Colors.border,
    },

    rowText: {
      flex: 1,
      gap: 6,
    },
    playerLine: {
      fontSize: 22,
      fontWeight: "700",
      color: Colors.text,
    },
    playerName: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
    },
    dot: {
      color: Colors.text,
      fontWeight: "600",
    },
    playerMeta: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "700",
      color: Colors.text,
    },

    moreBtn: {
      marginTop: 14,
      marginHorizontal: 16,
      height: 54,
      borderRadius: 28,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    moreText: {
      fontSize: 16,
      fontWeight: "600",
      color: Colors.text,
    },

    menuBackdrop: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    menuSheet: {
      position: "absolute",
      top: 72,
      right: 16,
      width: 180,
      backgroundColor: Colors.text,
      borderRadius: 12,
      paddingVertical: 8,
      shadowColor: Colors.text,
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
      color: Colors.text,
    },
  });
