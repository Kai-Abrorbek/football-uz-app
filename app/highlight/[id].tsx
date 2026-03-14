import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import YoutubeIframe from "react-native-youtube-iframe";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../src/hooks/useColors";
import { getColors } from "../../src/constants/colors";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthGate } from "../../src/contexts/AuthGate";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function HighlightScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const insets = useSafeAreaInsets();

  return (
    <AuthGate>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <YoutubeIframe
          height={SCREEN_W * (9 / 16)}
          width={SCREEN_W}
          videoId={videoId}
          play={true}
          webViewProps={{
            androidLayerType: "hardware",
            mediaPlaybackRequiresUserAction: false,
          }}
          initialPlayerParams={{
            autoplay: 1,
            controls: 1,
          }}
        />
      </View>
    </AuthGate>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
      justifyContent: "center",
    },
    backBtn: {
      position: "absolute",
      left: 16,
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.5)",
      borderRadius: 20,
      padding: 4,
    },
  });
