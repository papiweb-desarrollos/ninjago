import React, { useState, useCallback } from 'react';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { TargetPracticeScreen } from './components/TargetPracticeScreen';
import { MazeEscapeScreen } from './components/MazeEscapeScreen';
import { CustomizableScoresScreen } from './components/CustomizableScoresScreen';
import { VideoPlayerScreen } from './components/VideoPlayerScreen';
import { PerformanceMonitor, OptimizationTips, usePerformanceOptimization } from './components/ui/PerformanceMonitor';
import { GlobalOptimizer } from './components/ui/GlobalOptimizer';
import { GameStatus } from './types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.StartMenu);
  const [finalScore, setFinalScore] = useState(0);
  const [lastGameMode, setLastGameMode] = useState<GameStatus>(GameStatus.Playing);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    avgFps: 0,
    frameTime: 0,
    memoryUsage: 0
  });
  
  // Optimización de rendimiento
  const optimizationSettings = usePerformanceOptimization();

  const handlePerformanceChange = (metrics: any) => {
    setPerformanceMetrics({
      fps: metrics.fps,
      avgFps: metrics.avgFps,
      frameTime: metrics.frameTime,
      memoryUsage: metrics.memoryUsage || 0
    });
  };


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
    <GlobalOptimizer>
      <div className="min-h-screen w-screen bg-slate-900 select-none flex flex-col">
        {/* Performance Monitor Overlay */}
        {showPerformanceMonitor && (
          <div className="fixed top-20 right-4 z-[9999]">
            <PerformanceMonitor 
              enabled={true}
              onPerformanceChange={handlePerformanceChange}
            />
          </div>
        )}
        
        {/* Optimization Tips Overlay */}
        {optimizationSettings.shouldReduceEffects && (
          <div className="fixed top-20 left-4 z-[9999]">
            <OptimizationTips metrics={performanceMetrics} />
          </div>
        )}

        {/* Header/Branding - Fixed position with high z-index */}
      <header className="relative z-50 bg-slate-800 border-b-4 border-sky-500 shadow-lg flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">🥷</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-sky-400 brand-glow header-title">NINJA GO</h1>
              <p className="text-xs text-slate-400">Action Arcade Gaming</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-slate-300">
            <div className="flex items-center space-x-1">
              <span className="text-sm">🎮</span>
              <span className="text-sm">5 Modes</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">📺</span>
              <span className="text-sm">20 Videos</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-400 rounded-full game-status-indicator"></span>
              <span className="text-sm">Online</span>
            </div>
            <button
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors duration-200"
              title="Toggle Performance Monitor"
            >
              <span className="text-sm">📊</span>
              <span className="text-sm">FPS</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Container - Responsive and constrained */}
      <main className="flex-1 flex items-center justify-center p-4 main-container overflow-hidden min-h-0">
        <div 
          className="rounded-xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-900 transform transition-transform hover:scale-101 duration-300 w-full h-full"
          style={{ 
            maxWidth: `${GAME_WIDTH}px`,
            maxHeight: `${GAME_HEIGHT}px`,
            width: '95%',
            height: '90%',
            minWidth: '320px',
            minHeight: '240px'
          }}
          role="main"
        >
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t-4 border-sky-500 shadow-lg footer-shimmer">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 footer-content">
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-slate-300">
              <span className="text-sm font-medium">© 2025 Ninja Go Action Arcade</span>
              <span className="hidden sm:inline text-xs text-slate-500">|</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Desarrollado por</span>
                <a 
                  href="https://link.mercadopago.com.ar/papiweb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-orange-400 hover:text-orange-300 transition-colors duration-200 group papiweb-link px-2 py-1 rounded"
                  title="Apoyar el desarrollo con un café ☕"
                >
                  <span className="text-sm font-medium">Papiweb Desarrollos Informáticos</span>
                  <span className="text-lg group-hover:animate-bounce coffee-steam">☕</span>
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-xs text-slate-400">Server Active</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <span className="bg-slate-700 px-2 py-1 rounded">v1.0.0</span>
                <span>•</span>
                <span>20 Videos</span>
                <span>•</span>
                <span>5 Game Modes</span>
                <span>•</span>
                <span>React + TS</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </GlobalOptimizer>
  );
};

export default App;