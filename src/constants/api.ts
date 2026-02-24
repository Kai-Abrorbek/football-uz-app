export const API_URL = "http://localhost:4000/api/v1";
// export const API_URL = "http://10.111.148.88:4000/api/v1";
// export const API_URL = "http://192.168.1.3:4000/api/v1";

export const ENDPOINTS = {
  // Matches
  matches: "/matches",
  matchDetail: (id: string) => `/matches/${id}`,
  teamMatchDetail: (id: number) => `/matches/team/${id}?limit=999`,
  liveMatches: "/matches/live",
  upcomingMatches: "/matches/upcoming",

  // Leagues
  leagues: "/leagues",
  featuredLeagues: "/leagues/featured",
  leagueDetail: (id: number | string) => `/leagues/${id}`,

  // Standings
  standings: "/standings",
  leagueStandings: (leagueId: number) => `/standings/league/${leagueId}`,
  leagueStandingsAndSeason: (leagueId: number, season: number) =>
    `/standings/league/${leagueId}/season/${season}`,

  // Teams
  teams: "/teams",
  teamDetail: (id: number) => `/teams/${id}`,
  topScorers: (leagueId: number | string) => `/players/top-scorers/${leagueId}`,
  topAssists: (leagueId: number | string) => `/players/top-assists/${leagueId}`,
  teamPlayers: (teamId: number | string) => `/players/team/${teamId}`,
  teamLeagues: (teamId: number | string) => `/teams/leagues/${teamId}`,

  // Players
  players: "/players",
  playerDetail: (id: number) => `/players/${id}`,

  // Predictions
  predictions: "/predictions",
  matchPrediction: (matchId: number) => `/predictions/match/${matchId}`,

  // News
  news: "/news",
  newsDetail: (id: string) => `/news/${id}`,

  // Chat
  chat: "/chat/public",
  chatSession: (sessionId: string) => `/chat/public/session/${sessionId}`,

  // Auth
  me: "/users/me",
  authLogin: "/auth/login",
  authRegister: "/auth/register",
  authSocial: "/auth/social",

  // USER
  userProfile: "/users/profile",

  // notificationSettings
  notificationSettings: "/users/notification-settings",
  fcmToken: "/users/fcm-token",
};
