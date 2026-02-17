export const API_URL = "http://localhost:4000/api/v1";
// export const API_URL = "http://10.111.148.88:4000/api/v1";

export const ENDPOINTS = {
  // Matches
  matches: "/matches",
  matchDetail: (id: string) => `/matches/${id}`,
  liveMatches: "/matches/live",
  upcomingMatches: "/matches/upcoming",

  // Leagues
  leagues: "/leagues",
  featuredLeagues: "/leagues/featured",

  // Standings
  standings: "/standings",
  leagueStandings: (leagueId: number) => `/standings/league/${leagueId}`,

  // Teams
  teams: "/teams",
  teamDetail: (id: number) => `/teams/${id}`,

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
  chat: "/chat",

  // Auth
  login: "/auth/login",
  register: "/auth/register",
  me: "/users/me",
};
