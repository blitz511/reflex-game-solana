import { Document } from 'mongoose';
import { GAME_PHASES } from '../config/gameConfig';

export interface IGame extends Document {
  targetPosition: {
    x: number;
    y: number;
  };
  isActive: boolean;
  roundEndTime: Date;
  currentRound: number;
  currentPhase: keyof typeof GAME_PHASES;
  phaseStartTime: Date;
}

export interface IPlayer extends Document {
  wallet: string;
  stakedAmount: number;
  score: number;
  lastActive: Date;
}

export interface IPlayerData {
  wallet: string;
  stakedAmount: number;
  score: number;
  lastActive: Date;
}

export interface Position {
  x: number;
  y: number;
}

export interface Winner {
  wallet: string;
  amount: number;
  round: number;
}

export type GamePhase = keyof typeof GAME_PHASES;