import { IPlayer } from '../types/interfaces';

export const calculateRewardDistribution = (totalAmount: number, playerCount: number): number[] => {
  const rewardDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20% distribution
  return rewardDistribution
    .slice(0, Math.min(playerCount, 3))
    .map(percentage => totalAmount * percentage);
};

export const generateNewPosition = () => ({
  x: Math.floor(Math.random() * 80 + 10), // Keep 10% padding from edges
  y: Math.floor(Math.random() * 80 + 10)
});

export const sortPlayersByScore = (players: IPlayer[]): IPlayer[] => {
  return [...players].sort((a, b) => b.score - a.score);
};