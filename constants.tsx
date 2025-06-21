import React from 'react';
import { GameObjectType, GameObjectConfig, Direction, SoundEffect, ScoreOrbType, VideoInfo } from './types';

// Helper function to handle asset paths for GitHub Pages
export const getAssetPath = (path: string): string => {
  // In production (GitHub Pages), assets are served from the base path
  const basePath = import.meta.env?.MODE === 'production' ? '/ninjago' : '';
  return `${basePath}${path}`;
};

export const GAME_WIDTH = 1200;
export const GAME_HEIGHT = 800;
export const INITIAL_LIVES = 3;
export const OBJECT_SPAWN_INTERVAL_MS = 1000; // milliseconds
export const OBJECT_MIN_SPEED = 1;
export const OBJECT_MAX_SPEED = 3;
export const OBJECT_MIN_ROTATION_SPEED = -5;
export const OBJECT_MAX_ROTATION_SPEED = 5;

// Target Practice Mode Constants
export const TARGET_PRACTICE_DURATION_S = 60; // seconds
export const TARGET_MIN_SIZE = 25;
export const TARGET_MAX_SIZE = 60;
export const TARGET_SPAWN_INTERVAL_MS = 1200;
export const TARGET_LIFESPAN_MS = 3500; // How long a target stays if not hit
export const SHURIKEN_LAUNCH_SPEED = 12; // Speed of launched shurikens in target mode
export const MAX_PROJECTILES_TARGET_MODE = 10;

export const TARGET_DEFINITIONS = [
  { size: TARGET_MIN_SIZE, points: 15, color: "fill-red-400" },
  { size: Math.floor((TARGET_MIN_SIZE + TARGET_MAX_SIZE) / 2.2), points: 10, color: "fill-yellow-400" },
  { size: TARGET_MAX_SIZE, points: 5, color: "fill-blue-400" },
];

// Maze Theme Colors
export const MAZE_WALL_COLOR_TOP = "from-slate-700"; // For gradient
export const MAZE_WALL_COLOR_BOTTOM = "to-slate-600";
export const MAZE_WALL_BORDER_COLOR = "border-slate-800";
export const MAZE_PATH_COLOR = "bg-slate-500";
export const MAZE_PATH_BORDER_COLOR = "border-slate-600";
export const MAZE_START_COLOR = "bg-green-700";
export const MAZE_EXIT_COLOR = "bg-sky-700";
export const PLAYER_COLOR = "text-lime-400"; // Player's main color
export const PLAYER_HIT_COLOR = "text-red-500"; // Color when player is hit
export const ROBOT_COLOR = "text-rose-500"; // Robot's main color
export const ROBOT_EYE_COLOR = "text-yellow-400"; // Accent for Robot
export const ROBOT_HIT_COLOR = "text-orange-400"; // Color when robot is hit
export const ROBOT_DEFEATED_COLOR = "text-slate-400";
export const SHURIKEN_MAZE_COLOR = "text-sky-300";
export const KUNAI_MAZE_COLOR = "text-orange-300";
export const BO_STAFF_ATTACK_COLOR = "text-yellow-300";
export const EXIT_DOOR_SYMBOL_COLOR = "text-sky-300";

export const OBJECT_CONFIGS: Record<GameObjectType, GameObjectConfig> = {
  [GameObjectType.SHURIKEN]: {
    type: GameObjectType.SHURIKEN,
    points: 10,
    isBomb: false,
    color: SHURIKEN_MAZE_COLOR, // Used for maze projectiles
    size: 28, // Slightly smaller for maze
  },
  [GameObjectType.SCROLL]: {
    type: GameObjectType.SCROLL,
    points: 5,
    isBomb: false,
    color: "text-emerald-400", // Classic mode color
    size: 35,
  },
  [GameObjectType.BOMB]: {
    type: GameObjectType.BOMB,
    points: 0,
    isBomb: true,
    color: "text-red-500", // Classic mode color
    size: 45,
  },
  [GameObjectType.KUNAI]: { 
    type: GameObjectType.KUNAI,
    points: 0, 
    isBomb: false,
    color: KUNAI_MAZE_COLOR, // Used for maze projectiles
    size: 24, 
  },
};

// Maze Escape Mode Constants
export const MAZE_COLS = 21; 
export const MAZE_ROWS = 15; 
const availableHeightForMaze = GAME_HEIGHT - 80; // Adjusted for UI bar at top
export const CELL_SIZE = Math.min(Math.floor(GAME_WIDTH / MAZE_COLS), Math.floor(availableHeightForMaze / MAZE_ROWS));


export const PLAYER_INITIAL_HEALTH = 100;
export const PLAYER_INITIAL_SHURIKENS = 5;
export const PLAYER_INITIAL_KUNAIS = 15; 
export const PLAYER_SIZE = CELL_SIZE * 0.7;
export const PLAYER_MOVE_FRAMES = 6; 
export const PLAYER_HIT_FLASH_DURATION = 15; // frames for hit flash

export const ROBOT_INITIAL_HEALTH = 50;
export const ROBOT_SIZE = CELL_SIZE * 0.8;
export const ROBOT_MOVE_FRAMES = 10; 
export const ROBOT_ATTACK_DAMAGE = 10;
export const ROBOT_DAMAGE_COOLDOWN_FRAMES = 30; // Player invulnerability after robot hit
export const ROBOT_RESPAWN_DELAY_FRAMES = 300; // 5 seconds at 60fps
export const ROBOT_MIN_DISTANCE_FROM_PLAYER_START = 5; // grid units
export const ROBOT_HIT_FLASH_DURATION = 10; // frames for hit flash

export const SHURIKEN_PROJECTILE_SPEED_MAZE = CELL_SIZE / 2.0;
export const MAX_PROJECTILES_MAZE = 5; 
export const SHURIKEN_DAMAGE = 30;

export const KUNAI_PROJECTILE_SPEED_MAZE = CELL_SIZE / 1.6; 
export const MAX_KUNAIS_MAZE = 8; 
export const KUNAI_DAMAGE = 15; 
export const KUNAI_GUN_COOLDOWN_FRAMES = 20; 

export const BO_ATTACK_DURATION_FRAMES = 12; // Slightly shorter
export const BO_ATTACK_RANGE_CELLS = 1;
export const BO_ATTACK_DAMAGE = 35; // Slightly stronger
export const BO_STAFF_COOLDOWN_FRAMES = 40;

export const ROBOT_CONFIGURATIONS = [
    { health: ROBOT_INITIAL_HEALTH, speedFactor: 1.0 },
    { health: ROBOT_INITIAL_HEALTH, speedFactor: 1.0 },
    { health: ROBOT_INITIAL_HEALTH * 1.2, speedFactor: 0.9 }, 
    { health: ROBOT_INITIAL_HEALTH * 0.8, speedFactor: 1.1 }, 
];

// Customizable Scores Mode Constants
export const CUSTOM_SCORES_DURATION_S = 60;
export const SCORE_ORB_SPAWN_INTERVAL_MS = 600; // Spawn orbs more frequently
export const SCORE_ORB_LIFESPAN_MS = 5000; // How long an orb stays if not clicked
export const MAX_SCORE_ORBS_ON_SCREEN = 15;

export const SCORE_ORB_DEFINITIONS: Record<ScoreOrbType, { basePoints: number; color: string; minSize: number; maxSize: number; appearanceWeight: number; floatingSpeed?: number, floatingAmplitude?: number, floatingFrequency?: number }> = {
  [ScoreOrbType.REGULAR]: { basePoints: 10, color: "bg-sky-500", minSize: 30, maxSize: 50, appearanceWeight: 60, floatingSpeed: 0.3, floatingAmplitude: 3, floatingFrequency: 0.05 },
  [ScoreOrbType.BONUS]: { basePoints: 50, color: "bg-emerald-500", minSize: 40, maxSize: 60, appearanceWeight: 30, floatingSpeed: 0.2, floatingAmplitude: 5, floatingFrequency: 0.03 },
  [ScoreOrbType.JACKPOT]: { basePoints: 100, color: "bg-yellow-400", minSize: 50, maxSize: 70, appearanceWeight: 10, floatingSpeed: 0.1, floatingAmplitude: 8, floatingFrequency: 0.02 },
};

// Video Player Mode Constants
// Video catalog populated with actual video files from public/videos/ directory
export const VIDEO_CATALOG: VideoInfo[] = [
  // === CONTENIDO OFICIAL NINJAGO ===
  { 
    id: "ninjago1", 
    title: "LEGO NINJAGO: Cacería - Temporada 9", 
    fileName: "Episodio 93 - LEGO NINJAGO_ Cacería - Temporada 9.mp4", 
    path: getAssetPath("/videos/Episodio 93 - LEGO NINJAGO_ Cacería - Temporada 9.mp4"),
    description: "Episodio 93 de la temporada 9 de LEGO NINJAGO"
  },
  { 
    id: "ninjago2", 
    title: "LEGO NINJAGO LA PELÍCULA - Trailer 2", 
    fileName: "LEGO® NINJAGO® LA PELÍCULA - Trailer 2 - Oficial Warner Bros. Pictures.mp4",
    path: getAssetPath("/videos/LEGO® NINJAGO® LA PELÍCULA - Trailer 2 - Oficial Warner Bros. Pictures.mp4"),
    description: "Trailer oficial 2 de la película de LEGO NINJAGO"
  },
  { 
    id: "ninjago3", 
    title: "Lego Ninjago La película", 
    fileName: "Lego Ninjago La película  1.mp4",
    path: getAssetPath("/videos/Lego Ninjago La película  1.mp4"),
    description: "Película completa de LEGO NINJAGO"
  },
  { 
    id: "ninjago4", 
    title: "Los de LEGO MOVIE como Polícias", 
    fileName: "Los de LEGO MOVIE como Polícias.mp4",
    path: getAssetPath("/videos/Los de LEGO MOVIE como Polícias.mp4"),
    description: "Episodio especial de LEGO MOVIE"
  },
  { 
    id: "ninjago5", 
    title: "NINJAGO: El Ascenso de los Dragones - Los perdidos", 
    fileName: "Los perdidos 👀 ｜ T3, E1 ｜ Episodio completo ｜ LEGO NINJAGO： El Ascenso de los Dragones.mp4",
    path: getAssetPath("/videos/Los perdidos 👀 ｜ T3, E1 ｜ Episodio completo ｜ LEGO NINJAGO： El Ascenso de los Dragones.mp4"),
    description: "Temporada 3, Episodio 1 - El Ascenso de los Dragones"
  },
  { 
    id: "main", 
    title: "Video Principal", 
    fileName: "videoplayback.mp4",
    path: getAssetPath("/videos/videoplayback.mp4"),
    description: "Video principal del juego"
  },
  
  // === VIDEOS GENERADOS ===
  { 
    id: "gen1", 
    title: "Video Generado 1:45PM", 
    fileName: "Generated File June 20, 2025 - 1_45PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_45PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen2", 
    title: "Video Generado 1:46PM", 
    fileName: "Generated File June 20, 2025 - 1_46PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_46PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen3", 
    title: "Video Generado 1:48PM", 
    fileName: "Generated File June 20, 2025 - 1_48PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_48PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen4", 
    title: "Video Generado 1:50PM", 
    fileName: "Generated File June 20, 2025 - 1_50PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_50PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen5", 
    title: "Video Generado 1:51PM", 
    fileName: "Generated File June 20, 2025 - 1_51PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_51PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen6", 
    title: "Video Generado 1:53PM", 
    fileName: "Generated File June 20, 2025 - 1_53PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 1_53PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen7", 
    title: "Video Generado 4:30PM", 
    fileName: "Generated File June 20, 2025 - 4_30PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 4_30PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen8", 
    title: "Video Generado 4:31PM", 
    fileName: "Generated File June 20, 2025 - 4_31PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 4_31PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen9", 
    title: "Video Generado 4:32PM", 
    fileName: "Generated File June 20, 2025 - 4_32PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 4_32PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen10", 
    title: "Video Generado 4:34PM", 
    fileName: "Generated File June 20, 2025 - 4_34PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 4_34PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen11", 
    title: "Video Generado 4:35PM", 
    fileName: "Generated File June 20, 2025 - 4_35PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 4_35PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen12", 
    title: "Video Generado 5:15PM", 
    fileName: "Generated File June 20, 2025 - 5_15PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_15PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen13", 
    title: "Video Generado 5:18PM", 
    fileName: "Generated File June 20, 2025 - 5_18PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_18PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen14", 
    title: "Video Generado 5:19PM", 
    fileName: "Generated File June 20, 2025 - 5_19PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_19PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen15", 
    title: "Video Generado 5:22PM", 
    fileName: "Generated File June 20, 2025 - 5_22PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_22PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen16", 
    title: "Video Generado 5:23PM", 
    fileName: "Generated File June 20, 2025 - 5_23PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_23PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen17", 
    title: "Video Generado 5:28PM", 
    fileName: "Generated File June 20, 2025 - 5_28PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_28PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen18", 
    title: "Video Generado 5:29PM", 
    fileName: "Generated File June 20, 2025 - 5_29PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_29PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen19", 
    title: "Video Generado 5:31PM", 
    fileName: "Generated File June 20, 2025 - 5_31PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_31PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  },
  { 
    id: "gen20", 
    title: "Video Generado 5:32PM", 
    fileName: "Generated File June 20, 2025 - 5_32PM.mp4",
    path: getAssetPath("/videos/Generated File June 20, 2025 - 5_32PM.mp4"),
    description: "Contenido generado - 20 de Junio 2025"
  }
];


// Sound File Paths (usando solo archivos que existen)
export const SOUND_FILES: Record<SoundEffect, string> = {
  [SoundEffect.PLAYER_SHURIKEN_THROW]: getAssetPath('/sounds/lasergun-152375.mp3'),
  [SoundEffect.PLAYER_KUNAI_THROW]: getAssetPath('/sounds/lasergun-152375.mp3'),
  [SoundEffect.PLAYER_BO_STAFF_ATTACK]: getAssetPath('/sounds/realistic-shotgun-cocking-sound-38640.mp3'),
  [SoundEffect.PROJECTILE_HIT_WALL]: getAssetPath('/sounds/gunshot-352466.mp3'),
  [SoundEffect.PROJECTILE_HIT_ROBOT]: getAssetPath('/sounds/gunfire-single-shot-colt-peacemaker-94951.mp3'),
  [SoundEffect.ROBOT_MOVE_STEP]: getAssetPath('/sounds/ui_click.mp3'),
  [SoundEffect.ROBOT_DEFEATED]: getAssetPath('/sounds/heathers-gunshot-effect2-100653.mp3'),
  [SoundEffect.ROBOT_RESPAWN]: getAssetPath('/sounds/ui_click.mp3'),
  [SoundEffect.PLAYER_TAKE_DAMAGE]: getAssetPath('/sounds/gun-shots-230534.mp3'),
  [SoundEffect.PLAYER_MOVE_STEP]: getAssetPath('/sounds/ui_click.mp3'),
  [SoundEffect.PLAYER_DEFEATED]: getAssetPath('/sounds/glock19-18535.mp3'),
  [SoundEffect.MAZE_EXIT_SUCCESS]: getAssetPath('/sounds/ui_click.mp3'),
  [SoundEffect.UI_CLICK_GENERAL]: getAssetPath('/sounds/ui_click.mp3'),
  [SoundEffect.BACKGROUND_MAZE_MUSIC]: getAssetPath('/sounds/NINJAGO La Senda del Ninja Papiweb.mp3'),
  [SoundEffect.BACKGROUND_NINJAGO_THEME]: getAssetPath('/sounds/NINJAGO La Senda del Ninja Papiweb.mp3'),
  [SoundEffect.BACKGROUND_WEEKEND_WHIP]: getAssetPath('/sounds/THE WEEKEND WHIP Intro en Español NINJAGO Papiweb.mp3'), 
  [SoundEffect.SCORE_ORB_COLLECT]: getAssetPath('/sounds/ui_click.mp3'), // Cambiado a un archivo que existe
};

// SVG Icons
export const ShurikenIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = OBJECT_CONFIGS[GameObjectType.SHURIKEN].size, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M12 2l2.121 5.879L20 12l-5.879 2.121L12 20l-2.121-5.879L4 12l5.879-2.121L12 2zm0 3.828L10.586 9H7.172l2.414 2.414L8.172 14.828 12 13l3.828 1.828L14.414 11.414 16.828 9h-3.414L12 5.828zM12 10a2 2 0 100 4 2 2 0 000-4z"/>
  </svg>
);

export const KunaiIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = OBJECT_CONFIGS[GameObjectType.KUNAI].size, className, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <path d="M17.657 3.222a2 2 0 00-2.828 0L3.364 14.687a1 1 0 000 1.414l4.242 4.242a1 1 0 001.414 0l11.465-11.464a2 2 0 000-2.828L17.657 3.222zM8.464 18.243L5.414 15.192l8.486-8.485 3.05 3.05-8.486 8.486zM18 8a1 1 0 11-2 0 1 1 0 012 0z"/>
  </svg>
);


export const ScrollIcon: React.FC<{ size?: number; className?: string }> = ({ size = OBJECT_CONFIGS[GameObjectType.SCROLL].size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h2v-2H7V4h2V2H7zm10 0v2h-2V2h2zm-2 4h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm-6-8H5v2h4V8zm0 4H5v2h4v-2zM5 18h4v2H5v-2zM19 2a2 2 0 00-2 2v16a2 2 0 002 2h2v-2h-2V4h2V2h-2z"/>
    <path d="M9 2h6v2H9V2zm0 18h6v2H9v-2z"/>
  </svg>
);

export const BombIcon: React.FC<{ size?: number; className?: string }> = ({ size = OBJECT_CONFIGS[GameObjectType.BOMB].size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    <path d="M14.21 5.33C14.07 5.13 13.82 5 13.56 5h-3.12c-.26 0-.51.13-.65.33L8.25 8H7v2h1.71l-.56 2H7v2h1.22l-.57 2H7v2h2.5l1.5-3h2l1.5 3H17v-2h-1.15l-.57-2H17v-2h-1.22l-.56-2H17V8h-1.25l-1.54-2.67zM11 15H9.72l.45-1.42.12-.4.12.4.45 1.42H11zm3.28-5H13l-.45 1.42-.12.4-.12-.4L11.87 10h-1.15L10.28 15h1.15l.45-1.42.12-.4.12.4.45 1.42h1.15l.45-1.42.12-.4.12.4.45 1.42H15l-1.72-5z"/>
    <path d="M17.5 2.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM19 4h-1l-.5 1.5L17 4h-1l1 2-1 2h1l.5-1.5.5 1.5h1l-1-2 1-2z"/>
  </svg>
);

export const TargetIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 40, className, color = "fill-red-500" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="48" className={`${color} opacity-70`} stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
    <circle cx="50" cy="50" r="35" fill="white" className="opacity-80"/>
    <circle cx="50" cy="50" r="22" className={`${color} opacity-90`} />
    <circle cx="50" cy="50" r="10" fill="white" />
  </svg>
);

export const PlayerNinjaIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties; isHit?: boolean }> = ({ size = PLAYER_SIZE, className, style, isHit}) => (
  <div 
    className={`${className} ${isHit ? 'brightness-125 contrast-125' : ''} transition-all duration-100 rounded-full overflow-hidden border-2 border-lime-400 shadow-lg`} 
    style={{
      width: size,
      height: size,
      backgroundImage: `url(${getAssetPath('/pictures/misc/Lloyd_Garmadon.png')})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      ...style
    }}
  />
);

export const RobotEnemyIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties; isHit?: boolean; isDefeated?: boolean }> = ({ size = ROBOT_SIZE, className, style, isHit, isDefeated }) => {
  const filterEffect = isDefeated ? 'grayscale(100%) brightness(0.5)' : (isHit ? 'brightness(150%) contrast(120%) hue-rotate(90deg)' : 'none');
  
  return (
    <div 
      className={`${className} transition-all duration-100 rounded-full overflow-hidden border-2 ${
        isDefeated ? 'border-gray-500' : (isHit ? 'border-red-500' : 'border-red-600')
      } shadow-lg`} 
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${getAssetPath('/pictures/villains/FangtomS1.webp')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: filterEffect,
        ...style
      }}
    />
  );
};

export const ExitDoorIcon: React.FC<{ size?: number; className?: string }> = ({ size = CELL_SIZE * 0.8, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" 
       className={`${className} ${EXIT_DOOR_SYMBOL_COLOR}`}>
    <path d="M12 3L4 9v12h16V9l-8-6zm0 2.236L17.764 9H6.236L12 5.236zM6 11h12v8H6v-8z" fill={MAZE_EXIT_COLOR.replace('bg-', 'fill-')} /> 
    <path d="M13 12h-2v3H9.5l2.5 3 2.5-3H13v-3z" fill="currentColor" /> 
    <rect x="10" y="12" width="4" height="6" fill="none" stroke="currentColor" strokeWidth="0.5"/> 
  </svg>
);


export const BoStaffIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties; direction: Direction }> = ({size = CELL_SIZE * 0.9, className, style, direction}) => {
  let pathData = "M4 12 L20 12"; 
  if (direction === Direction.UP || direction === Direction.DOWN) {
    pathData = "M12 4 L12 20"; 
  }
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3"  
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={`${className} ${BO_STAFF_ATTACK_COLOR}`} 
      style={style}
    >
      <path d={pathData}></path>
      {(direction === Direction.RIGHT || direction === Direction.LEFT) && 
        <path d="M6 10 Q12 8 18 10" strokeWidth="1.5" strokeOpacity="0.6" />
      }
      {(direction === Direction.UP || direction === Direction.DOWN) && 
        <path d="M10 6 Q8 12 10 18" strokeWidth="1.5" strokeOpacity="0.6" />
      }
    </svg>
  );
};


export const OBJECT_ICONS: Record<GameObjectType, React.FC<{size?: number; className?: string}>> = {
  [GameObjectType.SHURIKEN]: ShurikenIcon,
  [GameObjectType.SCROLL]: ScrollIcon,
  [GameObjectType.BOMB]: BombIcon,
  [GameObjectType.KUNAI]: KunaiIcon,
};

export const SoundOnIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
);

export const SoundOffIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L7 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3z"/>
    </svg>
);

export const StarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z"/>
  </svg>
);

export const FilmIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM6 5h2v2H6V5zm0 4h2v2H6V9zm0 4h2v2H6v-2zm0 4h2v2H6v-2zm12 2h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V5h2v2zM10 5h4v14h-4V5z"/>
    <path fill="none" d="M0 0h24v24H0z"/>
  </svg>
);

export const PlayIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
);

export const PauseIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M9 16h2V8H9v8zm4-8v8h2V8h-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
);

export const VolumeUpIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
);

export const VolumeOffIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM10 8.83L7.83 11H5v2h2.83L10 15.17V8.83z"/></svg>
);

export const FullscreenEnterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
);

export const FullscreenExitIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
);
export const VideoReplayIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0z" fill="none"/><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
);
export const BackToListIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 0 24 24" width={size} fill="currentColor" className={className}><path d="M0 0h24v24H0V0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
);