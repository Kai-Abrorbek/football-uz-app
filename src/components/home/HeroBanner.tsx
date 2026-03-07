import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";

const { width } = Dimensions.get("window");

type Banner = {
  id: number;
  image: string;
  titleKey: string;
  subtitleKey: string;
  route: string;
};

const BANNERS: Banner[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    titleKey: "hero.banners.premierLeague.title",
    subtitleKey: "hero.banners.premierLeague.subtitle",
    route: "/league/39",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    titleKey: "hero.banners.worldCup2026.title",
    subtitleKey: "hero.banners.worldCup2026.subtitle",
    route: "/worldcup",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
    titleKey: "hero.banners.laLiga.title",
    subtitleKey: "hero.banners.laLiga.subtitle",
    route: "/league/140",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800",
    titleKey: "hero.banners.championsLeague.title",
    subtitleKey: "hero.banners.championsLeague.subtitle",
    route: "/league/2",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800",
    titleKey: "hero.banners.serieA.title",
    subtitleKey: "hero.banners.serieA.subtitle",
    route: "/league/135",
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
    titleKey: "hero.banners.bundesliga.title",
    subtitleKey: "hero.banners.bundesliga.subtitle",
    route: "/league/78",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1494173853739-c21f58b16055?w=800",
    titleKey: "hero.banners.ligue1.title",
    subtitleKey: "hero.banners.ligue1.subtitle",
    route: "/league/61",
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800",
    titleKey: "hero.banners.saudiPro.title",
    subtitleKey: "hero.banners.saudiPro.subtitle",
    route: "/league/347",
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?w=800",
    titleKey: "hero.banners.europaLeague.title",
    subtitleKey: "hero.banners.europaLeague.subtitle",
    route: "/league/3",
  },
];

export default function HeroBanner() {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % BANNERS.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {BANNERS.map((banner) => (
          <TouchableOpacity
            key={banner.id}
            style={styles.slide}
            onPress={() => router.push(banner.route as any)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: banner.image }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.overlay} />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{t(banner.titleKey)}</Text>
              <Text style={styles.subtitle}>{t(banner.subtitleKey)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.indicators}>
        {BANNERS.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.indicator,
              index === currentIndex && styles.indicatorActive,
            ]}
            onPress={() => {
              setCurrentIndex(index);
              scrollRef.current?.scrollTo({ x: index * width, animated: true });
            }}
          />
        ))}
      </View>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { height: 200, marginBottom: 4, marginTop: 4 },
    slide: { width, height: 200 },
    image: { width: "100%", height: "100%" },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    textContainer: { position: "absolute", bottom: 30, left: 20, gap: 4 },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: "#ffffff",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    subtitle: {
      fontSize: 13,
      color: "rgba(255,255,255,0.85)",
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    indicators: {
      position: "absolute",
      bottom: 10,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
    indicatorActive: { width: 20, backgroundColor: "#ffffff" },
  });
