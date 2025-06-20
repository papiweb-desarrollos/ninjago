import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MazeData, PlayerState, RobotEnemyState, MazeProjectile, BoAttack, Direction, MazeCellType, GameObjectType,
  PlayerAnimationState, RobotAnimationState, SoundEffect
} from '../types';
import {
  GAME_WIDTH, GAME_HEIGHT, MAZE_COLS, MAZE_ROWS, CELL_SIZE,
  PLAYER_INITIAL_HEALTH, PLAYER_INITIAL_SHURIKENS, PLAYER_INITIAL_KUNAIS, PLAYER_SIZE, PLAYER_MOVE_FRAMES, PLAYER_HIT_FLASH_DURATION,
  ROBOT_INITIAL_HEALTH, ROBOT_SIZE, ROBOT_MOVE_FRAMES, ROBOT_ATTACK_DAMAGE, ROBOT_DAMAGE_COOLDOWN_FRAMES,
  ROBOT_RESPAWN_DELAY_FRAMES, ROBOT_CONFIGURATIONS, ROBOT_HIT_FLASH_DURATION,
  SHURIKEN_PROJECTILE_SPEED_MAZE, MAX_PROJECTILES_MAZE, SHURIKEN_DAMAGE,
  KUNAI_PROJECTILE_SPEED_MAZE, MAX_KUNAIS_MAZE, KUNAI_DAMAGE, KUNAI_GUN_COOLDOWN_FRAMES,
  BO_ATTACK_DURATION_FRAMES, BO_ATTACK_DAMAGE, BO_STAFF_COOLDOWN_FRAMES,
  PlayerNinjaIcon, RobotEnemyIcon, ExitDoorIcon, ShurikenIcon, KunaiIcon, BoStaffIcon, SoundOnIcon, SoundOffIcon,
  OBJECT_CONFIGS,
  MAZE_WALL_COLOR_TOP, MAZE_WALL_COLOR_BOTTOM, MAZE_WALL_BORDER_COLOR, MAZE_PATH_COLOR, MAZE_PATH_BORDER_COLOR,
  MAZE_START_COLOR, MAZE_EXIT_COLOR, PLAYER_COLOR, KUNAI_MAZE_COLOR, SHURIKEN_MAZE_COLOR, BO_STAFF_ATTACK_COLOR,
  EXIT_DOOR_SYMBOL_COLOR
} from '../constants';
import { generateFullMazeData } from '../mazeGenerator';
import { ScoreDisplay } from './ScoreDisplay';
import { audioManager } from '../AudioManager';

interface MazeEscapeScreenProps {
  onGameOver: (score: number) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getPixelCoords = (gridX: number, gridY: number, itemSize: number) => ({
  pixelX: gridX * CELL_SIZE + (CELL_SIZE - itemSize) / 2,
  pixelY: gridY * CELL_SIZE + (CELL_SIZE - itemSize) / 2,
});

const soundsToPreload: SoundEffect[] = [
  SoundEffect.PLAYER_SHURIKEN_THROW,
  SoundEffect.PLAYER_KUNAI_THROW,
  SoundEffect.PLAYER_BO_STAFF_ATTACK,
  SoundEffect.PROJECTILE_HIT_ROBOT,
  SoundEffect.PROJECTILE_HIT_WALL,
  SoundEffect.ROBOT_DEFEATED,
  SoundEffect.PLAYER_TAKE_DAMAGE,
  SoundEffect.MAZE_EXIT_SUCCESS,
  SoundEffect.ROBOT_RESPAWN,
  SoundEffect.UI_CLICK_GENERAL,
  SoundEffect.PLAYER_MOVE_STEP,
  SoundEffect.ROBOT_MOVE_STEP,
  SoundEffect.PLAYER_DEFEATED,
  SoundEffect.BACKGROUND_NINJAGO_THEME, // Use the new theme for preloading
];

export const MazeEscapeScreen: React.FC<MazeEscapeScreenProps> = ({ onGameOver }) => {
  const [mazeData, setMazeData] = useState<MazeData>(generateFullMazeData);
  const [isMuted, setIsMuted] = useState(audioManager.getIsMuted());

  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const start = mazeData.startPosition;
    const {pixelX, pixelY} = getPixelCoords(start.x, start.y, PLAYER_SIZE);
    return {
      id: 'player',
      gridX: start.x, gridY: start.y,
      pixelX, pixelY,
      targetGridX: start.x, targetGridY: start.y,
      moveProgress: 1,
      health: PLAYER_INITIAL_HEALTH,
      facingDirection: Direction.RIGHT,
      shurikens: PLAYER_INITIAL_SHURIKENS,
      kunais: PLAYER_INITIAL_KUNAIS,
      isMoving: false, isAttacking: false,
      hitCooldown: 0,
      animationState: PlayerAnimationState.IDLE,
      animationTimer: 0,
    };
  });

  const [robots, setRobots] = useState<RobotEnemyState[]>(() =>
    mazeData.enemyStartPositions.map((pos, index) => {
      const config = ROBOT_CONFIGURATIONS[index % ROBOT_CONFIGURATIONS.length];
      const {pixelX, pixelY} = getPixelCoords(pos.x, pos.y, ROBOT_SIZE);
      return {
        id: `robot-${index}`,
        gridX: pos.x, gridY: pos.y,
        initialGridX: pos.x, initialGridY: pos.y,
        pixelX, pixelY,
        targetGridX: pos.x, targetGridY: pos.y,
        moveProgress: 1,
        health: config.health,
        facingDirection: Direction.LEFT,
        isMoving: false,
        recentlyHitByBo: false,
        isDefeated: false,
        respawnTimer: 0,
        originalSpawnIndex: index,
        animationState: RobotAnimationState.IDLE,
        animationTimer: 0,
      };
    })
  );

  const [projectiles, setProjectiles] = useState<MazeProjectile[]>([]);
  const [boAttack, setBoAttack] = useState<BoAttack | null>(null);
  const [boStaffCooldown, setBoStaffCooldown] = useState(0);
  const [kunaiGunCooldown, setKunaiGunCooldown] = useState(0);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const pressedKeys = useRef<Set<string>>(new Set());
  const audioInitializedRef = useRef(false);
  const gameOverCalledRef = useRef(false); // To prevent multiple onGameOver calls

  const tryInitializeAudioAndMusic = async () => {
    if (!audioInitializedRef.current) {
        const success = await audioManager.initialize();
        if (success) {
            audioInitializedRef.current = true;
            await audioManager.preloadSounds(soundsToPreload);
            // Use the new theme with a non-invasive volume
            audioManager.playMusic(SoundEffect.BACKGROUND_NINJAGO_THEME, 0.15); 
            console.log("Audio initialized, sounds preloaded, Ninjago music started.");
        } else {
            console.warn("Failed to initialize audio. Music and sounds won't play.");
        }
    } else if (audioManager.getAudioContextState() === 'suspended') { 
        await audioManager.initialize(); 
        audioManager.playMusic(SoundEffect.BACKGROUND_NINJAGO_THEME, 0.15); 
    }
  };


  useEffect(() => {
    const handleFirstInteraction = async () => {
        await tryInitializeAudioAndMusic();
        window.removeEventListener('keydown', handleFirstInteractionKey);
        window.removeEventListener('click', handleFirstInteractionClick);
    };
    
    const handleFirstInteractionKey = (e: KeyboardEvent) => {
        handleFirstInteraction();
    };
    const handleFirstInteractionClick = () => {
        handleFirstInteraction();
    };

    if (!audioInitializedRef.current) {
        window.addEventListener('keydown', handleFirstInteractionKey, { once: true });
        window.addEventListener('click', handleFirstInteractionClick, { once: true });
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!audioInitializedRef.current) tryInitializeAudioAndMusic();
      
      const key = e.key.toLowerCase();
      pressedKeys.current.add(key);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'f', 'g'].includes(key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleFirstInteractionKey);
      window.removeEventListener('click', handleFirstInteractionClick);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      audioManager.stopMusic(); 
      gameOverCalledRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleToggleMute = useCallback(async () => {
    if(!audioInitializedRef.current) await tryInitializeAudioAndMusic();
    const newMuteState = audioManager.toggleMute();
    setIsMuted(newMuteState);
    audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.5);
  }, []);


  const isWalkable = useCallback((x: number, y: number, forEntity: 'player' | 'robot' = 'player', allowExit = false) => {
    if (x < 0 || x >= MAZE_COLS || y < 0 || y >= MAZE_ROWS) return false;
    const cell = mazeData.grid[y][x];
    if (cell === MazeCellType.WALL) return false;
    if (allowExit && cell === MazeCellType.EXIT && forEntity === 'player') return true;
    if (cell === MazeCellType.EXIT && forEntity === 'robot') return false; 

    if (forEntity === 'robot') {
      const otherRobotBlocking = robots.some(r => r.id !== 'current_robot_id_placeholder' && !r.isDefeated && r.gridX === x && r.gridY === y); 
      if (otherRobotBlocking) return false;
    }
    
    return cell === MazeCellType.PATH || cell === MazeCellType.START;
  }, [mazeData.grid, robots]);

  useEffect(() => {
    const gameTick = () => {
      if (gameOverCalledRef.current) { 
          if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
          return;
      }
      if (boStaffCooldown > 0) setBoStaffCooldown(prev => prev - 1);
      if (kunaiGunCooldown > 0) setKunaiGunCooldown(prev => prev - 1);

      setPlayerState(p => {
        let newPlayer = { ...p };
        if (newPlayer.animationTimer > 0) newPlayer.animationTimer--;
        else if (newPlayer.animationState !== PlayerAnimationState.IDLE && newPlayer.animationState !== PlayerAnimationState.DEFEATED) newPlayer.animationState = PlayerAnimationState.IDLE;
        
        if (newPlayer.hitCooldown > 0) newPlayer.hitCooldown--;
        if (newPlayer.health <= 0 && newPlayer.animationState !== PlayerAnimationState.DEFEATED) {
            newPlayer.animationState = PlayerAnimationState.DEFEATED;
            if (!gameOverCalledRef.current) {
                audioManager.playSound(SoundEffect.PLAYER_DEFEATED);
                audioManager.stopMusic();
                onGameOver(0); 
                gameOverCalledRef.current = true;
            }
            return newPlayer;
        }
        if (newPlayer.animationState === PlayerAnimationState.DEFEATED) return newPlayer;


        if (newPlayer.moveProgress < 1) {
            newPlayer.moveProgress += 1 / PLAYER_MOVE_FRAMES;
            const startPixel = getPixelCoords(newPlayer.gridX, newPlayer.gridY, PLAYER_SIZE);
            const targetPixel = getPixelCoords(newPlayer.targetGridX, newPlayer.targetGridY, PLAYER_SIZE);
            
            newPlayer.pixelX = startPixel.pixelX + (targetPixel.pixelX - startPixel.pixelX) * newPlayer.moveProgress;
            newPlayer.pixelY = startPixel.pixelY + (targetPixel.pixelY - startPixel.pixelY) * newPlayer.moveProgress;

            if (newPlayer.moveProgress >= 1) {
                newPlayer.moveProgress = 1;
                newPlayer.gridX = newPlayer.targetGridX;
                newPlayer.gridY = newPlayer.targetGridY;
                newPlayer.isMoving = false;
                if (mazeData.grid[newPlayer.gridY][newPlayer.gridX] === MazeCellType.EXIT) {
                    if (!gameOverCalledRef.current) {
                        audioManager.playSound(SoundEffect.MAZE_EXIT_SUCCESS);
                        audioManager.stopMusic();
                        onGameOver(newPlayer.health + newPlayer.shurikens * 2 + newPlayer.kunais); 
                        gameOverCalledRef.current = true;
                    }
                }
            }
            return newPlayer;
        }

        if (newPlayer.moveProgress >= 1 && !boAttack) {
            let dx = 0, dy = 0;
            let newFacingDir = newPlayer.facingDirection;

            if (pressedKeys.current.has('arrowup')) { dy = -1; newFacingDir = Direction.UP; }
            else if (pressedKeys.current.has('arrowdown')) { dy = 1; newFacingDir = Direction.DOWN; }
            else if (pressedKeys.current.has('arrowleft')) { dx = -1; newFacingDir = Direction.LEFT; }
            else if (pressedKeys.current.has('arrowright')) { dx = 1; newFacingDir = Direction.RIGHT; }

            if (dx !== 0 || dy !== 0) {
                const nextX = newPlayer.gridX + dx;
                const nextY = newPlayer.gridY + dy;
                if (isWalkable(nextX, nextY, 'player', true)) {
                    newPlayer.targetGridX = nextX;
                    newPlayer.targetGridY = nextY;
                    newPlayer.facingDirection = newFacingDir;
                    newPlayer.isMoving = true;
                    newPlayer.moveProgress = 0;
                    audioManager.playSound(SoundEffect.PLAYER_MOVE_STEP, 0.15); 
                } else {
                    newPlayer.facingDirection = newFacingDir; 
                }
            }

            if (pressedKeys.current.has('f') && newPlayer.shurikens > 0 && projectiles.filter(pr => pr.type === GameObjectType.SHURIKEN).length < MAX_PROJECTILES_MAZE) {
                newPlayer.shurikens--;
                audioManager.playSound(SoundEffect.PLAYER_SHURIKEN_THROW, 0.7);
                let sx = newPlayer.pixelX + PLAYER_SIZE / 2;
                let sy = newPlayer.pixelY + PLAYER_SIZE / 2;
                let svx = 0, svy = 0;
                const speed = SHURIKEN_PROJECTILE_SPEED_MAZE;
                switch (newPlayer.facingDirection) {
                    case Direction.UP: svy = -speed; break;
                    case Direction.DOWN: svy = speed; break;
                    case Direction.LEFT: svx = -speed; break;
                    case Direction.RIGHT: svx = speed; break;
                }
                setProjectiles(prev => [...prev, {
                    id: generateId(), type: GameObjectType.SHURIKEN, pixelX: sx, pixelY: sy, vx: svx, vy: svy,
                    direction: newPlayer.facingDirection, rotation: 0,
                }]);
                pressedKeys.current.delete('f'); 
            } 
            else if (pressedKeys.current.has('g') && newPlayer.kunais > 0 && kunaiGunCooldown <= 0 && projectiles.filter(pr => pr.type === GameObjectType.KUNAI).length < MAX_KUNAIS_MAZE) {
                newPlayer.kunais--;
                audioManager.playSound(SoundEffect.PLAYER_KUNAI_THROW, 0.6);
                setKunaiGunCooldown(KUNAI_GUN_COOLDOWN_FRAMES);
                let kx = newPlayer.pixelX + PLAYER_SIZE / 2;
                let ky = newPlayer.pixelY + PLAYER_SIZE / 2;
                let kvx = 0, kvy = 0;
                const speed = KUNAI_PROJECTILE_SPEED_MAZE;
                 switch (newPlayer.facingDirection) {
                    case Direction.UP: kvy = -speed; break;
                    case Direction.DOWN: kvy = speed; break;
                    case Direction.LEFT: kvx = -speed; break;
                    case Direction.RIGHT: kvx = speed; break;
                }
                setProjectiles(prev => [...prev, {
                    id: generateId(), type: GameObjectType.KUNAI, pixelX: kx, pixelY: ky, vx: kvx, vy: kvy,
                    direction: newPlayer.facingDirection, rotation: 0
                }]);
            }
            else if (pressedKeys.current.has(' ') && boStaffCooldown <=0 && !boAttack ) {
                newPlayer.isAttacking = true;
                audioManager.playSound(SoundEffect.PLAYER_BO_STAFF_ATTACK);
                let bx = newPlayer.gridX, by = newPlayer.gridY;
                switch(newPlayer.facingDirection){
                    case Direction.UP: by--; break;
                    case Direction.DOWN: by++; break;
                    case Direction.LEFT: bx--; break;
                    case Direction.RIGHT: bx++; break;
                }
                setBoAttack({
                    active: true, gridX: bx, gridY: by,
                    direction: newPlayer.facingDirection, timer: BO_ATTACK_DURATION_FRAMES, hitEnemies: new Set()
                });
                setBoStaffCooldown(BO_STAFF_COOLDOWN_FRAMES);
                pressedKeys.current.delete(' '); 
            }
        }
        return newPlayer;
      });
      
      setBoAttack(currAttack => {
        if (!currAttack || !currAttack.active) return null;
        if (currAttack.timer > 0) {
          setRobots(prevRobots => prevRobots.map(r => {
            if (!r.isDefeated && r.health > 0 && r.gridX === currAttack.gridX && r.gridY === currAttack.gridY && !currAttack.hitEnemies.has(r.id)) {
              currAttack.hitEnemies.add(r.id);
              audioManager.playSound(SoundEffect.PROJECTILE_HIT_ROBOT, 0.8);
              const newHealth = Math.max(0, r.health - BO_ATTACK_DAMAGE);
              const isNowDefeated = newHealth <= 0;
              if (isNowDefeated) audioManager.playSound(SoundEffect.ROBOT_DEFEATED);
              return { 
                ...r, 
                health: newHealth, 
                recentlyHitByBo: true, 
                isDefeated: isNowDefeated, 
                respawnTimer: isNowDefeated ? ROBOT_RESPAWN_DELAY_FRAMES : r.respawnTimer,
                animationState: RobotAnimationState.HIT_FLASH,
                animationTimer: ROBOT_HIT_FLASH_DURATION,
              };
            }
            return r;
          }));
          return { ...currAttack, timer: currAttack.timer - 1 };
        }
        setPlayerState(p => ({...p, isAttacking: false}));
        return null;
      });

      setProjectiles(prev =>
        prev.map(p => ({ ...p, pixelX: p.pixelX + p.vx, pixelY: p.pixelY + p.vy, rotation: p.rotation + (p.type === GameObjectType.KUNAI ? 0 : 30) }))
          .filter(p => {
            const gridX = Math.floor((p.pixelX) / CELL_SIZE);
            const gridY = Math.floor((p.pixelY) / CELL_SIZE);
            if (!isWalkable(gridX, gridY, 'player', false)) {
                audioManager.playSound(SoundEffect.PROJECTILE_HIT_WALL, 0.4);
                return false;
            }

            let hitRobot = false;
            setRobots(rList => rList.map(robot => {
              if (robot.isDefeated || robot.health <= 0) return robot;
              const rCenterX = robot.pixelX + ROBOT_SIZE / 2;
              const rCenterY = robot.pixelY + ROBOT_SIZE / 2;
              const projConfig = OBJECT_CONFIGS[p.type];
              const dist = Math.sqrt(Math.pow(p.pixelX - rCenterX, 2) + Math.pow(p.pixelY - rCenterY, 2));
              
              if (dist < (projConfig.size / 2 + ROBOT_SIZE / 2)) {
                hitRobot = true;
                audioManager.playSound(SoundEffect.PROJECTILE_HIT_ROBOT);
                const damage = p.type === GameObjectType.SHURIKEN ? SHURIKEN_DAMAGE : KUNAI_DAMAGE;
                const newHealth = Math.max(0, robot.health - damage);
                const isNowDefeated = newHealth <= 0;
                if (isNowDefeated) audioManager.playSound(SoundEffect.ROBOT_DEFEATED);
                return { 
                    ...robot, 
                    health: newHealth, 
                    isDefeated: isNowDefeated, 
                    respawnTimer: isNowDefeated ? ROBOT_RESPAWN_DELAY_FRAMES : robot.respawnTimer,
                    animationState: RobotAnimationState.HIT_FLASH,
                    animationTimer: ROBOT_HIT_FLASH_DURATION,
                };
              }
              return robot;
            }));
            
            return !hitRobot && p.pixelX > -CELL_SIZE && p.pixelX < GAME_WIDTH + CELL_SIZE && p.pixelY > -CELL_SIZE && p.pixelY < GAME_HEIGHT + CELL_SIZE;
          })
      );

      setRobots(rList => rList.map(robot => {
        let newRobot = {...robot};

        if (newRobot.animationTimer > 0) newRobot.animationTimer--;
        else if (newRobot.animationState === RobotAnimationState.HIT_FLASH) newRobot.animationState = RobotAnimationState.IDLE;

        if (newRobot.isDefeated && newRobot.animationState !== RobotAnimationState.DEFEATED_AWAIT_RESPAWN) {
            newRobot.animationState = RobotAnimationState.DEFEATED_AWAIT_RESPAWN;
        }

        if (newRobot.isDefeated) {
          if (newRobot.respawnTimer > 0) {
            return { ...newRobot, respawnTimer: newRobot.respawnTimer - 1 };
          } else { 
            const spawnPos = {x: newRobot.initialGridX, y: newRobot.initialGridY};
            const isPlayerOccupying = playerState.gridX === spawnPos.x && playerState.gridY === spawnPos.y;
            const isOtherRobotOccupying = rList.some(r => r.id !== newRobot.id && !r.isDefeated && r.gridX === spawnPos.x && r.gridY === spawnPos.y);

            if (isWalkable(spawnPos.x, spawnPos.y, 'robot') && !isPlayerOccupying && !isOtherRobotOccupying) {
                const {pixelX, pixelY} = getPixelCoords(spawnPos.x, spawnPos.y, ROBOT_SIZE);
                const config = ROBOT_CONFIGURATIONS[newRobot.originalSpawnIndex % ROBOT_CONFIGURATIONS.length];
                audioManager.playSound(SoundEffect.ROBOT_RESPAWN, 0.7);
                return {
                    ...newRobot,
                    health: config.health,
                    isDefeated: false,
                    gridX: spawnPos.x, gridY: spawnPos.y,
                    pixelX, pixelY,
                    targetGridX: spawnPos.x, targetGridY: spawnPos.y,
                    moveProgress: 1,
                    facingDirection: playerState.gridX < spawnPos.x ? Direction.LEFT : Direction.RIGHT, 
                    animationState: RobotAnimationState.IDLE,
                };
            } else { 
                 return { ...newRobot, respawnTimer: 60 }; 
            }
          }
        }

        if (newRobot.recentlyHitByBo) newRobot.recentlyHitByBo = false;

        if (newRobot.moveProgress < 1) {
            newRobot.moveProgress += 1 / (ROBOT_MOVE_FRAMES / (ROBOT_CONFIGURATIONS[newRobot.originalSpawnIndex % ROBOT_CONFIGURATIONS.length].speedFactor || 1)); 
            const startPixel = getPixelCoords(newRobot.gridX, newRobot.gridY, ROBOT_SIZE);
            const targetPixel = getPixelCoords(newRobot.targetGridX, newRobot.targetGridY, ROBOT_SIZE);
            newRobot.pixelX = startPixel.pixelX + (targetPixel.pixelX - startPixel.pixelX) * newRobot.moveProgress;
            newRobot.pixelY = startPixel.pixelY + (targetPixel.pixelY - startPixel.pixelY) * newRobot.moveProgress;
            
            if (newRobot.moveProgress >= 1) {
                newRobot.moveProgress = 1;
                newRobot.gridX = newRobot.targetGridX;
                newRobot.gridY = newRobot.targetGridY;
                newRobot.isMoving = false;
            }
            return newRobot;
        }

        if (newRobot.moveProgress >= 1 && playerState.health > 0) { 
            let dx = Math.sign(playerState.gridX - newRobot.gridX);
            let dy = Math.sign(playerState.gridY - newRobot.gridY);
            let moved = false;
            let potentialMoves = [];

            if (Math.abs(playerState.gridX - newRobot.gridX) > Math.abs(playerState.gridY - newRobot.gridY)) {
                if (dx !== 0) potentialMoves.push({ x: dx, y: 0, dir: dx > 0 ? Direction.RIGHT : Direction.LEFT });
                if (dy !== 0) potentialMoves.push({ x: 0, y: dy, dir: dy > 0 ? Direction.DOWN : Direction.UP });
            } else {
                if (dy !== 0) potentialMoves.push({ x: 0, y: dy, dir: dy > 0 ? Direction.DOWN : Direction.UP });
                if (dx !== 0) potentialMoves.push({ x: dx, y: 0, dir: dx > 0 ? Direction.RIGHT : Direction.LEFT });
            }
             if (dx === 0 && dy === 0) {  }
             else if (dx === 0) {
                 potentialMoves.push({ x: 1, y: 0, dir: Direction.RIGHT });
                 potentialMoves.push({ x: -1, y: 0, dir: Direction.LEFT });
             } else if (dy === 0) {
                 potentialMoves.push({ x: 0, y: 1, dir: Direction.DOWN });
                 potentialMoves.push({ x: 0, y: -1, dir: Direction.UP });
             }


            for (const move of potentialMoves) {
                if (isWalkable(newRobot.gridX + move.x, newRobot.gridY + move.y, 'robot')) {
                    const isBlockedByOtherRobot = rList.some(r => r.id !== newRobot.id && !r.isDefeated && r.targetGridX === (newRobot.gridX + move.x) && r.targetGridY === (newRobot.gridY + move.y) && r.moveProgress < 1);
                    if (!isBlockedByOtherRobot) {
                        newRobot.targetGridX = newRobot.gridX + move.x;
                        newRobot.targetGridY = newRobot.gridY + move.y;
                        newRobot.facingDirection = move.dir;
                        moved = true;
                        break;
                    }
                }
            }
            
            if (moved) {
                newRobot.isMoving = true;
                newRobot.moveProgress = 0;
                audioManager.playSound(SoundEffect.ROBOT_MOVE_STEP, 0.1); 
            }

            if (newRobot.gridX === playerState.gridX && newRobot.gridY === playerState.gridY && playerState.hitCooldown <= 0 && playerState.health > 0) {
                setPlayerState(p => {
                    audioManager.playSound(SoundEffect.PLAYER_TAKE_DAMAGE);
                    const newHealth = Math.max(0, p.health - ROBOT_ATTACK_DAMAGE);
                    if (newHealth <=0 && !gameOverCalledRef.current) {
                        audioManager.playSound(SoundEffect.PLAYER_DEFEATED);
                        audioManager.stopMusic();
                        gameOverCalledRef.current = true; 
                        onGameOver(0);
                    }
                    return {
                        ...p,
                        health: newHealth,
                        hitCooldown: ROBOT_DAMAGE_COOLDOWN_FRAMES,
                        animationState: PlayerAnimationState.HIT_FLASH,
                        animationTimer: PLAYER_HIT_FLASH_DURATION,
                    }
                });
            }
        }
        return newRobot;
      }));
      
      animationFrameIdRef.current = requestAnimationFrame(gameTick);
    };

    if (!gameOverCalledRef.current) { 
        animationFrameIdRef.current = requestAnimationFrame(gameTick);
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalkable, mazeData.grid, boStaffCooldown, kunaiGunCooldown]); 

  const getEntityTransform = (facingDirection: Direction, type: 'player' | 'robot' | 'kunai' = 'player') => {
    if (type === 'kunai') { 
         switch (facingDirection) {
            case Direction.UP: return 'rotate(-90deg)';
            case Direction.DOWN: return 'rotate(90deg)';
            case Direction.LEFT: return 'rotate(180deg)'; 
            case Direction.RIGHT: return 'rotate(0deg)';  
            default: return 'none';
        }
    }
    switch (facingDirection) {
        case Direction.UP: return type === 'player' ? 'rotate(0deg)' : 'rotate(-90deg)'; 
        case Direction.DOWN: return type === 'player' ? 'rotate(180deg)' : 'rotate(90deg)';
        case Direction.LEFT: return 'scaleX(-1)';
        case Direction.RIGHT: return 'scaleX(1)';
        default: return 'none';
    }
  };
  
  return (
    <div
      ref={gameAreaRef}
      className="relative bg-slate-800 overflow-hidden shadow-2xl rounded-lg flex flex-col items-center justify-center"
      style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      role="application"
      aria-label="Maze Escape Game. Arrows: Move, F: Shuriken, G: Kunai, Space: Bo Staff."
      tabIndex={-1} 
      onClick={async (e) => { 
            if (!audioInitializedRef.current) {
                await tryInitializeAudioAndMusic();
            }
            e.currentTarget.focus(); 
        }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-slate-900 bg-opacity-80 shadow-md flex justify-between items-center">
        <div className="flex-grow">
            <ScoreDisplay
                score={playerState.shurikens * 2 + playerState.kunais + playerState.health} 
                lives={playerState.health > 0 ? Math.max(1, Math.ceil(playerState.health / (PLAYER_INITIAL_HEALTH / 3))) : 0} 
            />
            <div className="text-center text-xs text-slate-300 mt-1 px-2 flex justify-around flex-wrap gap-x-2">
                <span>Health: <span className={playerState.animationState === PlayerAnimationState.HIT_FLASH ? "text-red-400 font-bold animate-pulse" : "text-green-400"}>{playerState.health}%</span></span>
                <span>Shurikens: <span className={SHURIKEN_MAZE_COLOR}>{playerState.shurikens}</span></span>
                <span>Kunais: <span className={KUNAI_MAZE_COLOR}>{playerState.kunais}</span></span>
                {boStaffCooldown > 0 && <span className="text-yellow-600">(Bo CD)</span>}
                {kunaiGunCooldown > 0 && <span className="text-orange-600">(Kunai CD)</span>}
            </div>
        </div>
        <button
            onClick={handleToggleMute}
            className="p-2 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
            {isMuted ? <SoundOffIcon className="text-red-500" /> : <SoundOnIcon className="text-green-500" />}
        </button>
      </div>

      <div
        className="relative grid bg-slate-700"
        style={{
            gridTemplateColumns: `repeat(${MAZE_COLS}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${MAZE_ROWS}, ${CELL_SIZE}px)`,
            width: MAZE_COLS * CELL_SIZE,
            height: MAZE_ROWS * CELL_SIZE,
            marginTop: '60px' 
        }}
      >
        {mazeData.grid.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            let cellStyles = `border ${MAZE_PATH_BORDER_COLOR}`;
            let cellContent = null;
            if (cell === MazeCellType.WALL) cellStyles += ` bg-gradient-to-br ${MAZE_WALL_COLOR_TOP} ${MAZE_WALL_COLOR_BOTTOM} ${MAZE_WALL_BORDER_COLOR}`;
            else if (cell === MazeCellType.PATH) cellStyles += ` ${MAZE_PATH_COLOR}`;
            else if (cell === MazeCellType.START) cellStyles += ` ${MAZE_START_COLOR}`;
            else if (cell === MazeCellType.EXIT) {
              cellStyles += ` ${MAZE_EXIT_COLOR} flex items-center justify-center`;
              cellContent = <ExitDoorIcon size={CELL_SIZE * 0.7} className={EXIT_DOOR_SYMBOL_COLOR} />;
            }
            return (
              <div key={`cell-${rIdx}-${cIdx}`} className={cellStyles} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                {cellContent}
              </div>
            );
          })
        )}

        {playerState.health > 0 && playerState.animationState !== PlayerAnimationState.DEFEATED && (
            <div
                className="absolute"
                style={{
                    left: playerState.pixelX,
                    top: playerState.pixelY,
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE,
                    zIndex: 10,
                    transition: 'opacity 0.3s ease-out',
                    opacity: 1,
                }}
            >
                <PlayerNinjaIcon size={PLAYER_SIZE} 
                  isHit={playerState.animationState === PlayerAnimationState.HIT_FLASH} 
                  style={{transform: getEntityTransform(playerState.facingDirection, 'player')}}
                />
            </div>
        )}

        {robots.map(robot => (
          <div
            key={robot.id}
            className="absolute transition-opacity duration-150"
            style={{
              left: robot.pixelX,
              top: robot.pixelY,
              width: ROBOT_SIZE,
              height: ROBOT_SIZE,
              zIndex: 9,
              opacity: robot.isDefeated && robot.animationState === RobotAnimationState.DEFEATED_AWAIT_RESPAWN && robot.respawnTimer > 0 ? (robot.respawnTimer % 30 < 15 ? 0.3 : 0.0) : 1,
            }}
          >
            <RobotEnemyIcon 
                size={ROBOT_SIZE} 
                isHit={robot.animationState === RobotAnimationState.HIT_FLASH}
                isDefeated={robot.isDefeated || robot.animationState === RobotAnimationState.DEFEATED_AWAIT_RESPAWN}
                style={{transform: getEntityTransform(robot.facingDirection, 'robot')}} 
            />
          </div>
        ))}

        {projectiles.map(p => {
            const config = OBJECT_CONFIGS[p.type];
            const Icon = p.type === GameObjectType.SHURIKEN ? ShurikenIcon : KunaiIcon;
            const transform = p.type === GameObjectType.KUNAI ? getEntityTransform(p.direction, 'kunai') : `rotate(${p.rotation}deg)`;
          return (
            <div
                key={p.id}
                className="absolute"
                style={{
                left: p.pixelX - config.size / 2,
                top: p.pixelY - config.size / 2,
                width: config.size,
                height: config.size,
                zIndex: 11,
                }}
            >
                <Icon size={config.size} className={config.color} style={{transform: transform}}/>
            </div>
        )})}
        
        {boAttack && boAttack.active && (
            <div className="absolute flex items-center justify-center"
                 style={{
                    left: boAttack.gridX * CELL_SIZE + (CELL_SIZE - CELL_SIZE *0.9)/2,
                    top: boAttack.gridY * CELL_SIZE + (CELL_SIZE - CELL_SIZE*0.9)/2,
                    width: CELL_SIZE * 0.9,
                    height: CELL_SIZE * 0.9,
                    zIndex: 12,
                    opacity: Math.max(0.3, boAttack.timer / BO_ATTACK_DURATION_FRAMES),
                 }}
                 >
                <BoStaffIcon size={CELL_SIZE * 0.85} direction={boAttack.direction} style={{ transform: `rotate(${Math.random()*20-10}deg)`}} />
            </div>
        )}
      </div>
      <div className="mt-1 text-xs text-slate-400 text-center px-2 absolute bottom-1 left-0 right-0">
        Arrows: Move | F: Shuriken | G: Kunai ({kunaiGunCooldown > 0 ? `CD` : 'RDY'}) | Space: Bo ({boStaffCooldown > 0 ? `CD` : 'RDY'})
        {playerState.health <=0 && playerState.animationState === PlayerAnimationState.DEFEATED && <p className="text-red-500 font-bold text-lg mt-1">YOU ARE DEFEATED!</p>}
      </div>
    </div>
  );
};