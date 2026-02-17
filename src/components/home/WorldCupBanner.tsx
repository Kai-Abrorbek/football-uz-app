import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WorldCupBanner() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/worldcup")}
      activeOpacity={0.9}
    >
      <View style={styles.background}>
        {/* 왼쪽 */}
        <View style={styles.left}>
          <Text style={styles.badge}>2026</Text>
          <Text style={styles.title}>FIFA World Cup</Text>
          <Text style={styles.subtitle}>USA · Canada · Mexico</Text>
          <View style={styles.uzBadge}>
            <Text style={styles.uzText}>🇺🇿 Uzbekistan</Text>
          </View>
        </View>

        {/* 오른쪽 */}
        <View style={styles.right}>
          <Text style={styles.emoji}>🏆</Text>
          <View style={styles.arrow}>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  background: {
    backgroundColor: "#1a3c6e",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  badge: {
    fontSize: 11,
    color: "#ffd700",
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 12,
    color: "#a0b4cc",
  },
  uzBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#2d5a8e",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  uzText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  right: {
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 40,
  },
  arrow: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 4,
  },
});
