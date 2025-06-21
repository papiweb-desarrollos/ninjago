export enum GameObjectType {
  SHURIKEN = 'SHURIKEN',
  SCROLL = 'SCROLL',
  BOMB = 'BOMB',
  KUNAI = 'KUNAI', 
}

export interface GameObjectConfig {
  type: GameObjectType;
  points: number;
  isBomb: boolean;
  color: string;
  size: number;
}

export interface FlyingObjectState {
  id: string;
  type: GameObjectType;
  x: number;
  y: number;
  vx: number; // velocity x
  vy: number; // velocity y
  rotation: number;
  rotationSpeed: number;
  config: GameObjectConfig;
  isProjectile?: boolean; 
}

export enum GameStatus {
  StartMenu,
  Playing,
  GameOver,
  TargetPractice,
  MazeEscape, 
  CustomScores,
  VideoPlayer, // New game mode
}

export interface TargetState {
  id: string;
  x: number;
  y: number;
  size: number;
  points: number;
  createdAt: number; 
  hit: boolean;
  villainImage?: string; // Optional para mantener compatibilidad
}

// Types for Maze Escape Mode
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE',
}

export enum MazeCellType {
  PATH = 0,
  WALL = 1,
  START = 2,
  EXIT = 3,
  // ENEMY type is less used for grid, positions are tracked in RobotState
}

export enum PlayerAnimationState {
  IDLE = 'IDLE',
  HIT_FLASH = 'HIT_FLASH',
  DEFEATED = 'DEFEATED', // For a potential player defeat visual
}

export interface PlayerState {
  id: string;
  gridX: number; 
  gridY: number;
  pixelX: number; 
  pixelY: number;
  targetGridX: number; 
  targetGridY: number;
  moveProgress: number; 
  health: number;
  facingDirection: Direction;
  shurikens: number; 
  kunais: number; 
  isMoving: boolean;
  isAttacking: boolean; 
  hitCooldown: number; 
  animationState: PlayerAnimationState;
  animationTimer: number; // For timed animations like hit flash
}

export enum RobotAnimationState {
  IDLE = 'IDLE',
  HIT_FLASH = 'HIT_FLASH',
  DEFEATED_AWAIT_RESPAWN = 'DEFEATED_AWAIT_RESPAWN'
}
export interface RobotEnemyState {
  id: string;
  gridX: number;
  gridY: number;
  initialGridX: number; // For respawning at its specific generated start point
  initialGridY: number; // For respawning at its specific generated start point
  pixelX: number;
  pixelY: number;
  targetGridX: number;
  targetGridY: number;
  moveProgress: number;
  health: number;
  facingDirection: Direction;
  isMoving: boolean;
  recentlyHitByBo: boolean; 
  isDefeated: boolean; 
  respawnTimer: number; 
  originalSpawnIndex: number; // Index from the initial pool of robot configs
  animationState: RobotAnimationState;
  animationTimer: number;
}

export interface MazeData {
  grid: MazeCellType[][];
  startPosition: { x: number; y: number };
  exitPosition: { x: number; y: number };
  enemyStartPositions: { x: number; y: number }[]; // Will be populated by maze generator
}

export interface BaseProjectile {
  id: string;
  pixelX: number;
  pixelY: number;
  vx: number;
  vy: number;
  direction: Direction;
  rotation: number;
}

export interface ShurikenProjectile extends BaseProjectile {
  type: GameObjectType.SHURIKEN;
}

export interface KunaiProjectile extends BaseProjectile {
  type: GameObjectType.KUNAI;
}

export type MazeProjectile = ShurikenProjectile | KunaiProjectile;


export interface BoAttack {
  active: boolean;
  gridX: number; 
  gridY: number; 
  direction: Direction;
  timer: number; 
  hitEnemies: Set<string>; 
}

// Types for Customizable Scores Mode
export enum ScoreOrbType {
  REGULAR = 'REGULAR',
  BONUS = 'BONUS',
  JACKPOT = 'JACKPOT',
}

export interface ScoreOrbState {
  id: string;
  x: number;
  y: number;
  size: number;
  points: number;
  color: string;
  type: ScoreOrbType;
  createdAt: number;
  isClicked: boolean;
  vy: number; // For floating effect
  initialY: number; // For floating effect
  amplitude: number; // For floating effect
  frequency: number; // For floating effect
}

// Types for Video Player Mode
export interface VideoInfo {
  id: string;
  title: string;
  fileName: string; // e.g., "my_video.mp4"
  path: string; // e.g., "/videos/my_video.mp4"
  description?: string;
  thumbnail?: string; // Optional path to a thumbnail image
}


// Sound Types
export enum SoundEffect {
  PLAYER_SHURIKEN_THROW = 'PLAYER_SHURIKEN_THROW',
  PLAYER_KUNAI_THROW = 'PLAYER_KUNAI_THROW',
  PLAYER_BO_STAFF_ATTACK = 'PLAYER_BO_STAFF_ATTACK',
  PROJECTILE_HIT_WALL = 'PROJECTILE_HIT_WALL',
  PROJECTILE_HIT_ROBOT = 'PROJECTILE_HIT_ROBOT',
  ROBOT_MOVE_STEP = 'ROBOT_MOVE_STEP',
  ROBOT_DEFEATED = 'ROBOT_DEFEATED',
  ROBOT_RESPAWN = 'ROBOT_RESPAWN',
  PLAYER_TAKE_DAMAGE = 'PLAYER_TAKE_DAMAGE',
  PLAYER_MOVE_STEP = 'PLAYER_MOVE_STEP',
  PLAYER_DEFEATED = 'PLAYER_DEFEATED', 
  MAZE_EXIT_SUCCESS = 'MAZE_EXIT_SUCCESS',
  UI_CLICK_GENERAL = 'UI_CLICK_GENERAL',
  BACKGROUND_MAZE_MUSIC = 'BACKGROUND_MAZE_MUSIC', 
  BACKGROUND_NINJAGO_THEME = 'BACKGROUND_NINJAGO_THEME',
  BACKGROUND_WEEKEND_WHIP = 'BACKGROUND_WEEKEND_WHIP', // New music
  SCORE_ORB_COLLECT = 'SCORE_ORB_COLLECT', // Sound for collecting orbs
}