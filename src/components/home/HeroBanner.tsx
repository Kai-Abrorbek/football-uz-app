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

const { width } = Dimensions.get("window");

const BANNERS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=800",
    title: "Premier League",
    subtitle: "The best league in the world",
    route: "/league/39",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800",
    title: "FIFA World Cup 2026",
    subtitle: "Uzbekistan is ready!",
    route: "/worldcup",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800",
    title: "La Liga",
    subtitle: "Real Madrid vs Barcelona",
    route: "/league/140",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800",
    title: "Champions League",
    subtitle: "Europe's finest competition",
    route: "/league/2",
  },
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % BANNERS.length;
      setCurrentIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000); // 3초마다 슬라이드

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
              source={banner.image}
              style={styles.image}
              contentFit="cover"
            />
            {/* 그라디언트 오버레이 */}
            <View style={styles.overlay} />
            {/* 텍스트 */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{banner.title}</Text>
              <Text style={styles.subtitle}>{banner.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 인디케이터 */}
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
              scrollRef.current?.scrollTo({
                x: index * width,
                animated: true,
              });
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    marginBottom: 4,
  },
  slide: {
    width,
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  textContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    gap: 4,
  },
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
  indicatorActive: {
    width: 20,
    backgroundColor: "#ffffff",
  },
});
