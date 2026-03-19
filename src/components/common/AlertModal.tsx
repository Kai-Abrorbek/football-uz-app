// src/components/common/AlertModal.tsx
import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { getColors } from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AlertType = "success" | "error" | "info" | "question" | "warning";

interface AlertModalProps {
  visible: boolean;
  type?: AlertType;
  title?: string;
  text?: string;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  timer?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

const ICON_CONFIG: Record<AlertType, { name: any; color: string; bg: string }> =
  {
    success: { name: "checkmark-circle", color: "#22c55e", bg: "#dcfce7" },
    error: { name: "close-circle", color: "#ef4444", bg: "#fee2e2" },
    info: { name: "information-circle", color: "#3b82f6", bg: "#dbeafe" },
    question: { name: "help-circle", color: "#8b5cf6", bg: "#ede9fe" },
    warning: { name: "warning", color: "#f59e0b", bg: "#fef3c7" },
  };

export function AlertModal({
  visible,
  type = "info",
  title,
  text,
  showConfirmButton = true,
  showCancelButton = false,
  confirmButtonText = "확인",
  cancelButtonText = "취소",
  confirmButtonColor = "#3b82f6",
  cancelButtonColor = "#9ca3af",
  timer,
  onConfirm,
  onCancel,
  onClose,
}: AlertModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const icon = ICON_CONFIG[type];
  const Colors = useColors();
  const styles = getStyles(Colors);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (timer) {
        const timeout = setTimeout(() => {
          onClose?.();
        }, timer);
        return () => clearTimeout(timeout);
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* 아이콘 */}
          <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
            <Ionicons name={icon.name} size={48} color={icon.color} />
          </View>

          {/* 타이틀 */}
          {title && <Text style={styles.title}>{title}</Text>}

          {/* 텍스트 */}
          {text && <Text style={styles.text}>{text}</Text>}

          {/* 버튼들 */}
          {(showConfirmButton || showCancelButton) && (
            <View style={styles.buttons}>
              {showCancelButton && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: cancelButtonColor }]}
                  onPress={onCancel ?? onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>{cancelButtonText}</Text>
                </TouchableOpacity>
              )}
              {showConfirmButton && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: confirmButtonColor }]}
                  onPress={onConfirm ?? onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnText}>{confirmButtonText}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modal: {
      width: SCREEN_WIDTH - 48,
      backgroundColor: Colors.surface2,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      gap: 12,
      shadowColor: Colors.border,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: Colors.text,
      textAlign: "center",
    },
    text: {
      fontSize: 14,
      color: Colors.text,
      textAlign: "center",
      lineHeight: 21,
    },
    buttons: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
      width: "100%",
    },
    btn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 12,
      alignItems: "center",
    },
    btnText: {
      fontSize: 15,
      fontWeight: "700",
      color: Colors.text,
    },
  });
