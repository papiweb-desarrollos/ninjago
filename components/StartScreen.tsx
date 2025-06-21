import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { VolumeControl } from './ui/VolumeControl';
import { AdvancedParticleSystem } from './ui/AdvancedParticleSystem';
import { ShurikenIcon, ScrollIcon, BombIcon, TargetIcon, PlayerNinjaIcon, RobotEnemyIcon, StarIcon, FilmIcon, getAssetPath } from '../constants';
import { AudioTest } from './AudioTest';
import { audioManager } from '../AudioManager';
import { SoundEffect } from '../types';

// Array de imágenes de fondo de la carpeta misc
const BACKGROUND_IMAGES = [
  'Ninjago.jpg',
  'maxresdefault.jpg',
  'ninjago_movie-1.webp',
  'Lloyd_Garmadon.png',
  'LEGO-ninjago-dragons-rising-part-2-poster-featured-800x445.jpg.webp',
  'NINJAGO-Season-15-poster-featured.webp',
  'Ninjago-Masters-of-Spinjitzu.jpg',
  'llwr-jay-model.webp',
  'image (1).png',
  'image (3).png',
  'image (6).png',
  'image (7).png',
  'image (8).png',
  'image (10).png',
  'image (13).png',
  'image (14).png',
  'image (16).png',
  'image (17).png',
  'image (19).png',
  'image (20).png',
  'image (22).png',
  'image (23).png',
  'image (26).png',
  'image (28).png',
  'image (30).png',
  'image (31).png',
  'image (33).png',
  'images.jpg',
  'images4.jpg',
  '2024523105542_2.jpg'
];

interface StartScreenProps {
  onStartGame: () => void;
  onStartTargetPractice: () => void;
  onStartMazeEscape: () => void;
  onStartCustomScores: () => void;
  onStartVideoPlayer: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStartGame, 
  onStartTargetPractice, 
  onStartMazeEscape, 
  onStartCustomScores,
  onStartVideoPlayer
}) => {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [nextBgIndex, setNextBgIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [floatingElements, setFloatingElements] = useState<{id: number, x: number, y: number, type: string, speed: number, rotation: number, scale: number}[]>([]);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, opacity: number, size: number}[]>([]);
  const [showAudioTest, setShowAudioTest] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Cambiar fondo cada 6 segundos (más dinámico)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentBgIndex(nextBgIndex);
        setNextBgIndex((nextBgIndex + 1) % BACKGROUND_IMAGES.length);
        setIsTransitioning(false);
      }, 1000);
    }, 6000);

    return () => clearInterval(interval);
  }, [nextBgIndex]);

  // Inicializar audio y música de fondo
  const initializeAudioAndMusic = useCallback(async () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      
      try {
        console.log('Inicializando sistema de audio...');
        const success = await audioManager.initialize();
        setIsAudioInitialized(success);
        
        if (success) {
          // Precargar sonidos esenciales
          await audioManager.preloadSounds([
            SoundEffect.UI_CLICK_GENERAL,
            SoundEffect.BACKGROUND_NINJAGO_THEME
          ]);
          
          // Iniciar música de fondo con volumen moderado
          console.log('Iniciando música de fondo...');
          audioManager.playMusic(SoundEffect.BACKGROUND_NINJAGO_THEME, 0.4);
          setIsMusicPlaying(true);
          
          // Efecto de sonido de bienvenida
          setTimeout(() => {
            audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.5);
          }, 500);
          
          console.log('✅ Sistema de audio inicializado correctamente');
        } else {
          console.error('❌ Error al inicializar el sistema de audio');
        }
      } catch (error) {
        console.error('❌ Error durante la inicialización de audio:', error);
        setIsAudioInitialized(false);
      }
    }
  }, [hasUserInteracted]);

  // Función mejorada de hover con efectos de audio
  const handleHover = useCallback(() => {
    // Inicializar audio en la primera interacción
    if (!hasUserInteracted) {
      initializeAudioAndMusic();
    } else if (isAudioInitialized) {
      // Reproducir efecto de hover solo si el audio ya está inicializado
      audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.2);
    }
    
    // Crear efecto de hover con partículas temporales
    const tempParticles = Array.from({ length: 8 }, (_, i) => ({
      id: 1000 + i + Math.random() * 1000,
      x: 45 + Math.random() * 10,
      y: 40 + Math.random() * 20,
      opacity: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 3
    }));
    
    setParticles(prev => [...prev, ...tempParticles]);
    
    // Remover partículas temporales después de 2 segundos
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id < 1000));
    }, 2000);
  }, [hasUserInteracted, isAudioInitialized, initializeAudioAndMusic]);

  // Función para manejar clicks en botones de juego
  const handleGameButtonClick = useCallback((gameFunction: () => void) => {
    return () => {
      // Inicializar audio en el primer click
      if (!hasUserInteracted) {
        initializeAudioAndMusic();
      } else if (isAudioInitialized) {
        // Reproducir sonido de click
        audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.4);
      }
      
      // Detener música de fondo antes de iniciar el juego
      if (isMusicPlaying) {
        setTimeout(() => {
          audioManager.stopMusic();
          setIsMusicPlaying(false);
        }, 200);
      }
      
      gameFunction();
    };
  }, [hasUserInteracted, isAudioInitialized, isMusicPlaying, initializeAudioAndMusic]);

  // Control de música con teclas
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'm' || event.key === 'M') {
        if (!hasUserInteracted) {
          initializeAudioAndMusic();
        } else if (isAudioInitialized) {
          const newMuteState = audioManager.toggleMute();
          audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.3);
          console.log(newMuteState ? '🔇 Audio silenciado' : '🔊 Audio activado');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUserInteracted, isAudioInitialized, initializeAudioAndMusic]);

  // Generar elementos flotantes
  useEffect(() => {
    const generateFloatingElements = () => {
      const elements = [];
      for (let i = 0; i < 15; i++) {
        elements.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          type: ['shuriken', 'scroll', 'star', 'ninja', 'bomb'][Math.floor(Math.random() * 5)],
          speed: 0.1 + Math.random() * 0.4,
          rotation: Math.random() * 360,
          scale: 0.6 + Math.random() * 0.8
        });
      }
      setFloatingElements(elements);
    };

    generateFloatingElements();
  }, []);

  // Generar partículas de fondo
  useEffect(() => {
    const generateParticles = () => {
      const particleArray = [];
      for (let i = 0; i < 30; i++) {
        particleArray.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: 0.1 + Math.random() * 0.3,
          size: 1 + Math.random() * 3
        });
      }
      setParticles(particleArray);
    };

    generateParticles();
  }, []);

  // Animar elementos flotantes
  useEffect(() => {
    const animateElements = () => {
      setFloatingElements(prev => 
        prev.map(element => ({
          ...element,
          y: (element.y + element.speed) % 110, // Reiniciar desde arriba cuando sale por abajo
          rotation: (element.rotation + 1) % 360
        }))
      );
    };

    const interval = setInterval(animateElements, 50);
    return () => clearInterval(interval);
  }, []);

  // Animar partículas
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: (particle.y + 0.05) % 105,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.01,
          opacity: 0.1 + Math.sin(Date.now() * 0.002 + particle.id) * 0.2
        }))
      );
    };

    const interval = setInterval(animateParticles, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl shadow-2xl">
      {/* Fondo dinámico con transiciones */}
      <div className="absolute inset-0">
        {/* Fondo actual */}
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ${
            isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${getAssetPath(`/pictures/misc/${BACKGROUND_IMAGES[currentBgIndex]}`)})`,
          }}
        />
        
        {/* Fondo siguiente (para transición) */}
        <div 
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ${
            isTransitioning ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${getAssetPath(`/pictures/misc/${BACKGROUND_IMAGES[nextBgIndex]}`)})`,
          }}
        />
        
        {/* Overlay con gradiente adicional */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-emerald-900/20" />
      </div>

      {/* Sistema de partículas avanzado */}
      <AdvancedParticleSystem 
        isActive={true}
        centerX={50}
        centerY={30}
        particleCount={25}
        className="z-5"
      />

      {/* Partículas de fondo básicas */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={`particle-${particle.id}`}
            className="absolute rounded-full bg-white particle-sparkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              transition: 'all 0.1s ease-out',
            }}
          />
        ))}
      </div>

      {/* Elementos flotantes */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingElements.map(element => (
          <div
            key={`element-${element.id}`}
            className="absolute opacity-20 animate-pulse"
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
              transition: 'all 0.05s linear',
            }}
          >
            {element.type === 'shuriken' && <ShurikenIcon size={24} className="text-sky-300" />}
            {element.type === 'scroll' && <ScrollIcon size={24} className="text-emerald-300" />}
            {element.type === 'star' && <StarIcon size={24} className="text-yellow-300" />}
            {element.type === 'ninja' && <PlayerNinjaIcon size={24} className="text-lime-300" />}
            {element.type === 'bomb' && <BombIcon size={24} className="text-red-300" />}
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-4 sm:p-8 text-center">
        {/* Título con efectos mejorados */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text animated-gradient blur-sm">
              Ninja Go Action!
            </h1>
          </div>
          <h1 className="relative text-5xl sm:text-6xl font-bold mb-4 text-white enhanced-glow neon-text">
            Ninja Go Action!
          </h1>
          <p className="text-xl sm:text-2xl mb-6 sm:mb-8 text-slate-100 drop-shadow-lg relative">
            <span className="glass-effect px-4 py-2 rounded-lg border border-white/20">
              Choose your challenge!
            </span>
          </p>
        </div>
      
        {/* Botones de juego con efectos mejorados */}
        <div className="mb-6 space-y-3 sm:space-y-4 w-full max-w-md">
          <Button 
            onClick={handleGameButtonClick(onStartGame)} 
            variant="primary" 
            enhanced={true}
            className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 glass-effect hover:enhanced-glow transition-all duration-300 border border-white/20"
            onMouseEnter={handleHover}
          >
            <div className="flex items-center justify-center space-x-2">
              <ShurikenIcon size={22} className="animate-spin-slow" /> 
              <span className="neon-text">Classic Slicing</span> 
              <BombIcon size={22} className="animate-pulse" />
            </div>
          </Button>
          
          <Button 
            onClick={handleGameButtonClick(onStartTargetPractice)} 
            variant="secondary" 
            enhanced={true}
            className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 glass-effect-dark hover:enhanced-glow-green transition-all duration-300 border border-white/20"
            onMouseEnter={handleHover}
          >
            <div className="flex items-center justify-center space-x-2">
              <TargetIcon size={22} color="fill-sky-400" />
              <span>Target Range</span>
              <ShurikenIcon size={22} className="animate-bounce" />
            </div>
          </Button>

          <Button 
            onClick={handleGameButtonClick(onStartMazeEscape)} 
            variant="primary" 
            enhanced={true}
            className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 glass-effect hover:enhanced-glow-green transition-all duration-300 border border-white/20"
            onMouseEnter={handleHover}
          >
            <div className="flex items-center justify-center space-x-2">
              <PlayerNinjaIcon size={22} />
              <span>Maze Escape</span>
              <RobotEnemyIcon size={22} />
            </div>
          </Button>

          <Button 
            onClick={handleGameButtonClick(onStartCustomScores)} 
            variant="secondary" 
            enhanced={true}
            className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 glass-effect-dark hover:enhanced-glow-purple transition-all duration-300 border border-white/20"
            onMouseEnter={handleHover}
          >
            <div className="flex items-center justify-center space-x-2">
              <StarIcon size={22} className="animate-pulse" />
              <span>Score Rush</span> 
              <StarIcon size={22} className="opacity-70 animate-spin" />
            </div>
          </Button>

          <Button 
            onClick={handleGameButtonClick(onStartVideoPlayer)} 
            variant="primary" 
            enhanced={true}
            className="w-full text-lg sm:text-xl px-6 py-3 sm:py-3.5 glass-effect hover:enhanced-glow-orange transition-all duration-300 border border-white/20"
            onMouseEnter={handleHover}
          >
            <div className="flex items-center justify-center space-x-2">
              <FilmIcon size={22} />
              <span>Video Player</span>
              <FilmIcon size={22} className="opacity-70" />
            </div>
          </Button>
        </div>

        {/* Iconos flotantes decorativos */}
        <div className="flex space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <ShurikenIcon size={30} className="text-sky-300 animate-spin-slow drop-shadow-lg" />
          <ScrollIcon size={30} className="text-emerald-300 animate-bounce drop-shadow-lg" />
          <BombIcon size={30} className="text-red-400 animate-pulse drop-shadow-lg" />
          <StarIcon size={30} className="text-yellow-300 animate-ping drop-shadow-lg" />
          <PlayerNinjaIcon size={30} className="text-lime-300 drop-shadow-lg" />
          <FilmIcon size={30} className="text-indigo-300 drop-shadow-lg" />
        </div>
        
        {/* Descripciones mejoradas */}
        <div className="text-sm sm:text-base text-slate-200 space-y-2 backdrop-blur-sm bg-black/30 p-4 rounded-lg border border-white/20">
          <p className="drop-shadow-md">🗡️ <strong>Classic:</strong> Slice objects! Avoid bombs!</p>
          <p className="drop-shadow-md">🎯 <strong>Target Range:</strong> Shoot targets! Race time!</p>
          <p className="drop-shadow-md">🏃 <strong>Maze Escape:</strong> Navigate, fight, find exit!</p>
          <p className="drop-shadow-md">⭐ <strong>Score Rush:</strong> Click orbs for points!</p>
          <p className="drop-shadow-md">🎬 <strong>Video Player:</strong> Watch ninja training videos!</p>
          
          {!hasUserInteracted && (
            <div className="mt-3 pt-2 border-t border-white/20">
              <p className="drop-shadow-md text-yellow-200 font-semibold animate-pulse">
                🎵 Click any button to activate background music!
              </p>
              <p className="drop-shadow-md text-xs text-slate-300 mt-1">
                Press 'M' to toggle mute at any time
              </p>
            </div>
          )}
          
          {hasUserInteracted && isAudioInitialized && (
            <div className="mt-3 pt-2 border-t border-white/20 flex items-center justify-between">
              <p className="drop-shadow-md text-green-200 text-sm">
                🎵 {isMusicPlaying ? 'Background music playing' : 'Music stopped'}
              </p>
              <div className="text-slate-300 text-xs">
                {audioManager.getIsMuted() ? '🔇 Muted' : '🔊 Playing'} | Press 'M' to toggle
              </div>
            </div>
          )}
        </div>

        {/* Botones de control de audio */}
        <div className="mt-4 flex gap-2 justify-center items-center">
          <VolumeControl />
          
          {hasUserInteracted && isAudioInitialized && (
            <Button 
              onClick={() => {
                audioManager.toggleMute();
                audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.3);
              }}
              variant="secondary"
              className="text-sm px-4 py-2 backdrop-blur-sm bg-slate-700/80 hover:bg-slate-600/90 border border-slate-500/50"
            >
              {audioManager.getIsMuted() ? '🔊 Unmute' : '🔇 Mute'}
            </Button>
          )}
          
          <Button 
            onClick={() => setShowAudioTest(true)}
            variant="secondary"
            className="text-sm px-4 py-2 backdrop-blur-sm bg-slate-700/80 hover:bg-slate-600/90 border border-slate-500/50"
          >
            🔊 Audio Test
          </Button>
        </div>
      </div>

      {/* Componente de prueba de audio */}
      {showAudioTest && (
        <AudioTest onClose={() => setShowAudioTest(false)} />
      )}

      {/* Efectos CSS personalizados */}
      <style>{`
        @keyframes title-glow {
          0%, 100% { 
            text-shadow: 
              0 0 20px rgba(56, 189, 248, 0.5), 
              0 0 40px rgba(56, 189, 248, 0.3), 
              0 0 60px rgba(56, 189, 248, 0.1),
              0 4px 8px rgba(0, 0, 0, 0.3);
          }
          50% { 
            text-shadow: 
              0 0 30px rgba(56, 189, 248, 0.8), 
              0 0 50px rgba(56, 189, 248, 0.5), 
              0 0 70px rgba(56, 189, 248, 0.3),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
        }
        .animate-title-glow {
          animation: title-glow 3s ease-in-out infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }

        @keyframes float-up {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { opacity: 0.1; }
          100% { transform: translateY(-20px) rotate(360deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 4s ease-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
          }
          50% { 
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.6);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};