import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = (onSuccess: (idToken: string) => void) => {
  const redirectUri = AuthSession.makeRedirectUri(); // ✅ 여기서 useProxy 제거

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!,
      ios: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    }),
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === "success") {
      onSuccess(response.params.id_token);
    }
  }, [response]);

  return {
    isReady: !!request,
    promptAsync: () => promptAsync({ useProxy: true } as any),
  };
};
