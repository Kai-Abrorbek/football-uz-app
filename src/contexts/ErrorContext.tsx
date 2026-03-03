import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createContext, ReactNode, useContext } from "react";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getColors } from "../constants/colors";
import { useTranslation } from "react-i18next";
import { useColors } from "../hooks/useColors";

interface LanguageContextType {
  errorComponent: (isError: boolean, options?: ErrorOptions) => ReactNode;
}

interface ErrorOptions {
  icon?: string;
  title?: string;
  subtitle?: string;
}

const ErrorContext = createContext<LanguageContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const Colors = useColors();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const errorComponent = (isError: boolean, options?: ErrorOptions) => {
    if (!isError) return null;

    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Ionicons
            name={(options?.icon ?? "alert-circle-outline") as any}
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.errorTitle}>
            {options?.title ?? t("common.error")}
          </Text>
          <Text style={styles.errorSub}>
            {options?.subtitle ?? t("common.errorSub")}
          </Text>
        </View>
      </SafeAreaView>
    );
  };

  return (
    <ErrorContext.Provider value={{ errorComponent }}>
      {children}
    </ErrorContext.Provider>
  );
}

const getStyles = (Colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.text,
      marginTop: 16,
    },
    errorSub: {
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
  });

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context)
    throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
