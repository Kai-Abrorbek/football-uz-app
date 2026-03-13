import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import { getColors } from "../../constants/colors";
import { useColors } from "../../hooks/useColors";
import { useTranslation } from "react-i18next";

interface Tab {
  key: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function MatchTabs({ tabs, activeTab, onTabChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {t(`matchTabs.${tab.key}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.surface2,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border2,
    },
    content: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 6,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border2,
    },
    tabActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.textSecondary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: "500",
      color: Colors.textSecondary,
    },
    tabTextActive: {
      color: Colors.border,
      fontWeight: "700",
    },
  });
