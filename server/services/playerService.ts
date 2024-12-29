import Player from '../models/Player';
import { IPlayerData } from '../types';
import { solanaService } from './solanaService';
import { StakeError } from '../utils/errors';

export const stakeSOL = async (wallet: string, amount: number): Promise<IPlayerData | null> => {
  try {
    // Verify the stake on-chain
    // const isVerified = await solanaService.verifyStake(wallet, amount);
    // if (!isVerified) {
    //   console.log('Stake verification failed for wallet:', wallet, 'amount:', amount);
    //   throw new StakeError('Stake verification failed - Please try again');
    // }

    // Update or create player record
    const player = await Player.findOneAndUpdate(
      { wallet },
      { 
        $inc: { stakedAmount: amount },
        lastActive: new Date(),
      },
      { upsert: true, new: true }
    );
    
    if (!player) {
      throw new StakeError('Failed to update player record');
    }
    
    return {
      wallet: player.wallet,
      stakedAmount: player.stakedAmount,
      score: player.score,
      lastActive: player.lastActive
    };
  } catch (error) {
    console.error('Error staking SOL:', error);
    throw error instanceof StakeError ? error : new StakeError('Failed to process stake');
  }
};

export const getActivePlayers = async (): Promise<IPlayerData[]> => {
  try {
    const players = await Player.find({
      lastActive: { $gte: new Date(Date.now() - 30000) },
      stakedAmount: { $gt: 0 },
    });

    return players.map(player => ({
      wallet: player.wallet,
      stakedAmount: player.stakedAmount,
      score: player.score,
      lastActive: player.lastActive
    }));
  } catch (error) {
    console.error('Error getting active players:', error);
    return [];
  }
};