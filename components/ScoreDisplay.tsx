import React from 'react';

interface ScoreDisplayProps {
  score: number;
  lives?: number;
  timeLeft?: number; // New prop
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, lives, timeLeft }) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-center p-3 sm:p-4 bg-slate-900 bg-opacity-60 rounded-lg shadow-xl z-10 text-base sm:text-xl md:text-2xl">
      <div className="font-bold text-yellow-400">
        Score: {score}
      </div>
      
      {timeLeft !== undefined && (
        <div className="font-bold text-sky-400">
          Time: {Math.max(0, Math.ceil(timeLeft))}s
        </div>
      )}

      {lives !== undefined && lives > 0 && (
        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className="font-bold text-red-400">Lives:</span>
          {Array.from({ length: lives }).map((_, index) => (
            <svg key={index} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
};