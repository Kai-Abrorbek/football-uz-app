import { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Colors } from "../../constants/colors";

interface Tab {
  key: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function MatchTabs({ tabs, activeTab, onTabChange }: Props) {
  const scrollRef = useRef<ScrollView>(null);

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
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
