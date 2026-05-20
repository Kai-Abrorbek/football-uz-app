import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import kr from "./locales/kr.json";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  resources: {
    kr: { translation: kr },
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: getLocales()[0]?.languageCode || "kr",
  fallbackLng: "kr",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
