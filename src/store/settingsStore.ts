import { create } from "zustand";

interface SettingsState {
  language: "uz" | "ru" | "en";
  darkMode: boolean;
  setLanguage: (language: "uz" | "ru" | "en") => void;
  setDarkMode: (darkMode: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: "uz",
  darkMode: false,
  setLanguage: (language) => set({ language }),
  setDarkMode: (darkMode) => set({ darkMode }),
}));
