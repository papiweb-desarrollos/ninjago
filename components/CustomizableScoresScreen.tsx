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
  getAssetPath
} from '../constants';
import { audioManager } from '../AudioManager';
import { EnhancedBonusEffects } from './ui/EnhancedBonusEffects';
import { SuperExplosionSystem } from './ui/SuperExplosionSystem';

interface CustomizableScoresScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Array de imágenes bonus para efectos visuales
const BONUS_IMAGES = [
  '3323b78b87a9d94a78f2a254942954cf.jpg',
  '51bWZ1XvToL._AC_UF894,1000_QL80_.jpg',
  'Butch-ThePowerpuffGirls.webp',
  'KaiDR3E6.webp',
  'KaiFire36.webp',
  'LEGO-NINJAGO-71793-Heatwave-Transforming-Lava-Dragon-5.webp',
  'Nya.webp',
  'Nya_Debut.webp',
  'Nya_del_Futuro_fig.webp',
  'S8_Nya.webp',
  'f41520298ab9a0cc1bf35a48386e9b50.jpg',
  'f56c479324615ebf805bd35872672024.jpg',
  'images (1)jj.jpg',
  'images (2).jpg',
  'images (3).jpg',
  'images (4).jpg',
  'images (5).jpg',
  'images (6).jpg',
  'images.png',
  'lego-ninjago-2.png',
  'lego-ninjago-5.png',
  's-l1200 (1).jpg',
  's-l1200 (2).jpg',
  's-l1200 (3).jpg',
  's-l140.jpg',
  's-l400.jpg'
];

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
  const [bonusImageEffects, setBonusImageEffects] = useState<{id: string, image: string, x: number, y: number, createdAt: number, orbType: ScoreOrbType}[]>([]);
  const [starExplosionParticles, setStarExplosionParticles] = useState<{id: string, x: number, y: number, createdAt: number, particles: {x: number, y: number, vx: number, vy: number, color: string, size: number}[]}[]>([]);

  // New enhanced effects states
  const [enhancedBonusExplosions, setEnhancedBonusExplosions] = useState<Array<{
    id: string;
    x: number;
    y: number;
    orbType: ScoreOrbType;
    image: string;
    particles: any[];
    createdAt: number;
    intensity: number;
  }>>([]);
  
  const [superExplosions, setSuperExplosions] = useState<Array<{
    id: string;
    x: number;
    y: number;
    intensity: number;
    type: 'small' | 'medium' | 'large' | 'mega';
    color?: string;
    duration: number;
    particles: any[];
    createdAt: number;
  }>>([]);


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

  // Función para crear efectos de explosión de partículas
  const createStarExplosionEffect = useCallback((x: number, y: number, orbType: ScoreOrbType) => {
    const particleCount = orbType === ScoreOrbType.JACKPOT ? 20 : orbType === ScoreOrbType.BONUS ? 15 : 10;
    const particles: {x: number, y: number, vx: number, vy: number, color: string, size: number}[] = [];
    
    const colors = orbType === ScoreOrbType.JACKPOT 
      ? ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#DA70D6', '#87CEEB']
      : orbType === ScoreOrbType.BONUS 
      ? ['#32CD32', '#00FF00', '#90EE90', '#98FB98', '#ADFF2F']
      : ['#87CEEB', '#4169E1', '#0000FF', '#1E90FF'];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = orbType === ScoreOrbType.JACKPOT ? 4 + Math.random() * 6 : orbType === ScoreOrbType.BONUS ? 3 + Math.random() * 4 : 2 + Math.random() * 3;
      
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: orbType === ScoreOrbType.JACKPOT ? 6 + Math.random() * 4 : orbType === ScoreOrbType.BONUS ? 4 + Math.random() * 3 : 3 + Math.random() * 2
      });
    }

    const explosionId = generateId();
    setStarExplosionParticles(prev => [...prev, {
      id: explosionId,
      x: x,
      y: y,
      createdAt: performance.now(),
      particles: particles
    }]);

    // Remover las partículas después de 1.5 segundos
    setTimeout(() => {
      setStarExplosionParticles(prev => prev.filter(item => item.id !== explosionId));
    }, 1500);
  }, []);

  const handleOrbClick = useCallback((orbId: string) => {
    if (!audioInitializedRef.current) tryInitializeAudioAndMusic(); // Ensure audio is on for click sound
    
    let pointsEarned = 0;
    let clickX = 0, clickY = 0;
    let orbType: ScoreOrbType | null = null;

    setScoreOrbs(prevOrbs => 
      prevOrbs.map(orb => {
        if (orb.id === orbId && !orb.isClicked) {
          pointsEarned = orb.points;
          clickX = orb.x;
          clickY = orb.y;
          orbType = orb.type;
          audioManager.playSound(SoundEffect.SCORE_ORB_COLLECT, 0.7);
          return { ...orb, isClicked: true, createdAt: performance.now() }; // Reset createdAt for fadeout timer
        }
        return orb;
      })
    );
    
    if (pointsEarned > 0 && orbType !== null) {
      setScore(prevScore => prevScore + pointsEarned);
      
      // Mostrar puntos
      const displayId = generateId();
      setCollectedPointsDisplay(prev => [...prev, {id: displayId, points: pointsEarned, x: clickX, y: clickY}]);
      setTimeout(() => {
        setCollectedPointsDisplay(prev => prev.filter(item => item.id !== displayId));
      }, 800);

      // Crear efecto de explosión de partículas según el tipo de orbe
      createStarExplosionEffect(clickX, clickY, orbType);

      // Crear explosión súper mejorada
      const explosionIntensity = orbType === ScoreOrbType.JACKPOT ? 2 : orbType === ScoreOrbType.BONUS ? 1.5 : 1;
      const explosionType = orbType === ScoreOrbType.JACKPOT ? 'mega' : 
                           orbType === ScoreOrbType.BONUS ? 'large' : 'medium';
      
      const superExplosionId = generateId();
      setSuperExplosions(prev => [...prev, {
        id: superExplosionId,
        x: clickX,
        y: clickY,
        intensity: explosionIntensity,
        type: explosionType,
        color: orbType === ScoreOrbType.JACKPOT ? '#F59E0B' : 
               orbType === ScoreOrbType.BONUS ? '#10B981' : '#3B82F6',
        duration: explosionType === 'mega' ? 5000 : explosionType === 'large' ? 3500 : 2500,
        particles: [],
        createdAt: performance.now()
      }]);

      // Mostrar imagen bonus aleatoria con efecto visual espectacular
      const randomImage = BONUS_IMAGES[Math.floor(Math.random() * BONUS_IMAGES.length)];
      const bonusEffectId = generateId();
      
      // Enhanced bonus effects
      setEnhancedBonusExplosions(prev => [...prev, {
        id: bonusEffectId,
        x: clickX,
        y: clickY,
        orbType: orbType as ScoreOrbType,
        image: randomImage,
        particles: [],
        createdAt: performance.now(),
        intensity: explosionIntensity
      }]);
      
      setBonusImageEffects(prev => [...prev, {
        id: bonusEffectId, 
        image: randomImage, 
        x: clickX - 40, // Centrar la imagen de 80px
        y: clickY - 40, 
        createdAt: performance.now(),
        orbType: orbType as ScoreOrbType
      }]);
      
      // Remover el efecto después de 2 segundos (más tiempo para efectos más complejos)
      let duration = 2000;
      switch (orbType) {
        case ScoreOrbType.JACKPOT:
          duration = 5000;
          break;
        case ScoreOrbType.BONUS:
          duration = 3500;
          break;
        default:
          duration = 2500;
          break;
      }
      setTimeout(() => {
        setBonusImageEffects(prev => prev.filter(item => item.id !== bonusEffectId));
      }, duration);
    }
  }, [tryInitializeAudioAndMusic, createStarExplosionEffect]);

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

      // Actualizar partículas de explosión
      setStarExplosionParticles(prevExplosions =>
        prevExplosions.map(explosion => ({
          ...explosion,
          particles: explosion.particles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.2 // Gravity effect
          }))
        })).filter(explosion => timestamp - explosion.createdAt < 1500) // Remove old explosions
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

  // Callbacks for enhanced effects
  const handleBonusExplosionComplete = useCallback((id: string) => {
    setEnhancedBonusExplosions(prev => prev.filter(explosion => explosion.id !== id));
  }, []);

  const handleSuperExplosionComplete = useCallback((id: string) => {
    setSuperExplosions(prev => prev.filter(explosion => explosion.id !== id));
  }, []);

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
        
        {/* Efectos visuales de imágenes bonus */}
        {bonusImageEffects.map(effect => (
            <div 
                key={effect.id}
                className={`absolute pointer-events-none ${
                  effect.orbType === ScoreOrbType.JACKPOT ? 'animate-mega-explosion' : 'animate-bonus-explosion'
                }`}
                style={{
                    left: `${effect.x}px`,
                    top: `${effect.y}px`,
                    zIndex: 15,
                }}
            >
                <div 
                    className={`rounded-full border-4 shadow-2xl overflow-hidden ${
                      effect.orbType === ScoreOrbType.JACKPOT ? 'w-32 h-32 border-yellow-400 animate-spin-slow' :
                      effect.orbType === ScoreOrbType.BONUS ? 'w-24 h-24 border-green-400 animate-spin-slow' :
                      'w-20 h-20 border-blue-400 animate-spin-slow'
                    }`}
                    style={{
                        backgroundImage: `url(${getAssetPath(`/pictures/bonus/${effect.image}`)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: effect.orbType === ScoreOrbType.JACKPOT 
                          ? '0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.6)'
                          : effect.orbType === ScoreOrbType.BONUS
                          ? '0 0 35px rgba(34, 197, 94, 0.9), 0 0 70px rgba(34, 197, 94, 0.7)'
                          : '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.6)',
                    }}
                />
                {/* Partículas de luz alrededor mejoradas */}
                <div className={`absolute inset-0 ${effect.orbType === ScoreOrbType.JACKPOT ? 'animate-sparkle' : 'animate-pulse'}`}>
                    {effect.orbType === ScoreOrbType.JACKPOT ? (
                      <>
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-yellow-300 rounded-full animate-bounce opacity-70"></div>
                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-orange-300 rounded-full animate-bounce delay-100 opacity-70"></div>
                        <div className="absolute -bottom-3 -left-3 w-7 h-7 bg-red-300 rounded-full animate-bounce delay-200 opacity-70"></div>
                        <div className="absolute -bottom-3 -right-3 w-5 h-5 bg-purple-300 rounded-full animate-bounce delay-300 opacity-70"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 bg-pink-300 rounded-full animate-bounce delay-400 opacity-70"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 bg-cyan-300 rounded-full animate-bounce delay-500 opacity-70"></div>
                        {/* Partículas extra para Jackpot */}
                        <div className="absolute top-1/2 left-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-60"></div>
                        <div className="absolute top-1/2 right-0 w-3 h-3 bg-orange-400 rounded-full animate-ping delay-75 opacity-60"></div>
                        <div className="absolute top-0 left-1/2 w-3 h-3 bg-red-400 rounded-full animate-ping delay-150 opacity-60"></div>
                        <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-purple-400 rounded-full animate-ping delay-200 opacity-60"></div>
                      </>
                    ) : effect.orbType === ScoreOrbType.BONUS ? (
                      <>
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-300 rounded-full animate-bounce opacity-70"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-lime-300 rounded-full animate-bounce delay-100 opacity-70"></div>
                        <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-emerald-300 rounded-full animate-bounce delay-200 opacity-70"></div>
                        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-teal-300 rounded-full animate-bounce delay-300 opacity-70"></div>
                        {/* Partículas extra para Bonus */}
                        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-50"></div>
                        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-lime-400 rounded-full animate-ping delay-100 opacity-50"></div>
                      </>
                    ) : (
                      <>
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-300 rounded-full animate-bounce opacity-70"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-300 rounded-full animate-bounce delay-100 opacity-70"></div>
                        <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-sky-300 rounded-full animate-bounce delay-200 opacity-70"></div>
                        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-cyan-300 rounded-full animate-bounce delay-300 opacity-70"></div>
                      </>
                    )}
                </div>
            </div>
        ))}

        {/* Enhanced Effects Systems */}
        <EnhancedBonusEffects 
          explosions={enhancedBonusExplosions}
          onExplosionComplete={handleBonusExplosionComplete}
        />
        
        <SuperExplosionSystem 
          explosions={superExplosions}
          onExplosionComplete={handleSuperExplosionComplete}
        />

        {/* Efectos de partículas de explosión de estrellas */}
        {starExplosionParticles.map(explosion => (
          <div key={explosion.id} className="absolute pointer-events-none" style={{ left: explosion.x, top: explosion.y, zIndex: 20 }}>
            {explosion.particles.map((particle, index) => (
              <div
                key={index}
                className="absolute rounded-full animate-pulse"
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                  opacity: Math.max(0, 1 - (performance.now() - explosion.createdAt) / 1500)
                }}
              />
            ))}
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
        
        @keyframes bonus-explosion {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
            filter: brightness(1) hue-rotate(0deg);
          }
          10% { 
            transform: scale(0.8) rotate(45deg); 
            opacity: 0.8; 
            filter: brightness(1.5) hue-rotate(90deg);
          }
          30% { 
            transform: scale(1.3) rotate(135deg); 
            opacity: 1; 
            filter: brightness(2) hue-rotate(180deg);
          }
          60% { 
            transform: scale(1.1) rotate(225deg); 
            opacity: 1; 
            filter: brightness(1.8) hue-rotate(270deg);
          }
          80% { 
            transform: scale(1) rotate(315deg); 
            opacity: 0.8; 
            filter: brightness(1.3) hue-rotate(360deg);
          }
          100% { 
            transform: scale(0.2) rotate(405deg); 
            opacity: 0; 
            filter: brightness(0.5) hue-rotate(450deg);
          }
        }
        .animate-bonus-explosion {
          animation: bonus-explosion 2.5s ease-out forwards;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); filter: brightness(1); }
          25% { filter: brightness(1.3); }
          50% { transform: rotate(180deg); filter: brightness(1.6); }
          75% { filter: brightness(1.3); }
          to { transform: rotate(360deg); filter: brightness(1); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes sparkle {
          0%, 100% { 
            transform: scale(0.8) rotate(0deg);
            opacity: 0.7;
            filter: brightness(1);
          }
          25% { 
            transform: scale(1.2) rotate(90deg);
            opacity: 1;
            filter: brightness(1.5);
          }
          50% { 
            transform: scale(1) rotate(180deg);
            opacity: 0.9;
            filter: brightness(2);
          }
          75% { 
            transform: scale(1.1) rotate(270deg);
            opacity: 1;
            filter: brightness(1.5);
          }
        }
        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }

        @keyframes mega-explosion {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px);
          }
          15% { 
            transform: scale(1.5) rotate(60deg); 
            opacity: 1; 
            filter: brightness(2.5) blur(1px);
          }
          40% { 
            transform: scale(1.8) rotate(180deg); 
            opacity: 1; 
            filter: brightness(3) blur(2px);
          }
          70% { 
            transform: scale(1.2) rotate(300deg); 
            opacity: 0.8; 
            filter: brightness(2) blur(1px);
          }
          100% { 
            transform: scale(0.1) rotate(450deg); 
            opacity: 0; 
            filter: brightness(0.5) blur(0px);
          }
        }
        .animate-mega-explosion {
          animation: mega-explosion 3s ease-out forwards;
        }
       `}</style>
    </div>
  );
};