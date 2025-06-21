import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlyingObjectState, GameObjectType, TargetState } from '../types';
import { FlyingObject } from './FlyingObject';
import { ScoreDisplay } from './ScoreDisplay';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  OBJECT_CONFIGS,
  TARGET_PRACTICE_DURATION_S,
  TARGET_SPAWN_INTERVAL_MS,
  TARGET_LIFESPAN_MS,
  SHURIKEN_LAUNCH_SPEED,
  TARGET_DEFINITIONS,
  MAX_PROJECTILES_TARGET_MODE, // Corrected import
  OBJECT_MIN_ROTATION_SPEED,
  OBJECT_MAX_ROTATION_SPEED,
  ShurikenIcon,
  getAssetPath
} from '../constants';
import { SuperExplosionSystem } from './ui/SuperExplosionSystem';

interface TargetPracticeScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Array de imágenes de villanos para los blancos
const VILLAIN_IMAGES = [
  'lord-vortech-as-a-ninjago-villain-v0-3mpyxo2gwx5f1.webp',
  'Ninja_Hero_Frak_29.webp',
  'what-is-the-oni-form-of-garmadon.webp',
  'LAND_16_9 (1).jpg',
  'images (1)jj.jpg',
  'FangtomS1.webp'
];

export const TargetPracticeScreen: React.FC<TargetPracticeScreenProps> = ({ onGameOver }) => {
  const [targets, setTargets] = useState<TargetState[]>([]);
  const [projectiles, setProjectiles] = useState<FlyingObjectState[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TARGET_PRACTICE_DURATION_S);
  const [explosionEffects, setExplosionEffects] = useState<{id: string, x: number, y: number, points: number, villainImage: string, createdAt: number}[]>([]);
  const [hitEffects, setHitEffects] = useState<{id: string, x: number, y: number, createdAt: number, particles: {x: number, y: number, vx: number, vy: number, color: string, size: number}[]}[]>([]);
  
  // Enhanced explosions state
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
  const animationFrameIdRef = useRef<number | undefined>(undefined);

  const spawnTarget = useCallback(() => {
    const targetDef = TARGET_DEFINITIONS[Math.floor(Math.random() * TARGET_DEFINITIONS.length)];
    const randomVillainImage = VILLAIN_IMAGES[Math.floor(Math.random() * VILLAIN_IMAGES.length)];
    const newTarget: TargetState & { villainImage: string } = {
      id: generateId(),
      x: Math.random() * (GAME_WIDTH - targetDef.size * 2) + targetDef.size,
      y: Math.random() * (GAME_HEIGHT * 0.7 - targetDef.size * 2) + targetDef.size, // Spawn in upper 70%
      size: targetDef.size,
      points: targetDef.points,
      createdAt: performance.now(),
      hit: false,
      villainImage: randomVillainImage,
    };
    setTargets(prev => [...prev, newTarget as TargetState]);
  }, []);

  // Función para crear efectos explosivos cuando se destruye un villano
  const createExplosionEffect = useCallback((x: number, y: number, points: number, villainImage: string) => {
    // Crear explosión principal
    const explosionId = generateId();
    setExplosionEffects(prev => [...prev, {
      id: explosionId,
      x: x,
      y: y,
      points: points,
      villainImage: villainImage,
      createdAt: performance.now()
    }]);

    // Crear explosión súper mejorada basada en puntos
    const explosionIntensity = points >= 100 ? 2 : points >= 50 ? 1.5 : 1;
    const explosionType = points >= 100 ? 'large' : points >= 50 ? 'medium' : 'small';
    
    const superExplosionId = generateId();
    setSuperExplosions(prev => [...prev, {
      id: superExplosionId,
      x: x,
      y: y,
      intensity: explosionIntensity,
      type: explosionType,
      color: points >= 100 ? '#EF4444' : points >= 50 ? '#F59E0B' : '#10B981',
      duration: explosionType === 'large' ? 3500 : explosionType === 'medium' ? 2500 : 1500,
      particles: [],
      createdAt: performance.now()
    }]);

    // Crear partículas de explosión
    const particleCount = Math.floor(points / 2) + 8; // Más partículas para blancos más valiosos
    const particles: {x: number, y: number, vx: number, vy: number, color: string, size: number}[] = [];
    
    const colors = ['#FF4444', '#FF8800', '#FFFF00', '#FF00FF', '#00FFFF', '#88FF00'];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6
      });
    }

    const hitEffectId = generateId();
    setHitEffects(prev => [...prev, {
      id: hitEffectId,
      x: x,
      y: y,
      createdAt: performance.now(),
      particles: particles
    }]);

    // Remover efectos después de las animaciones
    setTimeout(() => {
      setExplosionEffects(prev => prev.filter(effect => effect.id !== explosionId));
    }, 2500);

    setTimeout(() => {
      setHitEffects(prev => prev.filter(effect => effect.id !== hitEffectId));
    }, 2000);
  }, []);

  const launchShuriken = useCallback((mouseX: number, mouseY: number) => {
    if (projectiles.length >= MAX_PROJECTILES_TARGET_MODE) return; // Corrected usage

    const shurikenConfig = OBJECT_CONFIGS[GameObjectType.SHURIKEN];
    const startX = GAME_WIDTH / 2;
    const startY = GAME_HEIGHT - shurikenConfig.size / 2 - 10; // Launch from bottom center

    const angle = Math.atan2(mouseY - startY, mouseX - startX);
    const vx = Math.cos(angle) * SHURIKEN_LAUNCH_SPEED;
    const vy = Math.sin(angle) * SHURIKEN_LAUNCH_SPEED;

    const newProjectile: FlyingObjectState = {
      id: generateId(),
      type: GameObjectType.SHURIKEN,
      config: shurikenConfig,
      x: startX,
      y: startY,
      vx,
      vy,
      rotation: 0,
      rotationSpeed: (OBJECT_MIN_ROTATION_SPEED + Math.random() * (OBJECT_MAX_ROTATION_SPEED - OBJECT_MIN_ROTATION_SPEED)) * (Math.random() > 0.5 ? 2 : -2) , // Faster spin for projectiles
      isProjectile: true,
    };
    setProjectiles(prev => [...prev, newProjectile]);
  }, [projectiles.length]);

  // Callback for handling explosion completion
  const handleSuperExplosionComplete = useCallback((id: string) => {
    setSuperExplosions(prev => prev.filter(explosion => explosion.id !== id));
  }, []);

  // Manejar clicks del mouse para lanzar proyectiles
  const handleGameAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    launchShuriken(clickX, clickY);
  };

  // Manejar controles de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        // Disparar al centro de la pantalla con espacio o enter
        event.preventDefault();
        launchShuriken(GAME_WIDTH / 2, GAME_HEIGHT / 2);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [launchShuriken]);

  useEffect(() => {
    gameStartTimeRef.current = performance.now();
    lastSpawnTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const elapsedSeconds = (timestamp - gameStartTimeRef.current) / 1000;
      setTimeLeft(TARGET_PRACTICE_DURATION_S - elapsedSeconds);

      if (TARGET_PRACTICE_DURATION_S - elapsedSeconds <= 0) {
        onGameOver(score);
        return;
      }

      // Update projectiles
      setProjectiles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            rotation: p.rotation + p.rotationSpeed,
          }))
          .filter(p => p.x > -p.config.size && p.x < GAME_WIDTH + p.config.size && p.y > -p.config.size && p.y < GAME_HEIGHT + p.config.size)
      );

      // Update targets (remove old ones)
      setTargets(prev => prev.filter(t => !t.hit && timestamp - t.createdAt < TARGET_LIFESPAN_MS));
      
      // Update hit effect particles
      setHitEffects(prevEffects =>
        prevEffects.map(effect => ({
          ...effect,
          particles: effect.particles.map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.3 // Gravity effect
          }))
        })).filter(effect => timestamp - effect.createdAt < 2000) // Remove old effects
      );
      
      // Spawn new targets
      if (timestamp - lastSpawnTimeRef.current > TARGET_SPAWN_INTERVAL_MS) {
        spawnTarget();
        lastSpawnTimeRef.current = timestamp;
      }

      // Collision detection
      setProjectiles(currentProjectiles => {
        const remainingProjectiles = [];
        for (const proj of currentProjectiles) {
          let hitTarget = false;
          setTargets(currentTargets => 
            currentTargets.map(target => {
              if (target.hit) return target; // Already hit

              const dx = proj.x - target.x;
              const dy = proj.y - target.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < proj.config.size / 2 + target.size / 2) {
                hitTarget = true;
                setScore(s => s + target.points);
                createExplosionEffect(target.x, target.y, target.points, target.villainImage || VILLAIN_IMAGES[0]); // Create explosion effect
                return { ...target, hit: true }; // Mark as hit
              }
              return target;
            })
          );
          if (!hitTarget) {
            remainingProjectiles.push(proj);
          }
        }
        return remainingProjectiles;
      });
      
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [onGameOver, score, spawnTarget, launchShuriken]);


  return (
    <div
      ref={gameAreaRef}
      className="relative bg-slate-800 overflow-hidden cursor-crosshair shadow-2xl rounded-lg"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      onClick={handleGameAreaClick}
      role="application" // More appropriate role for interactive game area
      aria-label="Target Practice Game Area: Click to launch shurikens"
    >
      <ScoreDisplay score={score} timeLeft={timeLeft} />
      
      {targets.map(target => {
        const targetDef = TARGET_DEFINITIONS.find(def => def.size === target.size) || TARGET_DEFINITIONS[0];
        return (
          <div
            key={target.id}
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `${target.x - target.size / 2}px`,
              top: `${target.y - target.size / 2}px`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              opacity: target.hit ? 0 : 1,
              transform: target.hit ? 'scale(1.5)' : 'scale(1)',
            }}
            aria-hidden="true" // Decorative, interaction is via main game area
          >
            {/* Imagen de villano como blanco */}
            <div 
              className="w-full h-full rounded-full border-4 border-red-500 shadow-lg overflow-hidden relative animate-target-appear"
              style={{
                backgroundImage: `url(${getAssetPath(`/pictures/villains/${target.villainImage || VILLAIN_IMAGES[0]}`)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: `0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.3)`,
              }}
            >
              {/* Overlay de blanco con cruz */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-1 bg-red-600 absolute"></div>
                <div className="w-1 h-8 bg-red-600 absolute"></div>
              </div>
              {/* Marco adicional para destacar */}
              <div className={`absolute inset-0 rounded-full border-2 ${targetDef.color.replace('fill-', 'border-')}`}></div>
            </div>
          </div>
        );
      })}

      {/* Efectos de explosión de villanos */}
      {explosionEffects.map(effect => (
        <div 
          key={effect.id}
          className="absolute pointer-events-none"
          style={{
            left: `${effect.x - 60}px`,
            top: `${effect.y - 60}px`,
            zIndex: 20,
          }}
        >
          {/* Imagen de villano destruido con efectos */}
          <div 
            className="w-32 h-32 rounded-full border-4 border-orange-400 shadow-2xl animate-villain-explosion overflow-hidden"
            style={{
              backgroundImage: `url(${getAssetPath(`/pictures/villains/${effect.villainImage}`)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: '0 0 50px rgba(255, 165, 0, 1), 0 0 100px rgba(255, 69, 0, 0.8)',
            }}
          />
          {/* Efectos de destrucción */}
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-red-500 rounded-full animate-bounce opacity-80"></div>
            <div className="absolute -top-4 -right-4 w-6 h-6 bg-orange-500 rounded-full animate-bounce delay-100 opacity-80"></div>
            <div className="absolute -bottom-4 -left-4 w-7 h-7 bg-yellow-500 rounded-full animate-bounce delay-200 opacity-80"></div>
            <div className="absolute -bottom-4 -right-4 w-5 h-5 bg-red-600 rounded-full animate-bounce delay-300 opacity-80"></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-orange-600 rounded-full animate-bounce delay-400 opacity-80"></div>
          </div>
          {/* Puntos obtenidos */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-yellow-300 font-bold text-2xl animate-score-popup">
            +{effect.points}
          </div>
        </div>
      ))}

      {/* Enhanced Super Explosion System */}
      <SuperExplosionSystem 
        explosions={superExplosions}
        onExplosionComplete={handleSuperExplosionComplete}
      />

      {/* Efectos de partículas de explosión */}
      {hitEffects.map(effect => (
        <div key={effect.id} className="absolute pointer-events-none" style={{ left: effect.x, top: effect.y, zIndex: 25 }}>
          {effect.particles.map((particle, index) => (
            <div
              key={index}
              className="absolute rounded-full animate-pulse"
              style={{
                left: `${particle.x}px`,
                top: `${particle.y}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
                opacity: Math.max(0, 1 - (performance.now() - effect.createdAt) / 2000)
              }}
            />
          ))}
        </div>
      ))}

      {projectiles.map(proj => (
        <FlyingObject key={proj.id} objectState={proj} /> // No onClick for projectiles
      ))}
      
      {/* Enhanced Super Explosion System */}
      <SuperExplosionSystem 
        explosions={superExplosions}
        onExplosionComplete={handleSuperExplosionComplete}
      />
      
      {/* Launcher Area Visual Cue (optional) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-slate-700 rounded-t-lg flex items-center justify-center"
        aria-hidden="true"
      >
        <ShurikenIcon size={24} className="text-slate-400" />
      </div>

      {/* Estilos CSS para animaciones de explosión */}
      <style>{`
        @keyframes villain-explosion {
          0% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
            filter: brightness(1) hue-rotate(0deg);
          }
          25% { 
            transform: scale(1.3) rotate(90deg); 
            opacity: 1; 
            filter: brightness(2) hue-rotate(90deg);
          }
          50% { 
            transform: scale(1.5) rotate(180deg); 
            opacity: 0.8; 
            filter: brightness(3) hue-rotate(180deg);
          }
          75% { 
            transform: scale(1.2) rotate(270deg); 
            opacity: 0.6; 
            filter: brightness(2.5) hue-rotate(270deg);
          }
          100% { 
            transform: scale(0.2) rotate(360deg); 
            opacity: 0; 
            filter: brightness(4) hue-rotate(360deg);
          }
        }
        .animate-villain-explosion {
          animation: villain-explosion 2.5s ease-out forwards;
        }

        @keyframes score-popup {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 0; 
          }
          20% { 
            transform: translateY(-20px) scale(1.2); 
            opacity: 1; 
          }
          80% { 
            transform: translateY(-40px) scale(1.1); 
            opacity: 1; 
          }
          100% { 
            transform: translateY(-60px) scale(0.8); 
            opacity: 0; 
          }
        }
        .animate-score-popup {
          animation: score-popup 1.5s ease-out forwards;
        }

        @keyframes target-appear {
          0% { 
            transform: scale(0) rotate(-180deg); 
            opacity: 0; 
            filter: brightness(0.5);
          }
          50% { 
            transform: scale(1.1) rotate(-90deg); 
            opacity: 0.8; 
            filter: brightness(1.2);
          }
          100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
            filter: brightness(1);
          }
        }
        .animate-target-appear {
          animation: target-appear 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
