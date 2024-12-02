import Game from '../models/Game';
import Player from '../models/Player';
import { Position, Winner, GamePhase } from '../types';
import { GAME_PHASES } from '../config/gameConfig';

const PHASE_DURATIONS = {
  [GAME_PHASES.STAKING]: 30000,    // 30 seconds
  [GAME_PHASES.GAMEPLAY]: 30000,    // 30 seconds
  [GAME_PHASES.WINNER_DECLARATION]: 10000, // 10 seconds
};

const REWARD_PERCENTAGE = 0.9; // 90% of the pool goes to winners

export const generateNewPosition = (): Position => ({
  x: Math.floor(Math.random() * 80 + 10),
  y: Math.floor(Math.random() * 80 + 10),
});

export const calculateRewards = async (currentRound: number): Promise<Winner[]> => {
  try {
    const players = await Player.find({ 
      score: { $gt: 0 }
    }).sort({ score: -1 });

    if (players.length === 0) return [];

    const totalStaked = players.reduce((sum, p) => sum + p.stakedAmount, 0);
    const prizePool = totalStaked * REWARD_PERCENTAGE;
    
    const rewardDistribution = [0.5, 0.3, 0.2];
    const winners = players.slice(0, 3).map((player, index) => ({
      wallet: player.wallet,
      amount: prizePool * rewardDistribution[index],
      round: currentRound,
    }));

    return winners;
  } catch (error) {
    console.error('Error calculating rewards:', error);
    return [];
  }
};

export const getCurrentPhase = async (): Promise<{ phase: GamePhase; endTime: number }> => {
  const game = await Game.findOne();
  if (!game) {
    return {
      phase: GAME_PHASES.STAKING,
      endTime: Date.now() + PHASE_DURATIONS[GAME_PHASES.STAKING]
    };
  }

  const now = Date.now();
  const phaseStartTime = game.phaseStartTime.getTime();
  const currentPhaseDuration = PHASE_DURATIONS[game.currentPhase];
  const timeElapsed = now - phaseStartTime;

  if (timeElapsed >= currentPhaseDuration) {
    // Time to move to next phase
    const nextPhase = getNextPhase(game.currentPhase);
    const newEndTime = now + PHASE_DURATIONS[nextPhase];
    
    game.currentPhase = nextPhase;
    game.phaseStartTime = new Date();
    await game.save();

    return { phase: nextPhase, endTime: newEndTime };
  }

  return {
    phase: game.currentPhase,
    endTime: phaseStartTime + currentPhaseDuration
  };
};

const getNextPhase = (currentPhase: GamePhase): GamePhase => {
  switch (currentPhase) {
    case GAME_PHASES.STAKING:
      return GAME_PHASES.GAMEPLAY;
    case GAME_PHASES.GAMEPLAY:
      return GAME_PHASES.WINNER_DECLARATION;
    case GAME_PHASES.WINNER_DECLARATION:
      return GAME_PHASES.STAKING;
    default:
      return GAME_PHASES.STAKING;
  }
};

export const handlePlayerClick = async (wallet: string, timestamp: number) => {
  try {
    const { phase } = await getCurrentPhase();
    if (phase !== GAME_PHASES.GAMEPLAY) return null;

    const player = await Player.findOne({ wallet });
    if (!player || player.stakedAmount <= 0) return null;

    player.score += 1;
    player.lastActive = new Date();
    await player.save();

    return player;
  } catch (error) {
    console.error('Error handling player click:', error);
    return null;
  }
};

export const getGameState = async () => {
  try {
    const [game, players] = await Promise.all([
      Game.findOne(),
      Player.find({ stakedAmount: { $gt: 0 } }),
    ]);

    const { phase, endTime } = await getCurrentPhase();

    if (!game) return null;

    const totalStaked = players.reduce((sum, p) => sum + p.stakedAmount, 0);

    return {
      targetPosition: game.targetPosition,
      players: players.map(p => ({
        wallet: p.wallet,
        stakedAmount: p.stakedAmount,
        score: p.score,
      })),
      isActive: true,
      currentRoundEndTime: game.roundEndTime.getTime(),
      winners: [],
      prizePool: totalStaked * REWARD_PERCENTAGE,
      serverTime: Date.now(),
      currentPhase: phase,
      phaseEndTime: endTime
    };
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
};