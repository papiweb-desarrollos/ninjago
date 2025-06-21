import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'trail' | 'explosion' | 'smoke' | 'star';
}

interface AdvancedParticleSystemProps {
  isActive: boolean;
  centerX?: number;
  centerY?: number;
  particleCount?: number;
  className?: string;
}

export const AdvancedParticleSystem: React.FC<AdvancedParticleSystemProps> = ({
  isActive,
  centerX = 50,
  centerY = 50,
  particleCount = 50,
  className = ''
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Colores para diferentes tipos de partículas
  const colors = {
    spark: ['#60A5FA', '#34D399', '#F59E0B', '#EF4444', '#A855F7'],
    trail: ['rgba(96, 165, 250, 0.8)', 'rgba(52, 211, 153, 0.8)', 'rgba(245, 158, 11, 0.8)'],
    explosion: ['#FF6B6B', '#FFE66D', '#FF8E53', '#4ECDC4', '#45B7D1'],
    smoke: ['rgba(156, 163, 175, 0.6)', 'rgba(75, 85, 99, 0.6)', 'rgba(55, 65, 81, 0.6)'],
    star: ['#FEF3C7', '#FEF08A', '#FBBF24', '#F59E0B']
  };

  // Crear una nueva partícula
  const createParticle = useCallback((type: Particle['type'] = 'spark'): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const colorArray = colors[type];
    
    return {
      id: Math.random(),
      x: centerX + (Math.random() - 0.5) * 10,
      y: centerY + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 60 + Math.random() * 60,
      size: type === 'explosion' ? 8 + Math.random() * 12 : 2 + Math.random() * 6,
      color: colorArray[Math.floor(Math.random() * colorArray.length)],
      type
    };
  }, [centerX, centerY]);

  // Crear explosión de partículas
  const createExplosion = useCallback((x: number, y: number, count: number = 20) => {
    const newParticles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const type: Particle['type'] = Math.random() > 0.7 ? 'explosion' : 'spark';
      const colorArray = colors[type];
      
      return {
        id: Math.random(),
        x: x + (Math.random() - 0.5) * 5,
        y: y + (Math.random() - 0.5) * 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 40 + Math.random() * 40,
        size: type === 'explosion' ? 6 + Math.random() * 10 : 3 + Math.random() * 5,
        color: colorArray[Math.floor(Math.random() * colorArray.length)],
        type
      };
    });

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Actualizar partículas
  const updateParticles = useCallback((deltaTime: number) => {
    setParticles(prevParticles => {
      return prevParticles
        .map(particle => {
          // Actualizar posición
          const newX = particle.x + particle.vx * deltaTime * 0.1;
          const newY = particle.y + particle.vy * deltaTime * 0.1;
          
          // Aplicar gravedad a ciertos tipos
          let newVy = particle.vy;
          if (particle.type === 'explosion' || particle.type === 'spark') {
            newVy += 0.2 * deltaTime * 0.1;
          }
          
          // Reducir velocidad (fricción)
          const friction = 0.98;
          const newVx = particle.vx * friction;
          newVy *= friction;
          
          // Reducir vida
          const newLife = particle.life - (1 / particle.maxLife);
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            life: newLife
          };
        })
        .filter(particle => particle.life > 0);
    });
  }, []);

  // Generar nuevas partículas continuamente
  useEffect(() => {
    if (!isActive) return;

    const generateInterval = setInterval(() => {
      if (particles.length < particleCount) {
        const newParticles: Particle[] = Array.from({ length: 3 }, () => 
          createParticle(Math.random() > 0.8 ? 'star' : 'spark')
        );
        setParticles(prev => [...prev, ...newParticles]);
      }
    }, 200);

    return () => clearInterval(generateInterval);
  }, [isActive, particles.length, particleCount, createParticle]);

  // Animación principal
  useEffect(() => {
    if (!isActive) return;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      if (deltaTime > 0) {
        updateParticles(deltaTime);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, updateParticles]);

  // Limpiar al desactivar
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
    }
  }, [isActive]);

  // Exponer función de explosión globalmente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).createParticleExplosion = createExplosion;
    }
  }, [createExplosion]);

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.life,
            boxShadow: particle.type === 'explosion' 
              ? `0 0 ${particle.size * 2}px ${particle.color}` 
              : `0 0 ${particle.size}px ${particle.color}`,
            transform: `scale(${particle.life})`,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      ))}
    </div>
  );
};

// Hook para usar el sistema de partículas fácilmente
export const useParticleSystem = () => {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const trigger = useCallback((x: number = 50, y: number = 50, duration: number = 2000) => {
    setPosition({ x, y });
    setIsActive(true);
    
    setTimeout(() => {
      setIsActive(false);
    }, duration);
  }, []);

  const createExplosion = useCallback((x: number, y: number) => {
    if (typeof window !== 'undefined' && (window as any).createParticleExplosion) {
      (window as any).createParticleExplosion(x, y);
    }
  }, []);

  return {
    isActive,
    position,
    trigger,
    createExplosion,
    ParticleSystem: AdvancedParticleSystem
  };
};
