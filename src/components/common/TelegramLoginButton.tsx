import { useEffect } from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  botName: string;
  onAuth: (user: any) => void;
}

export default function TelegramLoginButton({ botName, onAuth }: Props) {
  useEffect(() => {
    // 글로벌 콜백 함수 등록
    (window as any).onTelegramAuth = (user: any) => {
      onAuth(user);
    };

    // 스크립트 추가
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botName);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [botName, onAuth]);

  return <View id="telegram-login-container" style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
});
