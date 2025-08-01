
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlyingObjectState, GameObjectType, DragonShipState, DragonFireState, ExplosionState } from '../types';
import { FlyingObject } from './FlyingObject';
import { DragonShip } from './DragonShip';
import { DragonFire } from './DragonFire';
import { ExplosionEffect } from './ExplosionEffect';
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
  DRAGON_SHIP_WIDTH,
  DRAGON_SHIP_HEIGHT,
  DRAGON_SHIP_SPEED,
  DRAGON_FIRE_SPEED,
  DRAGON_FIRE_SIZE,
  DRAGON_FIRE_COOLDOWN_MS,
  MAX_DRAGON_FIRES,
  MAX_FLYING_OBJECTS,
} from '../constants';

interface GameScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const GameScreen: React.FC<GameScreenProps> = ({ onGameOver }) => {
  const [flyingObjects, setFlyingObjects] = useState<FlyingObjectState[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [dragonShip, setDragonShip] = useState<DragonShipState>({
    id: 'dragon-ship',
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    width: DRAGON_SHIP_WIDTH,
    height: DRAGON_SHIP_HEIGHT,
    rotation: 0,
  });
  const [dragonFires, setDragonFires] = useState<DragonFireState[]>([]);
  const [explosions, setExplosions] = useState<ExplosionState[]>([]);
  const [keys, setKeys] = useState<{[key: string]: boolean}>({});
  const [lastFireTime, setLastFireTime] = useState<number>(0);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const lastSpawnTimeRef = useRef<number>(0);

  // Función para disparar fuego desde el dragón
  const fireDragonFire = useCallback(() => {
    const now = performance.now();
    if (now - lastFireTime < DRAGON_FIRE_COOLDOWN_MS || dragonFires.length >= MAX_DRAGON_FIRES) {
      return;
    }

    const newFire: DragonFireState = {
      id: generateId(),
      x: dragonShip.x,
      y: dragonShip.y - dragonShip.height / 2,
      vx: 0,
      vy: -DRAGON_FIRE_SPEED,
      size: DRAGON_FIRE_SIZE,
      createdAt: now,
    };

    setDragonFires(prev => [...prev, newFire]);
    setLastFireTime(now);
  }, [dragonShip, dragonFires.length, lastFireTime]);

  // Función para mover el dragón
  const moveDragon = useCallback(() => {
    setDragonShip(prevDragon => {
      let newX = prevDragon.x;
      let newY = prevDragon.y;
      let newRotation = 0;

      if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        newX = Math.max(prevDragon.width / 2, newX - DRAGON_SHIP_SPEED);
        newRotation = -15;
      }
      if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        newX = Math.min(GAME_WIDTH - prevDragon.width / 2, newX + DRAGON_SHIP_SPEED);
        newRotation = 15;
      }
      if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        newY = Math.max(prevDragon.height / 2, newY - DRAGON_SHIP_SPEED);
      }
      if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        newY = Math.min(GAME_HEIGHT - prevDragon.height / 2, newY + DRAGON_SHIP_SPEED);
      }

      return {
        ...prevDragon,
        x: newX,
        y: newY,
        rotation: newRotation,
      };
    });
  }, [keys]);

  // Crear explosión
  const createExplosion = useCallback((x: number, y: number, type: 'fire' | 'bomb' | 'impact') => {
    const newExplosion: ExplosionState = {
      id: generateId(),
      x,
      y,
      type,
      createdAt: performance.now(),
    };
    setExplosions(prev => [...prev, newExplosion]);
  }, []);

  // Eliminar explosión completada
  const removeExplosion = useCallback((explosionId: string) => {
    setExplosions(prev => prev.filter(explosion => explosion.id !== explosionId));
  }, []);

  // Detectar colisiones entre fuego de dragón y objetos
  const checkFireCollisions = useCallback(() => {
    setDragonFires(prevFires => 
      prevFires.filter(fire => {
        let fireHit = false;
        
        setFlyingObjects(prevObjects => 
          prevObjects.filter(obj => {
            const distance = Math.sqrt(
              Math.pow(fire.x - obj.x, 2) + Math.pow(fire.y - obj.y, 2)
            );
            
            if (distance < (fire.size + obj.config.size) / 2) {
              fireHit = true;
              
              // Crear explosión en la posición del objeto
              const explosionType = obj.config.isBomb ? 'bomb' : 'fire';
              createExplosion(obj.x, obj.y, explosionType);
              
              console.log(`🎯 Colisión detectada! Objeto eliminado: ${obj.type}, Explosión: ${explosionType}`);
              
              if (obj.config.isBomb) {
                setLives(prev => Math.max(0, prev - 1));
              } else {
                setScore(prev => prev + obj.config.points);
              }
              
              return false; // Remover objeto
            }
            return true;
          })
        );
        
        if (fireHit) {
          console.log('🔥 Proyectil eliminado por colisión');
        }
        
        return !fireHit;
      })
    );
  }, [createExplosion]);

  const spawnObject = useCallback(() => {
    // Verificar límite de objetos en pantalla
    if (flyingObjects.length >= MAX_FLYING_OBJECTS) {
      console.log(`⚠️ Límite de objetos alcanzado: ${flyingObjects.length}/${MAX_FLYING_OBJECTS}`);
      return;
    }
    
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
  }, [flyingObjects.length]); // Añadir dependencia para el límite de objetos

  const handleObjectClick = useCallback((id: string, type: GameObjectType) => {
    setFlyingObjects(prev => prev.filter(obj => obj.id !== id));
    const config = OBJECT_CONFIGS[type];
    if (config.isBomb) {
      setLives(prev => prev - 1);
    } else {
      setScore(prev => prev + config.points);
    }
  }, []);

  // Event listeners para controles del dragón
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.key]: true }));
      
      // Disparar con barra espaciadora
      if (event.key === ' ') {
        event.preventDefault();
        fireDragonFire();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [event.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fireDragonFire]);

  // Actualizar movimiento del dragón
  useEffect(() => {
    const interval = setInterval(() => {
      moveDragon();
      checkFireCollisions();
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  }, [moveDragon, checkFireCollisions]);

  // Limpiar proyectiles de fuego antiguos
  useEffect(() => {
    const interval = setInterval(() => {
      setDragonFires(prev => 
        prev.filter(fire => {
          const age = (performance.now() - fire.createdAt) / 1000;
          return age < 3 && fire.y > -fire.size; // Remover después de 3 segundos o si sale de pantalla
        })
      );
      
      // Limpiar explosiones que han durado más de 2 segundos (por seguridad)
      setExplosions(prev => 
        prev.filter(explosion => {
          const age = (performance.now() - explosion.createdAt) / 1000;
          return age < 2;
        })
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lives <= 0) {
      onGameOver(score);
    }
  }, [lives, score, onGameOver]);

  useEffect(() => {
    let animationFrameId: number;
    
    const gameLoop = (timestamp: number) => {
      setFlyingObjects(prevObjects => {
        const newObjects = prevObjects
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
          });
        
        // Log de rendimiento cada 5 segundos
        if (timestamp % 5000 < 16) {
          console.log(`📊 Rendimiento - Objetos: ${newObjects.length}, Proyectiles: ${dragonFires.length}, Explosiones: ${explosions.length}`);
        }
        
        return newObjects;
      });

      // Actualizar proyectiles de fuego del dragón
      setDragonFires(prevFires =>
        prevFires.map(fire => ({
          ...fire,
          x: fire.x + fire.vx,
          y: fire.y + fire.vy,
        }))
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
      
      {/* Objetos voladores */}
      {flyingObjects.map(obj => (
        <FlyingObject key={obj.id} objectState={obj} onClick={handleObjectClick} />
      ))}
      
      {/* Nave Dragón */}
      <DragonShip dragonShip={dragonShip} />
      
      {/* Proyectiles de fuego del dragón */}
      {dragonFires.map(fire => (
        <DragonFire key={fire.id} fire={fire} />
      ))}
      
      {/* Efectos de explosión */}
      {explosions.map(explosion => (
        <ExplosionEffect 
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          type={explosion.type}
          onComplete={() => removeExplosion(explosion.id)}
        />
      ))}
      
      {/* Instrucciones de control */}
      <div className="absolute top-16 left-4 text-white text-sm opacity-75 pointer-events-none">
        <div className="bg-black bg-opacity-50 rounded p-2">
          <div>🐲 Controles del Dragón:</div>
          <div>⬅️➡️⬆️⬇️ Mover</div>
          <div>WASD Mover</div>
          <div>Espacio 🔥 Disparar</div>
        </div>
      </div>
      
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10" style={{backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")`}}></div>
    </div>
  );
};
