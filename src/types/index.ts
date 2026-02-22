export interface Match {
  _id: string;
  apiFootballId: number;
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  homeTeam: {
    id: number;
    name: string;
    logo: string;
    winner?: boolean;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
    winner?: boolean;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime?: { home: number; away: number };
    fulltime?: { home: number; away: number };
    extratime?: { home: number; away: number };
    penalty?: { home: number; away: number };
  };
  status: {
    long: string;
    short: string;
    elapsed?: number;
    extra?: number;
  };
  date: string;
  venue?: {
    name: string;
    city: string;
  };
  round: string;
  events: MatchEvent[];
  lineups?: Lineups;
  statistics: MatchStatistic[];
  isWorldCup2026: boolean;
}

export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team?: {
    id: number;
    name: string;
    logo: string;
  };
  player?: {
    id: number;
    name: string;
  };
  assist?: {
    id: number;
    name: string;
  };
  type: string;
  detail: string;
  comments?: string;
}

export interface Lineups {
  home?: TeamLineup;
  away?: TeamLineup;
}

export interface TeamLineup {
  teamId: number;
  formation: string;
  startXI: PlayerInfo[];
  substitutes: PlayerInfo[];
}

export interface PlayerInfo {
  playerId: number;
  playerName: string;
  number: number;
  pos: string;
  photo: string;
}

export interface MatchStatistic {
  side: "home" | "away";
  possession?: string;
  [key: string]: any;
  shots?: number;
  shotsOnTarget?: number;
  corners?: number;
  fouls?: number;
  yellowCards?: number;
  redCards?: number;
  offsides?: number;
  passes?: number;
  passAccuracy?: string;
}

export interface League {
  _id: string;
  apiFootballId: number;
  name: string;
  type: string;
  logo: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  isFeatured: boolean;
  priority: number;
}

export interface Standing {
  _id: string;
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
  };
  standings: StandingEntry[][];
}

export interface StandingEntry {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  form: string;
}

export interface Team {
  _id: string;
  apiFootballId: number;
  name: string;
  logo: string;
  country: string;
  venue?: {
    name: string;
    city: string;
    capacity: number;
  };
}

export interface Player {
  _id: string;
  apiFootballId: number;
  name: string;
  photo: string;
  nationality: string;
  position: string;
  age: number;
  currentTeam?: {
    id: number;
    name: string;
    logo: string;
  };
}

export interface Prediction {
  _id: string;
  apiFootballId: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  prediction: {
    winner: "home" | "away" | "draw";
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    predictedScore: {
      home: number;
      away: number;
    };
    advice: string;
    analysis: {
      uz: string;
      ru: string;
      en: string;
    };
  };
  confidence: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  language: "uz" | "ru" | "en";
  favoriteTeams: number[];
  favoritePlayers: number[];
  favoriteLeagues: number[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface News {
  _id: string;
  title: { en: string; uz: string; ru: string };
  content: { en: string; uz: string; ru: string };
  summary?: { en: string; uz: string; ru: string };
  imageUrl: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  category: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    language: string;
    avatar?: string;
  };
}

export interface SocialLoginDto {
  provider: "google" | "telegram";
  token: string;
  data?: any;
}
