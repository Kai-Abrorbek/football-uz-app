import { TouchableOpacity, Text, StyleSheet, Image } from "react-native";
import { Colors, getColors } from "../../constants/colors";
import { League } from "../../types";
import { useColors } from "../../hooks/useColors";

interface Props {
  league: League;
  isSelected: boolean;
  onPress: () => void;
}

export default function LeagueChip({ league, isSelected, onPress }: Props) {
  const Colors = useColors();
  const styles = getStyles(Colors);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: league.logo }}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.text, isSelected && styles.textActive]}>
        {league.name}
      </Text>
    </TouchableOpacity>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
      marginRight: 8,
      gap: 6,
    },
    containerActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    logo: {
      width: 16,
      height: 16,
    },
    text: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    textActive: {
      color: "#ffffff",
    },
  });
