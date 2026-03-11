import { View, StyleSheet, Dimensions } from "react-native";
import { Match } from "../../../types";

const { width: SCREEN_W } = Dimensions.get("window");

interface Props {
  match: Match;
}

export default function StreamTab({ match }: Props) {
  return (
    <View style={styles.container}>
      <iframe
        src={match.streamUrl!}
        style={{ width: SCREEN_W, height: SCREEN_W * (9 / 16), border: "none" }}
        allowFullScreen
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
