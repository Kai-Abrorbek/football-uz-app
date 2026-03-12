import { MATCH_SEASON } from "./leauges";

export const API_URL = "http://localhost:4000/api/v1";
// export const API_URL = "https://f206-213-230-80-223.ngrok-free.app/api/v1";
// export const API_URL = "http://10.84.175.88:4000/api/v1";
// export const API_URL = "http://192.168.1.3:4000/api/v1";

export const WORLDCUP_LEAGUE_ID = 1;
export const WORLDCUP_SEASON = 2022; // 나중에 2026으로 교체

export const ENDPOINTS = {
  // Matches
  matches: "/matches",
  leagueMatches: "/matches/league-matches",
  matchDetail: (id: string) => `/matches/${id}`,
  teamMatchDetail: (id: number) => `/matches/team-allmatches/${id}`,
  getTeamDetail: (id: number) =>
    `/matches/team/${id}?limit=999&season=${MATCH_SEASON}`,
  teamMatchRecent: (id: number) => `/matches/team-recent/${id}`,
  teamsRecentMatches: (id1: number, id2: number) =>
    `/matches/recent-matches/${id1}/${id2}?limit=5`,
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
  topYellowCards: (leagueId: number | string) =>
    `/players/top-yellowcards/${leagueId}`,
  topRedCards: (leagueId: number | string) =>
    `/players/top-redcards/${leagueId}`,
  teamPlayers: (teamId: number | string) => `/players/team/${teamId}`,
  teamLeagues: (teamId: number | string) => `/teams/leagues/${teamId}`,

  // Players
  players: "/players",
  playerDetail: (id: number) => `/players/${id}`,
  playersByIds: "/players/by-ids",

  // Predictions
  predictions: "/predictions",
  matchPrediction: (matchId: number) => `/predictions/match/${matchId}`,
  prediction: (fixtureId: number) => `/predictions/match/${fixtureId}`,

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
  authVerifyEmail: "/auth/verify-email",
  authResendVerification: "/auth/resend-verification",

  // USER
  userProfile: "/users/profile",

  // notificationSettings
  notificationSettings: "/users/notification-settings",
  matchAlert: (matchId: string) => `/notifications/match-alert/${matchId}`,
  matchAlertSet: (matchId: string) => `/notifications/match-alert/${matchId}`,
  matchAlertDelete: (matchId: string) =>
    `/notifications/match-alert/${matchId}`,

  // fcmToken: "/users/fcm-token",
  notifications: "/notifications",
  notificationsReadAll: "/notifications/read-all",
  notificationRead: (id: string) => `/notifications/${id}/read`,
  fcmToken: "/notifications/fcm-token",

  // FixtureAbsence
  fixtureabsence: (matchId: number) => {
    const url = `/fixtureabsence/match-absence?matchId=${matchId}`;
    return url;
  },

  // matchVote
  matchVote: (id: string) => `/matches/${id}/vote`,
  matchVoteSubmit: (id: string) => `/matches/${id}/vote`,

  // YOUTUBE
  matchHighlight: (
    matchId: string,
    homeTeam: string,
    awayTeam: string,
    date: string,
  ) =>
    `/highlights/${matchId}?homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}&date=${date}`,

  highlights: (page: number, limit: number) =>
    `/highlights?page=${page}&limit=${limit}`,

  // Streaming
  streamingLive: "/matches/streaming/live",
  setStreaming: (id: string) => `/matches/${id}/streaming`,
};
