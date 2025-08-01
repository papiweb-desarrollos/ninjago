import React from 'react';
import { DragonShipState } from '../types';
import { getAssetPath } from '../constants';

interface DragonShipProps {
  dragonShip: DragonShipState;
}

export const DragonShip: React.FC<DragonShipProps> = ({ dragonShip }) => {
  return (
    <div
      className="absolute pointer-events-none transform transition-transform duration-100"
      style={{
        left: `${dragonShip.x - dragonShip.width / 2}px`,
        top: `${dragonShip.y - dragonShip.height / 2}px`,
        width: `${dragonShip.width}px`,
        height: `${dragonShip.height}px`,
        transform: `rotate(${dragonShip.rotation}deg)`,
        zIndex: 20,
      }}
    >
      {/* Imagen del dragón */}
      <img
        src={getAssetPath('/pictures/bonus/dragon.png')}
        alt="Dragon Ship"
        className="w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 25px rgba(251, 191, 36, 0.4))',
        }}
      />
      
      {/* Efectos de resplandor adicionales */}
      <div 
        className="absolute inset-0 rounded-full opacity-30 animate-pulse"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.6) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      
      {/* Efectos de fuego en los costados (opcional, para mantener algo de efecto) */}
      <div className="absolute top-1/2 left-0 w-2 h-1 bg-orange-400 rounded-full opacity-75 animate-pulse transform -translate-y-1/2 -translate-x-1"></div>
      <div className="absolute top-1/2 right-0 w-2 h-1 bg-orange-400 rounded-full opacity-75 animate-pulse transform -translate-y-1/2 translate-x-1"></div>
    </div>
  );
};
