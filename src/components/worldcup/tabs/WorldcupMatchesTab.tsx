// src/components/worldcup/tabs/WorldcupMatchesTab.tsx
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { useTranslation } from "react-i18next";
import { Match } from "../../../types";
import WorldcupMatchesList from "../WorldcupMatchesList";
import WorldcupMatchesModal from "../WorldcupMatchesModal";

interface Props {
  matches: Match[];
  teamGroupMap?: Record<number, string>;
}

export default function WorldcupMatchesTab({ matches, teamGroupMap }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"group" | "tournament">("group");
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const filteredMatches = matches.filter((m) =>
    activeTab === "group"
      ? m.round?.includes("Group Stage")
      : !m.round?.includes("Group Stage"),
  );

  return (
    <View style={styles.container}>
      <WorldcupMatchesList
        matches={filteredMatches}
        teamGroupMap={teamGroupMap}
      />

      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.moreButtonText}>{t("worldcup.moreMatches")}</Text>
      </TouchableOpacity>

      <WorldcupMatchesModal
        visible={modalVisible}
        teamGroupMap={teamGroupMap}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    subTabs: {
      flexDirection: "row",
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    subTab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    subTabActive: { borderBottomColor: Colors.primary },
    subTabText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.textSecondary,
    },
    subTabTextActive: { color: Colors.primary },
    moreButton: {
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 24,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      backgroundColor: Colors.surface,
    },
    moreButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.primary,
    },
  });
