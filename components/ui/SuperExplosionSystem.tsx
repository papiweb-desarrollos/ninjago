import React, { useState, useEffect, useRef, useCallback } from 'react';

interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'core' | 'fragment' | 'spark' | 'wave' | 'flash' | 'debris';
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  friction: number;
  opacity: number;
  glowIntensity: number;
}

interface ExplosionEffect {
  id: string;
  x: number;
  y: number;
  intensity: number;
  type: 'small' | 'medium' | 'large' | 'mega';
  color?: string;
  duration: number;
  particles: ExplosionParticle[];
  createdAt: number;
}

interface SuperExplosionSystemProps {
  explosions: ExplosionEffect[];
  onExplosionComplete: (id: string) => void;
  className?: string;
}

const EXPLOSION_COLORS = {
  small: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'],
  medium: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
  large: ['#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7'],
  mega: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#F59E0B', '#FBBF24', '#A855F7', '#C084FC']
};

const EXPLOSION_CONFIGS = {
  small: { particles: 15, radius: 50, force: 3, duration: 1500 },
  medium: { particles: 25, radius: 80, force: 5, duration: 2500 },
  large: { particles: 40, radius: 120, force: 8, duration: 3500 },
  mega: { particles: 60, radius: 180, force: 12, duration: 5000 }
};

export const SuperExplosionSystem: React.FC<SuperExplosionSystemProps> = ({
  explosions,
  onExplosionComplete,
  className = ""
}) => {
  const [activeParticles, setActiveParticles] = useState<ExplosionParticle[]>([]);
  const [shockwaves, setShockwaves] = useState<Array<{
    id: string;
    x: number;
    y: number;
    size: number;
    maxSize: number;
    opacity: number;
    color: string;
    createdAt: number;
  }>>([]);
  
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  const createExplosionParticle = useCallback((
    x: number,
    y: number,
    type: ExplosionParticle['type'],
    explosionType: string,
    intensity: number = 1,
    customColor?: string
  ): ExplosionParticle => {
    const angle = Math.random() * Math.PI * 2;
    const config = EXPLOSION_CONFIGS[explosionType as keyof typeof EXPLOSION_CONFIGS];
    const speed = (config.force * (0.5 + Math.random() * 0.5)) * intensity;
    const colors = customColor ? [customColor] : EXPLOSION_COLORS[explosionType as keyof typeof EXPLOSION_COLORS];
    
    // Spread particles in circle
    const distance = Math.random() * config.radius;
    const startX = x + Math.cos(angle) * distance * 0.1;
    const startY = y + Math.sin(angle) * distance * 0.1;
    
    return {
      id: Math.random(),
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: type === 'flash' ? 10 : type === 'wave' ? 20 : 40 + Math.random() * 30,
      size: type === 'core' ? 8 + Math.random() * 12 : 
            type === 'flash' ? 20 + Math.random() * 20 :
            type === 'wave' ? 15 + Math.random() * 10 :
            type === 'fragment' ? 4 + Math.random() * 8 :
            3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      type,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      gravity: type === 'fragment' ? 0.4 : type === 'debris' ? 0.6 : 0.1,
      friction: type === 'spark' ? 0.97 : 0.98,
      opacity: 1,
      glowIntensity: type === 'core' || type === 'flash' ? 2 : 1
    };
  }, []);

  const createExplosion = useCallback((effect: ExplosionEffect) => {
    const { x, y, intensity, type, color } = effect;
    const config = EXPLOSION_CONFIGS[type];
    const newParticles: ExplosionParticle[] = [];
    
    // Core explosion particles
    const coreCount = Math.floor(config.particles * 0.2 * intensity);
    for (let i = 0; i < coreCount; i++) {
      newParticles.push(createExplosionParticle(x, y, 'core', type, intensity, color));
    }
    
    // Fragment particles
    const fragmentCount = Math.floor(config.particles * 0.4 * intensity);
    for (let i = 0; i < fragmentCount; i++) {
      newParticles.push(createExplosionParticle(x, y, 'fragment', type, intensity, color));
    }
    
    // Spark particles
    const sparkCount = Math.floor(config.particles * 0.3 * intensity);
    for (let i = 0; i < sparkCount; i++) {
      newParticles.push(createExplosionParticle(x, y, 'spark', type, intensity, color));
    }
    
    // Flash particles for bigger explosions
    if (type === 'large' || type === 'mega') {
      const flashCount = Math.floor(config.particles * 0.1 * intensity);
      for (let i = 0; i < flashCount; i++) {
        newParticles.push(createExplosionParticle(x, y, 'flash', type, intensity, color));
      }
    }
    
    // Debris for mega explosions
    if (type === 'mega') {
      const debrisCount = Math.floor(config.particles * 0.15 * intensity);
      for (let i = 0; i < debrisCount; i++) {
        newParticles.push(createExplosionParticle(x, y, 'debris', type, intensity, color));
      }
    }
    
    setActiveParticles(prev => [...prev, ...newParticles]);
    
    // Create shockwave
    if (type === 'medium' || type === 'large' || type === 'mega') {
      const shockwaveColor = color || EXPLOSION_COLORS[type][0];
      const maxSize = config.radius * 2 * intensity;
      
      setShockwaves(prev => [...prev, {
        id: effect.id + '_shockwave',
        x,
        y,
        size: 0,
        maxSize,
        opacity: 0.8,
        color: shockwaveColor,
        createdAt: performance.now()
      }]);
    }
    
    // Schedule cleanup
    setTimeout(() => {
      onExplosionComplete(effect.id);
    }, config.duration);
    
  }, [createExplosionParticle, onExplosionComplete]);

  // Update particles and effects
  const updateEffects = useCallback((deltaTime: number) => {
    // Update particles
    setActiveParticles(prevParticles => {
      return prevParticles.map(particle => {
        const newParticle = { ...particle };
        
        // Update position
        newParticle.x += newParticle.vx * deltaTime;
        newParticle.y += newParticle.vy * deltaTime;
        
        // Apply gravity
        newParticle.vy += newParticle.gravity * deltaTime;
        
        // Apply friction
        newParticle.vx *= newParticle.friction;
        newParticle.vy *= newParticle.friction;
        
        // Update rotation
        newParticle.rotation += newParticle.rotationSpeed * deltaTime;
        
        // Update life and opacity
        newParticle.life -= (1 / newParticle.maxLife) * deltaTime;
        newParticle.opacity = Math.max(0, newParticle.life);
        
        // Special effects for different types
        if (newParticle.type === 'flash') {
          newParticle.size += 2 * deltaTime;
          newParticle.glowIntensity = newParticle.life * 3;
        } else if (newParticle.type === 'core') {
          newParticle.glowIntensity = newParticle.life * 2;
        }
        
        return newParticle;
      }).filter(particle => particle.life > 0);
    });
    
    // Update shockwaves
    setShockwaves(prevShockwaves => {
      return prevShockwaves.map(shockwave => {
        const elapsed = performance.now() - shockwave.createdAt;
        const progress = Math.min(elapsed / 1000, 1); // 1 second duration
        
        return {
          ...shockwave,
          size: progress * shockwave.maxSize,
          opacity: (1 - progress) * 0.8
        };
      }).filter(shockwave => {
        const elapsed = performance.now() - shockwave.createdAt;
        return elapsed < 1000;
      });
    });
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastUpdateRef.current === 0) {
        lastUpdateRef.current = timestamp;
      }
      
      const deltaTime = (timestamp - lastUpdateRef.current) * 0.016;
      lastUpdateRef.current = timestamp;
      
      updateEffects(deltaTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateEffects]);

  // Handle new explosions
  useEffect(() => {
    explosions.forEach(explosion => {
      createExplosion(explosion);
    });
  }, [explosions, createExplosion]);

  const getParticleStyle = (particle: ExplosionParticle) => {
    let background = particle.color;
    let filter = '';
    let boxShadow = '';
    
    if (particle.type === 'core' || particle.type === 'flash') {
      boxShadow = `0 0 ${particle.size * particle.glowIntensity}px ${particle.color}`;
      filter = `brightness(${1.5 + particle.glowIntensity * 0.5}) saturate(1.5)`;
    } else if (particle.type === 'spark') {
      boxShadow = `0 0 ${particle.size * 2}px ${particle.color}`;
      filter = 'brightness(1.3)';
    } else if (particle.type === 'fragment') {
      filter = 'brightness(1.2)';
    }
    
    return {
      position: 'absolute' as const,
      left: `${particle.x}px`,
      top: `${particle.y}px`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      background,
      borderRadius: particle.type === 'fragment' || particle.type === 'debris' ? '20%' : '50%',
      opacity: particle.opacity,
      transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
      boxShadow,
      filter,
      pointerEvents: 'none' as const,
      zIndex: particle.type === 'flash' ? 15 : particle.type === 'core' ? 10 : 5,
    };
  };

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Shockwaves */}
      {shockwaves.map(shockwave => (
        <div
          key={shockwave.id}
          className="absolute rounded-full border-2"
          style={{
            left: `${shockwave.x}px`,
            top: `${shockwave.y}px`,
            width: `${shockwave.size}px`,
            height: `${shockwave.size}px`,
            borderColor: shockwave.color,
            opacity: shockwave.opacity,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${shockwave.size * 0.1}px ${shockwave.color}`,
            zIndex: 1,
          }}
        />
      ))}
      
      {/* Particles */}
      {activeParticles.map(particle => (
        <div key={particle.id} style={getParticleStyle(particle)} />
      ))}
      
      {/* Enhanced CSS for additional effects */}
      <style>{`
        @keyframes screen-flash {
          0% { opacity: 0; }
          50% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        
        .explosion-flash {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
          animation: screen-flash 0.3s ease-out;
          pointer-events: none;
          z-index: 20;
        }
        
        .particle-trail {
          position: absolute;
          width: 2px;
          height: 20px;
          background: linear-gradient(to bottom, transparent, currentColor);
          transform-origin: center bottom;
        }
      `}</style>
    </div>
  );
};

export default SuperExplosionSystem;
