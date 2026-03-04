import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

export default function WorldcupOverviewTab({ matches, teamGroupMap }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const previewMatches = matches.slice(0, 4);

  return (
    <View style={styles.container}>
      <WorldcupMatchesList
        matches={previewMatches}
        teamGroupMap={teamGroupMap}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.moreButtonText}>
              {t("worldcup.moreMatches")}
            </Text>
          </TouchableOpacity>
        }
      />

      <WorldcupMatchesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    section: { paddingTop: 16 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.text,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
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
    moreButtonText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
  });
