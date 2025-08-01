import React from 'react';
import { DragonFireState } from '../types';

interface DragonFireProps {
  fire: DragonFireState;
}

export const DragonFire: React.FC<DragonFireProps> = ({ fire }) => {
  const age = (performance.now() - fire.createdAt) / 1000; // Edad en segundos
  const opacity = Math.max(0.3, 1 - age * 0.5); // Se desvanece con el tiempo
  
  return (
    <div
      className="absolute pointer-events-none transform"
      style={{
        left: `${fire.x - fire.size / 2}px`,
        top: `${fire.y - fire.size / 2}px`,
        width: `${fire.size}px`,
        height: `${fire.size}px`,
        opacity: opacity,
        zIndex: 15,
      }}
    >
      {/* Núcleo del fuego */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 30%, #dc2626 70%, #b91c1c 100%)',
          boxShadow: `
            0 0 ${fire.size}px rgba(251, 191, 36, 0.8),
            0 0 ${fire.size * 1.5}px rgba(245, 158, 11, 0.6),
            0 0 ${fire.size * 2}px rgba(220, 38, 38, 0.4)
          `,
        }}
      />
      
      {/* Llama interior */}
      <div 
        className="absolute inset-1 rounded-full animate-ping"
        style={{
          background: 'radial-gradient(circle, #fef3c7 0%, #fbbf24 50%, transparent 80%)',
          animationDuration: '0.5s',
        }}
      />
      
      {/* Chispas exteriores */}
      <div className="absolute -top-1 -left-1 w-1 h-1 bg-yellow-300 rounded-full animate-bounce opacity-80"></div>
      <div className="absolute -top-1 -right-1 w-1 h-1 bg-orange-400 rounded-full animate-bounce delay-100 opacity-80"></div>
      <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-red-400 rounded-full animate-bounce delay-200 opacity-80"></div>
      <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-yellow-500 rounded-full animate-bounce delay-300 opacity-80"></div>
      
      {/* Centro brillante */}
      <div 
        className="absolute inset-2 rounded-full opacity-90"
        style={{
          background: 'radial-gradient(circle, #ffffff 0%, #fbbf24 40%, transparent 70%)',
        }}
      />
    </div>
  );
};
