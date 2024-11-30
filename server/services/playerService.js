import Player from '../models/Player.js';

export const stakeSOL = async (wallet, amount) => {
  const player = await Player.findOneAndUpdate(
    { wallet },
    { 
      $inc: { stakedAmount: amount },
      lastActive: new Date(),
    },
    { upsert: true, new: true }
  );
  return player;
};

export const getActivePlayers = async () => {
  return Player.find({
    lastActive: { $gte: new Date(Date.now() - 30000) },
    stakedAmount: { $gt: 0 },
  });
};