import React from 'react';
import { Button } from './ui/Button';

interface GameOverScreenProps {
  score: number;
  onRestartGame: () => void;
  onBackToMenu: () => void; // New prop
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestartGame, onBackToMenu }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-red-500">Game Over!</h1>
      <p className="text-2xl sm:text-3xl mb-6 sm:mb-8 text-slate-200">
        Your Score: <span className="font-bold text-yellow-400">{score}</span>
      </p>
      <div className="space-y-4 w-full max-w-xs">
        <Button onClick={onRestartGame} variant="primary" className="w-full text-xl sm:text-2xl px-8 py-3 sm:py-4">
          Restart Game
        </Button>
        <Button onClick={onBackToMenu} variant="secondary" className="w-full text-lg sm:text-xl px-6 py-2 sm:py-3">
          Back to Menu
        </Button>
      </div>
    </div>
  );
};