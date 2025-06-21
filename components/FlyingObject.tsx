import React from 'react';
import { FlyingObjectState, GameObjectType } from '../types';
import { OBJECT_ICONS } from '../constants';
import { EnhancedGameObject } from './ui/EnhancedGameObject';

interface FlyingObjectProps {
  objectState: FlyingObjectState;
  onClick?: (id: string, type: GameObjectType) => void; // Made onClick optional
}

export const FlyingObject: React.FC<FlyingObjectProps> = ({ objectState, onClick }) => {
  const { id, type, x, y, rotation, config } = objectState;
  const IconComponent = OBJECT_ICONS[type];

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation(); // Prevent game screen click if object is hit
      onClick(id, type);
    }
  };

  const getObjectType = (): 'fruit' | 'bomb' | 'bonus' | 'enemy' => {
    if (type === GameObjectType.BOMB) return 'bomb';
    if (type === GameObjectType.KUNAI) return 'bonus';
    if (type === GameObjectType.SCROLL) return 'enemy';
    return 'fruit';
  };

  const interactiveProps = onClick 
    ? { 
        onClick: handleClick, 
        role: "button", 
        tabIndex: 0, // Make it focusable
        onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as any);}, // Allow keyboard interaction
        "aria-label": `Slice ${type.toLowerCase()}` 
      } 
    : { 
        "aria-hidden": true // Non-interactive projectiles are decorative
      };

  return (
    <EnhancedGameObject
      x={x}
      y={y}
      rotation={rotation}
      objectType={getObjectType()}
      className={`${onClick ? 'cursor-pointer' : 'cursor-default'} transition-transform duration-50 ease-linear`}
    >
      <div
        style={{
          width: `${config.size}px`,
          height: `${config.size}px`,
        }}
        {...interactiveProps}
      >
        <IconComponent size={config.size} className={`${config.color} w-full h-full`} />
      </div>
    </EnhancedGameObject>
  );
};