import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { createNewRound, handlePlayerClick, getGameState } from './services/gameService.js';
import { stakeSOL } from './services/playerService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB with proper error handling
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Initialize game loop only after successful DB connection
    const startGameLoop = async () => {
      try {
        await createNewRound();
        setInterval(async () => {
          try {
            await createNewRound();
            const gameState = await getGameState();
            if (gameState) {
              io.emit('gameState', gameState);
            }
          } catch (error) {
            console.error('Error in game loop:', error);
          }
        }, 30000);
      } catch (error) {
        console.error('Error starting game loop:', error);
      }
    };

    await startGameLoop();

    // Socket.IO event handlers
    io.on('connection', async (socket) => {
      try {
        // Send initial game state
        const gameState = await getGameState();
        if (gameState) {
          socket.emit('gameState', gameState);
        }

        socket.on('targetClick', async ({ wallet, timestamp }) => {
          try {
            const updatedPlayer = await handlePlayerClick(wallet, timestamp);
            if (updatedPlayer) {
              const newGameState = await getGameState();
              if (newGameState) {
                io.emit('gameState', newGameState);
              }
            }
          } catch (error) {
            console.error('Error handling target click:', error);
            socket.emit('error', { message: 'Failed to process click' });
          }
        });

        socket.on('stake', async ({ wallet, amount }) => {
          try {
            const player = await stakeSOL(wallet, amount);
            if (player) {
              socket.emit('playerStaked', wallet);
              const newGameState = await getGameState();
              if (newGameState) {
                io.emit('gameState', newGameState);
              }
            }
          } catch (error) {
            console.error('Error handling stake:', error);
            socket.emit('error', { message: 'Failed to process stake' });
          }
        });
      } catch (error) {
        console.error('Error in socket connection:', error);
      }
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();