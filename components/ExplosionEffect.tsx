import React from 'react';

interface ExplosionEffectProps {
  x: number;
  y: number;
  type: 'fire' | 'bomb' | 'impact';
  onComplete: () => void;
}

export const ExplosionEffect: React.FC<ExplosionEffectProps> = ({ x, y, type, onComplete }) => {
  const [phase, setPhase] = React.useState<'expanding' | 'peak' | 'fading'>('expanding');
  
  React.useEffect(() => {
    const timer1 = setTimeout(() => setPhase('peak'), 100); // Reducido de 150 a 100
    const timer2 = setTimeout(() => setPhase('fading'), 200); // Reducido de 300 a 200
    const timer3 = setTimeout(() => onComplete(), 400); // Reducido de 600 a 400
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const getExplosionConfig = () => {
    switch (type) {
      case 'fire':
        return {
          colors: ['#ffeb3b', '#ff9800', '#f44336', '#d32f2f'],
          size: phase === 'expanding' ? 20 : phase === 'peak' ? 60 : 40,
          particles: 6, // Reducido de 8 a 6
          intensity: 'high'
        };
      case 'bomb':
        return {
          colors: ['#ff1744', '#d32f2f', '#b71c1c', '#424242'],
          size: phase === 'expanding' ? 30 : phase === 'peak' ? 80 : 50,
          particles: 8, // Reducido de 12 a 8
          intensity: 'extreme'
        };
      case 'impact':
      default:
        return {
          colors: ['#4fc3f7', '#29b6f6', '#0277bd', '#01579b'],
          size: phase === 'expanding' ? 15 : phase === 'peak' ? 45 : 30,
          particles: 4, // Reducido de 6 a 4
          intensity: 'medium'
        };
    }
  };

  const config = getExplosionConfig();
  const opacity = phase === 'expanding' ? 0.8 : phase === 'peak' ? 1 : 0.3;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x - config.size / 2}px`,
        top: `${y - config.size / 2}px`,
        width: `${config.size}px`,
        height: `${config.size}px`,
        zIndex: 25,
      }}
    >
      {/* Núcleo de la explosión */}
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{
          background: `radial-gradient(circle, ${config.colors[0]} 0%, ${config.colors[1]} 40%, ${config.colors[2]} 70%, transparent 100%)`,
          opacity: opacity,
          transform: `scale(${phase === 'expanding' ? 0.5 : phase === 'peak' ? 1.2 : 0.8})`,
          transition: 'all 0.15s ease-out',
          boxShadow: `0 0 ${config.size}px ${config.colors[1]}`,
        }}
      />

      {/* Anillo exterior */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `3px solid ${config.colors[2]}`,
          opacity: opacity * 0.7,
          transform: `scale(${phase === 'expanding' ? 0.3 : phase === 'peak' ? 1.5 : 1.1})`,
          transition: 'all 0.2s ease-out',
          boxShadow: `0 0 ${config.size * 0.5}px ${config.colors[2]}`,
        }}
      />

      {/* Partículas de explosión */}
      {Array.from({ length: config.particles }).map((_, i) => {
        const angle = (i * 360) / config.particles;
        const distance = phase === 'expanding' ? 10 : phase === 'peak' ? config.size * 0.6 : config.size * 0.4;
        const particleX = Math.cos((angle * Math.PI) / 180) * distance;
        const particleY = Math.sin((angle * Math.PI) / 180) * distance;
        const particleSize = phase === 'expanding' ? 3 : phase === 'peak' ? 8 : 5;

        return (
          <div
            key={i}
            className="absolute rounded-full animate-bounce"
            style={{
              left: `50%`,
              top: `50%`,
              width: `${particleSize}px`,
              height: `${particleSize}px`,
              background: config.colors[i % config.colors.length],
              transform: `translate(-50%, -50%) translate(${particleX}px, ${particleY}px)`,
              opacity: opacity,
              transition: 'all 0.1s ease-out',
              boxShadow: `0 0 ${particleSize * 2}px ${config.colors[i % config.colors.length]}`,
              animationDelay: `${i * 50}ms`,
              animationDuration: '0.3s',
            }}
          />
        );
      })}

      {/* Chispas adicionales para explosiones de fuego - reducidas para mejor rendimiento */}
      {type === 'fire' && Array.from({ length: 3 }).map((_, i) => {
        const sparkAngle = (i * 120) + 30; // Reducido de 6 chispas a 3
        const sparkDistance = config.size * 0.6; // Reducida la distancia
        const sparkX = Math.cos((sparkAngle * Math.PI) / 180) * sparkDistance;
        const sparkY = Math.sin((sparkAngle * Math.PI) / 180) * sparkDistance;

        return (
          <div
            key={`spark-${i}`}
            className="absolute rounded-full"
            style={{
              left: `50%`,
              top: `50%`,
              width: '2px',
              height: '2px',
              background: '#ffeb3b',
              transform: `translate(-50%, -50%) translate(${sparkX}px, ${sparkY}px)`,
              opacity: opacity * 0.8,
              boxShadow: '0 0 4px #ffeb3b',
              animation: `sparkle 0.6s ease-out`,
            }}
          />
        );
      })}

      {/* Onda de choque */}
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: config.colors[3],
          opacity: opacity * 0.3,
          transform: `scale(${phase === 'expanding' ? 0.1 : phase === 'peak' ? 2 : 1.5})`,
          transition: 'all 0.3s ease-out',
        }}
      />
    </div>
  );
};
