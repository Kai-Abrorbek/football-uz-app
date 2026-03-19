// src/components/common/ToastAlert.tsx
import { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getColors } from "../../constants/colors";
import { useColors } from "../../hooks/useColors";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastAlertProps {
  visible: boolean;
  type?: ToastType;
  title?: string;
  onHide?: () => void;
  duration?: number;
}
const TOAST_CONFIG: Record<
  ToastType,
  { icon: any; color: string; bg: string }
> = {
  success: {
    icon: "checkmark-circle",
    color: "#22c55e",
    bg: "rgba(5,46,22,0.95)",
  },
  error: { icon: "close-circle", color: "#ef4444", bg: "rgba(69,10,10,0.95)" },
  info: {
    icon: "information-circle",
    color: "#3b82f6",
    bg: "rgba(23,37,84,0.95)",
  },
  warning: { icon: "warning", color: "#f59e0b", bg: "rgba(69,26,3,0.95)" },
};

export function ToastAlert({
  visible,
  type = "info",
  title,
  onHide,
  duration = 2500,
}: ToastAlertProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = TOAST_CONFIG[type];
  const Colors = useColors();
  const styles = getStyles(Colors);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timeout = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, duration);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={styles.title}>{title}</Text>
    </Animated.View>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 60,
      left: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 14,
      gap: 10,
      zIndex: 9999,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
      flex: 1,
    },
  });
