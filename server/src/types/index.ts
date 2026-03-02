import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface LobbySettings {
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  capitalization: boolean;
  timeLimit?: number; // seconds, optional
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  isReady: boolean;
  isHost: boolean;
  joinedAt: number;
}

export interface GameState {
  lobbyCode: string;
  matchId: string;
  words: string[];
  startTime: number;
  endTime?: number;
  status: 'countdown' | 'active' | 'finished';
  players: Record<string, PlayerProgress>;
}

export interface PlayerProgress {
  userId: string;
  username: string;
  currentWordIndex: number;
  correctWords: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wpm: number;
  accuracy: number;
  progress: number; // 0-100
  finished: boolean;
  finishedAt?: number;
  lastKeystrokeAt?: number;
  keystrokeTimestamps: number[];
}

export interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

export interface GameSubmission {
  wordSet: string[];
  typedWords: string[];
  startTime: number;
  endTime: number;
  keystrokeTimestamps?: number[];
}

export interface EloChange {
  userId: string;
  oldElo: number;
  newElo: number;
  change: number;
}
