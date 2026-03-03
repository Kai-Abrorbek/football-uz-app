import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

export default function LeagueTabs({ tabs, activeTab, onTabChange }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
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
              {t(`leagueTabs.${tab.key}`)}
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
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    tab: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tabActive: {
      backgroundColor: Colors.text,
      borderColor: Colors.text,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "500",
      color: Colors.textSecondary,
    },
    tabTextActive: {
      color: Colors.border,
      fontWeight: "700",
    },
  });
