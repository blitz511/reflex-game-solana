import { useCallback, useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types';
import { GAME_CONFIG } from '../config/constants';
import { toast } from 'react-hot-toast';
import { SolanaService } from '../services/solanaService';

// ... (previous imports and initial state remain the same)

export const useGameState = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [solanaService, setSolanaService] = useState<SolanaService | null>(null);
  
  // ... (previous state declarations remain the same)

  useEffect(() => {
    if (connection && wallet) {
      const service = new SolanaService(connection, wallet);
      setSolanaService(service);
    }
  }, [connection, wallet]);

  const stakeSOL = useCallback(async (amount: number) => {
    if (!wallet.publicKey || !connection || !solanaService) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Staking SOL...');
      await solanaService.stake(amount);
      
      if (socket) {
        socket.emit('stake', {
          wallet: wallet.publicKey.toBase58(),
          amount,
        });
      }
      
      toast.success('Successfully staked SOL!');
    } catch (error) {
      console.error('Error staking SOL:', error);
      toast.error('Failed to stake SOL');
    }
  }, [wallet, connection, solanaService, socket]);

  // ... (rest of the hook implementation remains the same)
};