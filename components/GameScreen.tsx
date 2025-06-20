
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlyingObjectState, GameObjectType, GameStatus } from '../types';
import { FlyingObject } from './FlyingObject';
import { ScoreDisplay } from './ScoreDisplay';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  OBJECT_CONFIGS,
  OBJECT_SPAWN_INTERVAL_MS,
  OBJECT_MIN_SPEED,
  OBJECT_MAX_SPEED,
  OBJECT_MIN_ROTATION_SPEED,
  OBJECT_MAX_ROTATION_SPEED,
  INITIAL_LIVES,
} from '../constants';

interface GameScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const GameScreen: React.FC<GameScreenProps> = ({ onGameOver }) => {
  const [flyingObjects, setFlyingObjects] = useState<FlyingObjectState[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastSpawnTimeRef = useRef<number>(0);

  const spawnObject = useCallback(() => {
    const objectTypes = Object.values(GameObjectType);
    const randomType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
    const config = OBJECT_CONFIGS[randomType];

    let x, y, vx, vy;
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

    const speed = OBJECT_MIN_SPEED + Math.random() * (OBJECT_MAX_SPEED - OBJECT_MIN_SPEED);

    switch (side) {
      case 0: // Top
        x = Math.random() * GAME_WIDTH;
        y = -config.size;
        vx = (Math.random() - 0.5) * speed; // Move somewhat horizontally
        vy = speed; // Move downwards
        break;
      case 1: // Right
        x = GAME_WIDTH + config.size;
        y = Math.random() * GAME_HEIGHT;
        vx = -speed; // Move leftwards
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // Bottom
        x = Math.random() * GAME_WIDTH;
        y = GAME_HEIGHT + config.size;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed; // Move upwards
        break;
      default: // Left (case 3)
        x = -config.size;
        y = Math.random() * GAME_HEIGHT;
        vx = speed; // Move rightwards
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    
    // Ensure objects generally fly towards the center, not just straight
    const targetX = GAME_WIDTH / 2 + (Math.random() - 0.5) * (GAME_WIDTH / 3);
    const targetY = GAME_HEIGHT / 2 + (Math.random() - 0.5) * (GAME_HEIGHT / 3);
    const angleToTarget = Math.atan2(targetY - y, targetX - x);
    vx = Math.cos(angleToTarget) * speed;
    vy = Math.sin(angleToTarget) * speed;


    const newObject: FlyingObjectState = {
      id: generateId(),
      type: randomType,
      x, y, vx, vy,
      rotation: Math.random() * 360,
      rotationSpeed: OBJECT_MIN_ROTATION_SPEED + Math.random() * (OBJECT_MAX_ROTATION_SPEED - OBJECT_MIN_ROTATION_SPEED),
      config,
    };
    setFlyingObjects(prev => [...prev, newObject]);
  }, []);

  const handleObjectClick = useCallback((id: string, type: GameObjectType) => {
    setFlyingObjects(prev => prev.filter(obj => obj.id !== id));
    const config = OBJECT_CONFIGS[type];
    if (config.isBomb) {
      setLives(prev => prev - 1);
    } else {
      setScore(prev => prev + config.points);
    }
  }, []);

  useEffect(() => {
    if (lives <= 0) {
      onGameOver(score);
    }
  }, [lives, score, onGameOver]);

  useEffect(() => {
    let animationFrameId: number;
    
    const gameLoop = (timestamp: number) => {
      setFlyingObjects(prevObjects =>
        prevObjects
          .map(obj => ({
            ...obj,
            x: obj.x + obj.vx,
            y: obj.y + obj.vy,
            rotation: obj.rotation + obj.rotationSpeed,
          }))
          .filter(obj => {
            const isOffScreen = obj.x < -obj.config.size * 2 || obj.x > GAME_WIDTH + obj.config.size * 2 ||
                                obj.y < -obj.config.size * 2 || obj.y > GAME_HEIGHT + obj.config.size * 2;
            if (isOffScreen && !obj.config.isBomb) {
              // Penalize for missing good items by reducing lives, but not too aggressively
              // This logic could be adjusted or removed based on desired difficulty
              // setLives(prev => Math.max(0, prev - 0.1)); // Example: Small penalty
            }
            return !isOffScreen;
          })
      );

      if (timestamp - lastSpawnTimeRef.current > OBJECT_SPAWN_INTERVAL_MS) {
        spawnObject();
        lastSpawnTimeRef.current = timestamp;
      }
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    lastSpawnTimeRef.current = performance.now();
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnObject]); // spawnObject is memoized with useCallback

  return (
    <div 
      ref={gameAreaRef}
      className="relative bg-slate-700 overflow-hidden cursor-crosshair shadow-2xl rounded-lg"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
    >
      <ScoreDisplay score={score} lives={lives} />
      {flyingObjects.map(obj => (
        <FlyingObject key={obj.id} objectState={obj} onClick={handleObjectClick} />
      ))}
      {/* Background elements can be added here */}
       <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")`}}></div>
    </div>
  );
};
