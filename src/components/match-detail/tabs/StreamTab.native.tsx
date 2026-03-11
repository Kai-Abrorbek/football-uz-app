import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { useColors } from "../../../hooks/useColors";
import { getColors } from "../../../constants/colors";
import { Match } from "../../../types";
import { useTranslation } from "react-i18next";

const { width: SCREEN_W } = Dimensions.get("window");

interface Props {
  match: Match;
}

export default function StreamTab({ match }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: match.streamUrl! }}
        style={styles.player}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
      />
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    player: {
      width: SCREEN_W,
      height: SCREEN_W * (9 / 16),
      backgroundColor: "#000",
    },
  });
