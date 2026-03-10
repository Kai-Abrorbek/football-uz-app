import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";

export default function HighlightScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const Colors = useColors();
  const styles = getStyles(Colors);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* X 버튼을 iframe 바깥 위쪽에 배치 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <iframe
        style={{
          flex: 1,
          border: "none",
          width: "100%",
          height: "calc(100% - 60px)", // 헤더 높이만큼 빼기
        }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        allowFullScreen
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    header: {
      height: 60,
      backgroundColor: "#000",
      justifyContent: "center",
      paddingLeft: 16,
      paddingTop: 10,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
  });
