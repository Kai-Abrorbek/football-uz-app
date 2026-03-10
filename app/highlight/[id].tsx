import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";

export default function HighlightScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const Colors = useColors();
  const styles = getStyles(Colors);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
      <WebView
        style={{ flex: 1 }}
        source={{ uri: `https://www.youtube.com/embed/${videoId}?autoplay=1` }}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    backBtn: {
      position: "absolute",
      top: 50,
      left: 16,
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 4,
    },
  });
