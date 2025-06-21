import React, { useState, useEffect, useRef } from 'react';

interface EnhancedGameObjectProps {
  children: React.ReactNode;
  x: number;
  y: number;
  rotation: number;
  isSliced?: boolean;
  objectType?: 'fruit' | 'bomb' | 'bonus' | 'enemy';
  onSlice?: () => void;
  className?: string;
}

export const EnhancedGameObject: React.FC<EnhancedGameObjectProps> = ({
  children,
  x,
  y,
  rotation,
  isSliced = false,
  objectType = 'fruit',
  onSlice,
  className = ''
}) => {
  const [trails, setTrails] = useState<{id: number, x: number, y: number, opacity: number}[]>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [sliceEffect, setSliceEffect] = useState(false);
  const objectRef = useRef<HTMLDivElement>(null);
  const lastPositionRef = useRef({ x, y });

  // Crear estela de movimiento
  useEffect(() => {
    const distance = Math.sqrt(
      Math.pow(x - lastPositionRef.current.x, 2) + 
      Math.pow(y - lastPositionRef.current.y, 2)
    );

    if (distance > 2) {
      const newTrail = {
        id: Date.now() + Math.random(),
        x: lastPositionRef.current.x,
        y: lastPositionRef.current.y,
        opacity: 0.8
      };

      setTrails(prev => [...prev.slice(-8), newTrail]);
      lastPositionRef.current = { x, y };
    }

    // Desvanecer estelas
    const trailInterval = setInterval(() => {
      setTrails(prev => 
        prev.map(trail => ({ ...trail, opacity: trail.opacity * 0.9 }))
           .filter(trail => trail.opacity > 0.1)
      );
    }, 50);

    return () => clearInterval(trailInterval);
  }, [x, y]);

  // Efecto de corte
  useEffect(() => {
    if (isSliced && !sliceEffect) {
      setSliceEffect(true);
      setShowExplosion(true);
      
      // Crear partículas de explosión
      if (typeof window !== 'undefined' && (window as any).createParticleExplosion) {
        (window as any).createParticleExplosion(x, y, 15);
      }

      setTimeout(() => {
        setShowExplosion(false);
        onSlice?.();
      }, 500);
    }
  }, [isSliced, sliceEffect, x, y, onSlice]);

  const getObjectGlow = () => {
    switch (objectType) {
      case 'bonus':
        return 'enhanced-glow-green';
      case 'bomb':
        return 'enhanced-glow-orange';
      case 'enemy':
        return 'enhanced-glow-purple';
      default:
        return 'enhanced-glow';
    }
  };

  const getObjectShadow = () => {
    const shadowIntensity = Math.min(1, Math.abs(rotation) / 180);
    return `drop-shadow(${2 + shadowIntensity * 3}px ${4 + shadowIntensity * 4}px ${6 + shadowIntensity * 6}px rgba(0,0,0,${0.3 + shadowIntensity * 0.2}))`;
  };

  return (
    <>
      {/* Estelas de movimiento */}
      {trails.map(trail => (
        <div
          key={trail.id}
          className="absolute pointer-events-none"
          style={{
            left: trail.x,
            top: trail.y,
            width: '20px',
            height: '20px',
            background: `radial-gradient(circle, rgba(56, 189, 248, ${trail.opacity * 0.6}) 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}
        />
      ))}

      {/* Objeto principal */}
      <div
        ref={objectRef}
        className={`
          absolute game-object transform-3d transition-all duration-200
          ${getObjectGlow()}
          ${sliceEffect ? 'sliced' : ''}
          ${showExplosion ? 'explosion-particle' : ''}
          ${className}
        `}
        style={{
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) ${sliceEffect ? 'scale(1.5)' : 'scale(1)'}`,
          filter: `${getObjectShadow()} brightness(${showExplosion ? 1.5 : 1}) saturate(${showExplosion ? 1.3 : 1})`,
          zIndex: 2,
          opacity: sliceEffect ? 0.3 : 1
        }}
      >
        {children}
        
        {/* Efecto de energía para objetos especiales */}
        {(objectType === 'bonus' || objectType === 'enemy') && !isSliced && (
          <div 
            className="absolute inset-0 energy-effect rounded-full"
            style={{
              background: objectType === 'bonus' 
                ? 'radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, transparent 70%)',
              animation: 'energy-pulse 2s ease-in-out infinite'
            }}
          />
        )}

        {/* Efecto de explosión */}
        {showExplosion && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Ondas expansivas */}
            <div 
              className="absolute inset-0 rounded-full border-2 opacity-80"
              style={{
                borderColor: objectType === 'bomb' ? '#EF4444' : '#60A5FA',
                animation: 'ripple 0.6s linear infinite'
              }}
            />
            <div 
              className="absolute inset-0 rounded-full border-2 opacity-60"
              style={{
                borderColor: objectType === 'bomb' ? '#F59E0B' : '#34D399',
                animation: 'ripple 0.6s linear 0.2s infinite'
              }}
            />
            
            {/* Destellos */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: objectType === 'bomb' 
                  ? 'radial-gradient(circle, rgba(239, 68, 68, 0.8) 0%, transparent 50%)'
                  : 'radial-gradient(circle, rgba(96, 165, 250, 0.8) 0%, transparent 50%)',
                animation: 'sparkle 0.3s ease-out'
              }}
            />
          </div>
        )}
      </div>

      {/* Fragmentos del objeto (simulados) */}
      {sliceEffect && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`fragment-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: x + (Math.random() - 0.5) * 100,
                top: y + (Math.random() - 0.5) * 100,
                width: '8px',
                height: '8px',
                backgroundColor: objectType === 'bomb' ? '#EF4444' : '#60A5FA',
                borderRadius: '50%',
                animation: `explosion 0.8s ease-out ${i * 0.1}s forwards`,
                zIndex: 3
              }}
            />
          ))}
        </>
      )}
    </>
  );
};
