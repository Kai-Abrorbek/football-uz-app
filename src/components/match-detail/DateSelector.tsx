import { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";

interface Props {
  selectedDate: string; // "2026-03-05"
  onDateSelect: (date: string) => void;
  hasLive?: boolean;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const generateDates = (selectedDate: string): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 항상 3일 전부터 오늘까지 고정
  for (let i = 3; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d);
  }

  // 오늘 이후 7일 고정
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  // 선택된 날짜가 범위 밖이면 추가
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  const maxDate = dates[dates.length - 1];

  if (selected > maxDate) {
    // 선택된 날짜까지 추가
    const current = new Date(maxDate);
    while (formatDate(current) < selectedDate) {
      current.setDate(current.getDate() + 1);
      dates.push(new Date(current));
    }
    // 선택된 날짜 이후 7일 더 추가
    for (let i = 1; i <= 7; i++) {
      const d = new Date(selected);
      d.setDate(selected.getDate() + i);
      dates.push(d);
    }
  }

  // 중복 제거
  const seen = new Set<string>();
  return dates.filter((d) => {
    const key = formatDate(d);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function DateSelector({
  selectedDate,
  onDateSelect,
  hasLive,
}: Props) {
  const { t, i18n } = useTranslation();
  const Colors = useColors();
  const styles = getStyles(Colors);
  const scrollRef = useRef<ScrollView>(null);

  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const tomorrow = formatDate(new Date(Date.now() + 86400000));

  const dates = generateDates(selectedDate);

  const getLabel = (date: Date): string => {
    const key = formatDate(date);
    if (key === today) return t("home.dates.today");
    if (key === yesterday) return t("home.dates.yesterday");
    if (key === tomorrow) return t("home.dates.tomorrow");

    return date.toLocaleDateString(i18n.language, {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });
  };

  // 선택된 날짜로 스크롤
  useEffect(() => {
    const idx = dates.findIndex((d) => formatDate(d) === selectedDate);
    if (idx !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: idx * 80, animated: true });
    }
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {dates.map((date) => {
          const key = formatDate(date);
          const isSelected = key === selectedDate;
          const isToday = key === today;

          return (
            <TouchableOpacity
              key={key}
              style={[styles.item, isSelected && styles.selectedItem]}
              onPress={() => onDateSelect(key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                {getLabel(date)}
              </Text>
              {isToday && hasLive && <View style={styles.liveDot} />}
              {isSelected && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    content: { paddingHorizontal: 8, paddingVertical: 4 },
    item: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: "center",
      minWidth: 72,
      position: "relative",
    },
    selectedItem: {},
    label: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
    },
    selectedLabel: {
      color: Colors.text,
      fontWeight: "700",
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#ef4444",
      marginTop: 3,
    },
    indicator: {
      position: "absolute",
      bottom: 0,
      left: "25%",
      right: "25%",
      height: 3,
      borderRadius: 2,
      backgroundColor: Colors.text,
    },
  });
