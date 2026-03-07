import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";

interface Props {
  venueName: string;
  venueCity: string;
}

interface Weather {
  temp: number;
  description: string;
  icon: string;
}

const getWeatherIcon = (icon: string) => {
  if (icon.includes("01")) return "sunny-outline";
  if (icon.includes("02") || icon.includes("03") || icon.includes("04"))
    return "partly-sunny-outline";
  if (icon.includes("09") || icon.includes("10")) return "rainy-outline";
  if (icon.includes("11")) return "thunderstorm-outline";
  if (icon.includes("13")) return "snow-outline";
  return "cloud-outline";
};

export default function VenueWeather({ venueName, venueCity }: Props) {
  const { t } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);

  const { data: weather } = useQuery<Weather>({
    queryKey: ["weather", venueCity],
    queryFn: async () => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${venueCity}&appid=a55632eeeef97e30ed89a1f2b74366c4&units=metric&lang=kr`,
      );
      const data = await res.json();
      return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      };
    },
    staleTime: 1000 * 60 * 30,
    enabled: !!venueCity,
  });

  return (
    <View style={styles.container}>
      {/* 경기장 */}
      <View style={styles.venueRow}>
        <View style={styles.venueIconCircle}>
          <MaterialIcons name="stadium" size={22} color={Colors.primary} />
        </View>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName}>{venueName}</Text>
          <Text style={styles.venueCity}>{venueCity}</Text>
        </View>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            Linking.openURL(
              `https://maps.google.com/?q=${venueName} ${venueCity}`,
            )
          }
        >
          <Ionicons name="location" size={20} color="#22c55e" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* 날씨 */}
      {weather && (
        <View style={styles.weatherRow}>
          <Text style={styles.weatherLabel}>{t("venue.weather")}</Text>
          <View style={styles.weatherInfo}>
            <Ionicons
              name={getWeatherIcon(weather.icon) as any}
              size={22}
              color={Colors.text}
            />
            <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
            <View style={styles.dividerV} />
            <Text style={styles.weatherDesc}>{weather.description}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    venueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    venueIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    venueInfo: { flex: 1 },
    venueName: { fontSize: 16, fontWeight: "700", color: Colors.text },
    venueCity: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    mapButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: 12,
    },
    weatherRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    weatherLabel: {
      fontSize: 14,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    weatherInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
    weatherTemp: { fontSize: 16, fontWeight: "700", color: Colors.text },
    dividerV: { width: 1, height: 16, backgroundColor: Colors.border },
    weatherDesc: { fontSize: 14, color: Colors.textSecondary },
  });
