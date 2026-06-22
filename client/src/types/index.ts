export const SUPER_ADMIN_EMAIL = 'mahamood.roshan@tcs.com';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  canChangeScores: boolean;
  isSuperAdmin: boolean;
  points: number;
  joinedDate: string;
}

export interface Team {
  name: string;
  flag: string;
}

export type MatchStatus = 'upcoming' | 'open' | 'closed' | 'completed';
export type PredictionChoice = 'teamA' | 'teamB' | 'draw';
export type MatchResult = 'teamA' | 'teamB' | 'draw' | null;

export interface Match {
  _id: string;
  matchNumber: number;
  matchDate: string;
  teamA: Team;
  teamB: Team;
  predictionStart: string;
  predictionEnd: string;
  status: MatchStatus;
  result: MatchResult;
  options: string[];
  createdAt: string;
}

export interface Prediction {
  _id: string;
  userId: string;
  matchId: Match | string;
  choice: PredictionChoice;
  pointsAwarded: number;
  isCorrect: boolean | null;
  createdAt: string;
}

export interface PointHistory {
  _id: string;
  userId: string;
  points: number;
  reason: string;
  addedByAdmin: boolean;
  adminId?: string;
  matchId?: string | Match;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  email: string;
  points: number;
  joinedDate: string;
  lastPredictionAt: string | null;
}

export interface DailyLeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  email: string;
  points: number;
  correctPicks: number;
}

export interface PollResult {
  label: string;
  choice: string;
  count: number;
  percentage: number;
}

export interface AdminStats {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  completedMatches: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

