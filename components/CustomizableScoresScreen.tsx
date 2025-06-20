import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScoreOrbState, ScoreOrbType, SoundEffect } from '../types';
import { ScoreDisplay } from './ScoreDisplay';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  CUSTOM_SCORES_DURATION_S,
  SCORE_ORB_SPAWN_INTERVAL_MS,
  SCORE_ORB_LIFESPAN_MS,
  SCORE_ORB_DEFINITIONS,
  MAX_SCORE_ORBS_ON_SCREEN,
  SoundOnIcon, SoundOffIcon, StarIcon,
} from '../constants';
import { audioManager } from '../AudioManager';

interface CustomizableScoresScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

const soundsToPreloadCustomScores: SoundEffect[] = [
  SoundEffect.BACKGROUND_WEEKEND_WHIP,
  SoundEffect.SCORE_ORB_COLLECT,
  SoundEffect.UI_CLICK_GENERAL,
];

export const CustomizableScoresScreen: React.FC<CustomizableScoresScreenProps> = ({ onGameOver }) => {
  const [scoreOrbs, setScoreOrbs] = useState<ScoreOrbState[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(CUSTOM_SCORES_DURATION_S);
  const [isMuted, setIsMuted] = useState(audioManager.getIsMuted());
  const [collectedPointsDisplay, setCollectedPointsDisplay] = useState<{id: string, points: number, x: number, y: number}[]>([]);


  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);
  const audioInitializedRef = useRef(false);
  const gameOverCalledRef = useRef(false);

  const tryInitializeAudioAndMusic = useCallback(async () => {
    if (!audioInitializedRef.current) {
      const success = await audioManager.initialize();
      if (success) {
        audioInitializedRef.current = true;
        await audioManager.preloadSounds(soundsToPreloadCustomScores);
        audioManager.playMusic(SoundEffect.BACKGROUND_WEEKEND_WHIP, 0.2); // Non-invasive volume
        console.log("Audio initialized for Custom Scores, music started.");
      } else {
        console.warn("Failed to initialize audio for Custom Scores.");
      }
    } else if (audioManager.getAudioContextState() === 'suspended') {
      await audioManager.initialize(); // Resume
      audioManager.playMusic(SoundEffect.BACKGROUND_WEEKEND_WHIP, 0.2);
    }
  }, []);

  useEffect(() => {
    const handleFirstInteraction = async () => {
      await tryInitializeAudioAndMusic();
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('keydown', handleFirstInteraction, { capture: true });
    };

    if (!audioInitializedRef.current) {
        // Use capture to ensure these run before other click/key handlers
        window.addEventListener('click', handleFirstInteraction, { once: true, capture: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true, capture: true });
    }
    
    return () => {
      window.removeEventListener('click', handleFirstInteraction, { capture: true });
      window.removeEventListener('keydown', handleFirstInteraction, { capture: true });
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      audioManager.stopMusic();
      gameOverCalledRef.current = false;
    };
  }, [tryInitializeAudioAndMusic]);

  const spawnOrb = useCallback(() => {
    if (scoreOrbs.length >= MAX_SCORE_ORBS_ON_SCREEN) return;

    const weights = Object.values(SCORE_ORB_DEFINITIONS).map(def => def.appearanceWeight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let selectedType: ScoreOrbType = ScoreOrbType.REGULAR; // Default

    for (const type in SCORE_ORB_DEFINITIONS) {
      const orbTypeKey = type as ScoreOrbType;
      if (randomWeight < SCORE_ORB_DEFINITIONS[orbTypeKey].appearanceWeight) {
        selectedType = orbTypeKey;
        break;
      }
      randomWeight -= SCORE_ORB_DEFINITIONS[orbTypeKey].appearanceWeight;
    }
    
    const definition = SCORE_ORB_DEFINITIONS[selectedType];
    const size = definition.minSize + Math.random() * (definition.maxSize - definition.minSize);
    const initialY = Math.random() * (GAME_HEIGHT * 0.8 - size) + size / 2; // Spawn in upper 80%
    
    const newOrb: ScoreOrbState = {
      id: generateId(),
      x: Math.random() * (GAME_WIDTH - size) + size / 2,
      y: initialY,
      initialY: initialY,
      vy: definition.floatingSpeed || 0.2, // Default floating speed
      amplitude: definition.floatingAmplitude || 5, // Default amplitude
      frequency: definition.floatingFrequency || 0.05, // Default frequency
      size,
      points: definition.basePoints + (selectedType === ScoreOrbType.JACKPOT ? Math.floor(Math.random() * definition.basePoints) : 0),
      color: definition.color,
      type: selectedType,
      createdAt: performance.now(),
      isClicked: false,
    };
    setScoreOrbs(prev => [...prev, newOrb]);
  }, [scoreOrbs.length]);

  const handleOrbClick = useCallback((orbId: string) => {
    if (!audioInitializedRef.current) tryInitializeAudioAndMusic(); // Ensure audio is on for click sound
    
    let pointsEarned = 0;
    let clickX = 0, clickY = 0;

    setScoreOrbs(prevOrbs => 
      prevOrbs.map(orb => {
        if (orb.id === orbId && !orb.isClicked) {
          pointsEarned = orb.points;
          clickX = orb.x;
          clickY = orb.y;
          audioManager.playSound(SoundEffect.SCORE_ORB_COLLECT, 0.7);
          return { ...orb, isClicked: true, createdAt: performance.now() }; // Reset createdAt for fadeout timer
        }
        return orb;
      })
    );
    
    if (pointsEarned > 0) {
      setScore(prevScore => prevScore + pointsEarned);
      const displayId = generateId();
      setCollectedPointsDisplay(prev => [...prev, {id: displayId, points: pointsEarned, x: clickX, y: clickY}]);
      setTimeout(() => {
        setCollectedPointsDisplay(prev => prev.filter(item => item.id !== displayId));
      }, 800); // Duration for points display
    }
  }, [tryInitializeAudioAndMusic]);

  useEffect(() => {
    gameStartTimeRef.current = performance.now();
    lastSpawnTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      if (gameOverCalledRef.current) {
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        return;
      }
      const elapsedSeconds = (timestamp - gameStartTimeRef.current) / 1000;
      setTimeLeft(CUSTOM_SCORES_DURATION_S - elapsedSeconds);

      if (CUSTOM_SCORES_DURATION_S - elapsedSeconds <= 0) {
        if (!gameOverCalledRef.current) {
            onGameOver(score);
            gameOverCalledRef.current = true;
        }
        return;
      }

      setScoreOrbs(prevOrbs => 
        prevOrbs
          .map(orb => {
            if (orb.isClicked) return orb; // Let fade out handle removal
            // Floating effect
            const timeFactor = (timestamp - orb.createdAt) * orb.frequency;
            const newY = orb.initialY + Math.sin(timeFactor) * orb.amplitude + (timestamp - orb.createdAt) * 0.01; // Gentle downward drift
             return { ...orb, y: newY };
          })
          .filter(orb => {
            if (orb.isClicked && timestamp - orb.createdAt > 300) return false; // Fade out clicked orbs
            if (!orb.isClicked && timestamp - orb.createdAt > SCORE_ORB_LIFESPAN_MS) return false; // Remove old unclicked orbs
            return true;
          })
      );
      
      if (timestamp - lastSpawnTimeRef.current > SCORE_ORB_SPAWN_INTERVAL_MS) {
        spawnOrb();
        lastSpawnTimeRef.current = timestamp;
      }
      
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    if (!gameOverCalledRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [onGameOver, score, spawnOrb]);

  const handleToggleMute = useCallback(async () => {
    if(!audioInitializedRef.current) await tryInitializeAudioAndMusic();
    const newMuteState = audioManager.toggleMute();
    setIsMuted(newMuteState);
    audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.5);
  }, [tryInitializeAudioAndMusic]);

  return (
    <div
      ref={gameAreaRef}
      className="relative bg-slate-800 overflow-hidden cursor-pointer shadow-2xl rounded-lg flex flex-col items-center justify-center"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      role="application"
      aria-label="Customizable Scores Game Area: Click orbs to score points"
      tabIndex={-1}
      onClick={async (e) => { // Click anywhere to init audio if not done
            if (!audioInitializedRef.current) {
                await tryInitializeAudioAndMusic();
            }
            e.currentTarget.focus(); 
        }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-slate-900 bg-opacity-80 shadow-md flex justify-between items-center">
        <ScoreDisplay score={score} timeLeft={timeLeft} />
        <button
            onClick={handleToggleMute}
            className="p-2 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
            {isMuted ? <SoundOffIcon className="text-red-500" /> : <SoundOnIcon className="text-green-500" />}
        </button>
      </div>
      
      <div className="w-full h-full relative mt-16"> {/* Container for orbs, accounting for ScoreDisplay */}
        {scoreOrbs.map(orb => (
          <div
            key={orb.id}
            className={`absolute rounded-full shadow-lg transition-all duration-300 ease-out flex items-center justify-center text-white font-bold text-sm sm:text-base ${orb.color}`}
            style={{
              left: `${orb.x - orb.size / 2}px`,
              top: `${orb.y - orb.size / 2}px`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              opacity: orb.isClicked ? 0 : 1,
              transform: orb.isClicked ? 'scale(1.5)' : 'scale(1)',
              cursor: 'pointer',
              zIndex: 5,
            }}
            onClick={(e) => { e.stopPropagation(); handleOrbClick(orb.id); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleOrbClick(orb.id); }}}
            aria-label={`Collect ${orb.type.toLowerCase()} orb for ${orb.points} points`}
          >
            {/* Display points inside orb for larger orbs or Jackpot */}
            {(orb.type === ScoreOrbType.JACKPOT || orb.size > 55) && 
              <div className="flex flex-col items-center">
                <span>{orb.points}</span> 
                {orb.type === ScoreOrbType.JACKPOT && <StarIcon size={orb.size * 0.3} className="opacity-80"/>}
              </div>
            }
             {orb.type !== ScoreOrbType.JACKPOT && orb.size <= 55 && <StarIcon size={orb.size * 0.4} className="opacity-60"/>}

          </div>
        ))}
        {collectedPointsDisplay.map(display => (
            <div key={display.id}
                className="absolute text-yellow-300 font-bold text-lg pointer-events-none animate-ping-short"
                style={{
                    left: `${display.x}px`,
                    top: `${display.y - 30}px`, /* Start slightly above the click */
                    zIndex: 10,
                }}
            >
                +{display.points}
            </div>
        ))}
      </div>
       <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/stardust.png")`}}></div>
       <style>{`
        @keyframes ping-short {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.5) translateY(-30px); opacity: 0; }
        }
        .animate-ping-short {
          animation: ping-short 0.8s ease-out forwards;
        }
       `}</style>
    </div>
  );
};