import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

// onSuccess 타입을 string으로 딱 고정해서 컴포넌트랑 맞췄어!
export const useGoogleAuth = (
  onSuccess: (idToken: string) => Promise<void>,
) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      // .env 파일에 등록된 WEB_CLIENT_ID가 꼭 필요해!
      webClientId:
        "793550954290-ea2r2qj0nnea4j7oti3jk71bifq75mqd.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    setIsReady(true);
  }, []);

  const signIn = async () => {
    if (!isReady) return;

    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      // 토큰이 있을 때만 onSuccess 실행하도록 확실히 체크!
      if (response.data?.idToken) {
        await onSuccess(response.data.idToken);
      }
    } catch (error: any) {
      // 12500 에러 뜨면 구글 콘솔 SHA-1 다시 확인해야 함!
      console.error("구글 로그인 에러 코드:", error.code);
      console.error("구글 로그인 에러 메시지:", error.message);
    }
  };

  return {
    promptAsync: signIn,
    isReady,
  };
};
