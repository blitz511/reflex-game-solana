import React, { useState, useEffect } from 'react';

interface GameStatsProps {
  playerCount: number;
  initialTimeLeft?: number; // Optional to allow default value
}

export const GameStats: React.FC<GameStatsProps> = ({ playerCount, initialTimeLeft = 30 }) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTimeLeft);

  useEffect(() => {
    if (isNaN(timeLeft) || timeLeft <= 0) return; // Stop timer if invalid or 0

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => Math.max(prevTime - 1, 0)); // Prevent negative values
    }, 1000);

    return () => clearInterval(interval); // Cleanup
  }, [timeLeft]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-1">Players</h3>
        <p className="text-2xl font-bold">{playerCount}</p>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-1">Round Ends In</h3>
        <p className="text-2xl font-bold">{timeLeft}s</p>
      </div>
    </div>
  );
};
