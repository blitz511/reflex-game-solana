import { useCallback, useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { GameState, GamePhase } from '../types';
import { GAME_CONFIG, GAME_PHASES } from '../config/constants';
import { useSocket } from './useSocket';

const PHASE_DURATIONS = {
  [GAME_PHASES.STAKING]: 60, // 1 minute
  [GAME_PHASES.GAMEPLAY]: 180, // 3 minutes
  [GAME_PHASES.WINNER_DECLARATION]: 30, // 30 seconds
};

const initialGameState: GameState = {
  targetPosition: { x: 50, y: 50 },
  players: [],
  isActive: false,
  currentRoundEndTime: Date.now(),
  winners: [],
  prizePool: 0
};

export const useGameState = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>(GAME_PHASES.STAKING);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(PHASE_DURATIONS[GAME_PHASES.STAKING]);
  const phaseEndTimeRef = useRef<number>(Date.now() + PHASE_DURATIONS[GAME_PHASES.STAKING] * 1000);

  const updatePhase = useCallback((newPhase: GamePhase, serverEndTime?: number) => {
    setCurrentPhase(newPhase);
    const duration = PHASE_DURATIONS[newPhase];
    const endTime = serverEndTime || Date.now() + duration * 1000;
    phaseEndTimeRef.current = endTime;
    setPhaseTimeLeft(Math.ceil((endTime - Date.now()) / 1000));
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('gameState', (newState: GameState) => {
        setGameState(newState);
      });

      socket.on('phaseChange', ({ phase, endTime }) => {
        updatePhase(phase, endTime);
      });

      // Request initial phase synchronization
      socket.emit('requestPhase');
    }
  }, [socket, updatePhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.ceil((phaseEndTimeRef.current - now) / 1000);
      
      if (timeLeft <= 0) {
        socket?.emit('requestPhase');
      } else {
        setPhaseTimeLeft(timeLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [socket]);

  const isStaked = useCallback((): boolean => {
    if (!wallet.publicKey) return false;
    return gameState.players.some(p => p.wallet === wallet.publicKey?.toBase58());
  }, [wallet.publicKey, gameState.players]);

  const handleTargetClick = useCallback(() => {
    if (!wallet.publicKey || !isStaked() || currentPhase !== GAME_PHASES.GAMEPLAY) return;
    
    socket?.emit('targetClick', {
      wallet: wallet.publicKey.toBase58(),
      timestamp: Date.now()
    });
  }, [wallet.publicKey, isStaked, currentPhase, socket]);

  const connectToGame = useCallback(() => {
    if (!socket?.connected) {
      socket?.connect();
    }
  }, [socket]);

  const getStatusMessage = useCallback(() => {
    switch (currentPhase) {
      case GAME_PHASES.STAKING:
        return 'Staking phase - Get ready for the next round!';
      case GAME_PHASES.GAMEPLAY:
        return 'Game in progress - Click the targets as fast as you can!';
      case GAME_PHASES.WINNER_DECLARATION:
        return 'Calculating winners...';
      default:
        return '';
    }
  }, [currentPhase]);

  return {
    gameState,
    isStaked: isStaked(),
    handleTargetClick,
    connectToGame,
    currentPhase,
    phaseTimeLeft,
    statusMessage: getStatusMessage()
  };
};