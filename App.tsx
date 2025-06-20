import React, { useState, useCallback } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { TargetPracticeScreen } from './components/TargetPracticeScreen';
import { MazeEscapeScreen } from './components/MazeEscapeScreen';
import { CustomizableScoresScreen } from './components/CustomizableScoresScreen';
import { VideoPlayerScreen } from './components/VideoPlayerScreen';
import { GameStatus } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.StartMenu);
  const [finalScore, setFinalScore] = useState(0);
  const [lastGameMode, setLastGameMode] = useState<GameStatus>(GameStatus.Playing);


  const handleStartGame = useCallback(() => {
    setLastGameMode(GameStatus.Playing);
    setGameStatus(GameStatus.Playing);
  }, []);

  const handleStartTargetPractice = useCallback(() => {
    setLastGameMode(GameStatus.TargetPractice);
    setGameStatus(GameStatus.TargetPractice);
  }, []);

  const handleStartMazeEscape = useCallback(() => { 
    setLastGameMode(GameStatus.MazeEscape);
    setGameStatus(GameStatus.MazeEscape);
  }, []);

  const handleStartCustomScores = useCallback(() => { 
    setLastGameMode(GameStatus.CustomScores);
    setGameStatus(GameStatus.CustomScores);
  }, []);

  const handleStartVideoPlayer = useCallback(() => { // New handler
    setLastGameMode(GameStatus.VideoPlayer); // Although VideoPlayer doesn't have a "score" or "game over"
    setGameStatus(GameStatus.VideoPlayer);
  }, []);

  const handleGameOver = useCallback((score: number) => {
    // VideoPlayer mode doesn't produce a score for game over screen.
    // So, only set finalScore if it's not from VideoPlayer.
    if (gameStatus !== GameStatus.VideoPlayer) {
      setFinalScore(score);
    }
    setGameStatus(GameStatus.GameOver);
  }, [gameStatus]); // Add gameStatus dependency

  const handleRestartGame = useCallback(() => {
    // VideoPlayer mode doesn't "restart" in the same way. 
    // Restarting from GameOver after VideoPlayer should go to StartMenu or last *actual* game.
    // For simplicity, if lastGameMode was VideoPlayer, and we hit "Restart" from GameOver (which shouldn't happen from VideoPlayer directly),
    // default to classic or start menu. Or better, VideoPlayer doesn't call onGameOver.
    // The VideoPlayerScreen will have its own "Back to Menu" logic.
    if (lastGameMode === GameStatus.TargetPractice) {
        setGameStatus(GameStatus.TargetPractice);
    } else if (lastGameMode === GameStatus.MazeEscape) {
        setGameStatus(GameStatus.MazeEscape);
    } else if (lastGameMode === GameStatus.CustomScores) { 
        setGameStatus(GameStatus.CustomScores);
    }
     else { // Default to Playing (Classic Slicing) or if lastGameMode was VideoPlayer (which doesn't fit restart logic)
        setGameStatus(GameStatus.Playing);
    }
  }, [lastGameMode]);
  
  const handleBackToMenu = useCallback(() => {
    setGameStatus(GameStatus.StartMenu);
  }, []);


  const renderContent = () => {
    switch (gameStatus) {
      case GameStatus.StartMenu:
        return <StartScreen 
                  onStartGame={handleStartGame} 
                  onStartTargetPractice={handleStartTargetPractice} 
                  onStartMazeEscape={handleStartMazeEscape}
                  onStartCustomScores={handleStartCustomScores}
                  onStartVideoPlayer={handleStartVideoPlayer} // Pass new handler
                />;
      case GameStatus.Playing:
        return <GameScreen onGameOver={handleGameOver} />;
      case GameStatus.TargetPractice:
        return <TargetPracticeScreen onGameOver={handleGameOver} />;
      case GameStatus.MazeEscape: 
        return <MazeEscapeScreen onGameOver={handleGameOver} />;
      case GameStatus.CustomScores: 
        return <CustomizableScoresScreen onGameOver={handleGameOver} />;
      case GameStatus.VideoPlayer: // Add case for VideoPlayer
        return <VideoPlayerScreen onBackToMenu={handleBackToMenu} />;
      case GameStatus.GameOver:
        return <GameOverScreen score={finalScore} onRestartGame={handleRestartGame} onBackToMenu={handleBackToMenu} />;
      default:
        return <StartScreen 
                  onStartGame={handleStartGame} 
                  onStartTargetPractice={handleStartTargetPractice} 
                  onStartMazeEscape={handleStartMazeEscape}
                  onStartCustomScores={handleStartCustomScores}
                  onStartVideoPlayer={handleStartVideoPlayer}
                />;
    }
  };

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-slate-900 select-none">
      <div 
        className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        role="main"
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default App;