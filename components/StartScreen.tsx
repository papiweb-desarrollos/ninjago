import React from 'react';
import { Button } from './ui/Button';
import { ShurikenIcon, ScrollIcon, BombIcon, TargetIcon, PlayerNinjaIcon, RobotEnemyIcon, StarIcon, FilmIcon } from '../constants';

interface StartScreenProps {
  onStartGame: () => void;
  onStartTargetPractice: () => void;
  onStartMazeEscape: () => void;
  onStartCustomScores: () => void;
  onStartVideoPlayer: () => void; // New prop
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStartGame, 
  onStartTargetPractice, 
  onStartMazeEscape, 
  onStartCustomScores,
  onStartVideoPlayer // New prop
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-800 p-4 sm:p-8 rounded-xl shadow-2xl text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-sky-400">Ninja Go Action!</h1>
      <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-slate-300">
        Choose your challenge!
      </p>
      
      <div className="mb-6 space-y-3 sm:space-y-4 w-full max-w-md">
        <Button onClick={onStartGame} variant="primary" className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5">
          <div className="flex items-center justify-center space-x-2">
            <ShurikenIcon size={22} /> 
            <span>Classic Slicing</span> 
            <BombIcon size={22} />
          </div>
        </Button>
        
        <Button onClick={onStartTargetPractice} variant="secondary" className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5">
          <div className="flex items-center justify-center space-x-2">
            <TargetIcon size={22} color="fill-sky-400" />
            <span>Target Range</span>
            <ShurikenIcon size={22} />
          </div>
        </Button>

        <Button onClick={onStartMazeEscape} variant="primary" className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400">
          <div className="flex items-center justify-center space-x-2">
            <PlayerNinjaIcon size={22} />
            <span>Maze Escape</span>
            <RobotEnemyIcon size={22} />
          </div>
        </Button>

        <Button onClick={onStartCustomScores} variant="secondary" className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 bg-purple-500 hover:bg-purple-600 focus:ring-purple-400">
          <div className="flex items-center justify-center space-x-2">
            <StarIcon size={22} />
            <span>Score Rush</span> 
            <StarIcon size={22} className="opacity-70" />
          </div>
        </Button>

        <Button onClick={onStartVideoPlayer} variant="primary" className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-400">
          <div className="flex items-center justify-center space-x-2">
            <FilmIcon size={22} />
            <span>Video Player</span>
            <FilmIcon size={22} className="opacity-70" />
          </div>
        </Button>
      </div>

      <div className="flex space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <ShurikenIcon size={30} className="text-sky-400" />
        <ScrollIcon size={30} className="text-emerald-400" />
        <BombIcon size={30} className="text-red-500 animate-pulse" />
        <StarIcon size={30} className="text-yellow-400" />
        <PlayerNinjaIcon size={30} className="text-lime-400" />
        <FilmIcon size={30} className="text-indigo-400" />
      </div>
      
      <div className="text-xs sm:text-sm text-slate-500 space-y-1">
        <p>Classic: Slice objects! Avoid bombs!</p>
        <p>Target Range: Shoot targets! Race time!</p>
        <p>Maze Escape: Navigate, fight, find exit!</p>
        <p>Score Rush: Click orbs for points!</p>
        <p>Video Player: Watch ninja training videos!</p>
      </div>
    </div>
  );
};