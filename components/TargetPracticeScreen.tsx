
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
  TargetIcon,
  MAX_PROJECTILES_TARGET_MODE, // Corrected import
  OBJECT_MIN_ROTATION_SPEED,
  OBJECT_MAX_ROTATION_SPEED,
  ShurikenIcon
} from '../constants';

interface TargetPracticeScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const TargetPracticeScreen: React.FC<TargetPracticeScreenProps> = ({ onGameOver }) => {
  const [targets, setTargets] = useState<TargetState[]>([]);
  const [projectiles, setProjectiles] = useState<FlyingObjectState[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TARGET_PRACTICE_DURATION_S);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | undefined>(undefined);

  const spawnTarget = useCallback(() => {
    const targetDef = TARGET_DEFINITIONS[Math.floor(Math.random() * TARGET_DEFINITIONS.length)];
    const newTarget: TargetState = {
      id: generateId(),
      x: Math.random() * (GAME_WIDTH - targetDef.size * 2) + targetDef.size,
      y: Math.random() * (GAME_HEIGHT * 0.7 - targetDef.size * 2) + targetDef.size, // Spawn in upper 70%
      size: targetDef.size,
      points: targetDef.points,
      createdAt: performance.now(),
      hit: false,
    };
    setTargets(prev => [...prev, newTarget]);
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

  const handleGameAreaClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    launchShuriken(clickX, clickY);
  };

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
            className="absolute transition-opacity duration-300 ease-out"
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
            <TargetIcon size={target.size} color={targetDef.color} />
          </div>
        );
      })}

      {projectiles.map(proj => (
        <FlyingObject key={proj.id} objectState={proj} /> // No onClick for projectiles
      ))}
      
      {/* Launcher Area Visual Cue (optional) */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-slate-700 rounded-t-lg flex items-center justify-center"
        aria-hidden="true"
      >
        <ShurikenIcon size={24} className="text-slate-400" />
      </div>
    </div>
  );
};
