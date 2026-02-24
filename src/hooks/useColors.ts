import { useTheme } from "../contexts/ThemeContext";
import { getColors } from "../constants/colors";

export const useColors = () => {
  const { isDark } = useTheme();
  return getColors(isDark);
};
