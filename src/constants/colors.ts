// export const Colors = {
//   primary: "#1a73e8",
//   secondary: "#34a853",
//   background: "#f8f9fa",
//   surface: "#ffffff",
//   text: "#1a1a1a",
//   textSecondary: "#666666",
//   border: "#e0e0e0",
//   live: "#ea4335",
//   win: "#34a853",
//   draw: "#9e9e9e",
//   loss: "#ea4335",
//   card: "#ffffff",
//   tabBar: "#ffffff",
//   tabBarActive: "#1a73e8",
//   tabBarInactive: "#9e9e9e",
// };

export const getColors = (isDark: boolean) => ({
  primary: "#7c3aed",
  secondary: isDark ? "#8b5cf6" : "#34a853",
  background: isDark ? "#0a0a0a" : "#f8f8f8",
  surface: isDark ? "#1a1a1a" : "#ffffff",
  text: isDark ? "#ffffff" : "#1a1a1a",
  textSecondary: isDark ? "#a3a3a3" : "#666666",
  border: isDark ? "#2a2a2a" : "#e5e5e5",
  live: "#ef4444",
  win: "#34a853",
  draw: isDark ? "#666666" : "#9e9e9e",
  loss: "#ea4335",
  card: isDark ? "#1a1a1a" : "#ffffff",
  tabBar: isDark ? "#1a1a1a" : "#ffffff",
  tabBarActive: "#7c3aed",
  tabBarInactive: isDark ? "#666666" : "#9e9e9e",
  goalCard: isDark ? "#ea4335" : "2a2a2a",
});
// 기본 export (라이트 모드)
export const Colors = getColors(false);
