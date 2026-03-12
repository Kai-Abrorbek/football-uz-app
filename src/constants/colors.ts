export const getColors = (isDark: boolean) => ({
  // ── Brand ──────────────────────────────────────────
  primary: isDark ? "#00E5FF" : "#7c3aed", // 어드민 cyan → 라이트는 기존 퍼플
  primaryMuted: isDark ? "rgba(0,229,255,0.12)" : "rgba(124,58,237,0.1)",
  secondary: isDark ? "#A78BFA" : "#34a853",

  // ── Background ─────────────────────────────────────
  background: isDark ? "#080A0F" : "#f8f8f8", // --bg
  background2: isDark ? "#0F1117" : "#f0f0f0", // --surface
  backgroundDeep: isDark ? "#0B0D12" : "#e8e8e8", // --sidebar (더 깊은 배경)

  // ── Surface / Card ─────────────────────────────────
  surface: isDark ? "#0F1117" : "#ffffff", // --surface
  surface2: isDark ? "#141820" : "#f5f5f5", // --card
  surface3: isDark ? "#1A1F2B" : "#eeeeee", // --card2
  card: isDark ? "#141820" : "#ffffff", // --card

  // ── Border ─────────────────────────────────────────
  border: isDark ? "#1E2535" : "#e5e5e5", // --border
  border2: isDark ? "#252D3D" : "#d0d0d0", // --border2

  // ── Text ───────────────────────────────────────────
  text: isDark ? "#E2E8F4" : "#1a1a1a", // --text
  text2: isDark ? "#1A1F2B" : "#1a1a1a",
  textSecondary: isDark ? "#6B7A99" : "#666666", // --muted2
  textMuted: isDark ? "#4A5568" : "#9e9e9e", // --muted

  // ── Status / Accent ────────────────────────────────
  live: "#FF3D57", // --red (라이브 경기)
  liveMuted: isDark ? "rgba(255,61,87,0.15)" : "rgba(255,61,87,0.1)",
  win: "#00D68F", // --green
  draw: isDark ? "#4A5568" : "#9e9e9e",
  loss: "#FF3D57",
  amber: "#FFB800", // --amber (예정/경고)
  amberMuted: isDark ? "rgba(255,184,0,0.15)" : "rgba(255,184,0,0.1)",

  // ── Goal / Highlight ───────────────────────────────
  goalCard: isDark ? "#FF3D57" : "#2a2a2a",

  // ── Tab Bar ────────────────────────────────────────
  tabBar: isDark ? "#0F1117" : "#ffffff", // --surface
  tabBarBorder: isDark ? "#1E2535" : "#e5e5e5",
  tabBarActive: isDark ? "#00E5FF" : "#7c3aed",
  tabBarInactive: isDark ? "#4A5568" : "#9e9e9e",

  // ── 기존 호환 유지 ──────────────────────────────────
  background_compat: isDark ? "#0a0a0a" : "#f8f8f8", // 기존 background 쓰던 곳
});

// 기본 export (라이트 모드)
export const Colors = getColors(false);
