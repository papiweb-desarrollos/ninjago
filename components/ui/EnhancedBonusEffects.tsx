import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScoreOrbType } from '../../types';
import { getAssetPath } from '../../constants';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'fragment' | 'energy' | 'shockwave' | 'flame' | 'lightning';
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  friction: number;
  glow: boolean;
}

interface BonusExplosion {
  id: string;
  x: number;
  y: number;
  orbType: ScoreOrbType;
  image: string;
  particles: Particle[];
  createdAt: number;
  intensity: number;
}

interface EnhancedBonusEffectsProps {
  explosions: BonusExplosion[];
  onExplosionComplete: (id: string) => void;
}

const COLOR_PALETTES = {
  [ScoreOrbType.REGULAR]: [
    '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#1E40AF'
  ],
  [ScoreOrbType.BONUS]: [
    '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#047857'
  ],
  [ScoreOrbType.JACKPOT]: [
    '#F59E0B', '#FBBF24', '#FCD34D', '#FEF3C7', '#D97706',
    '#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#DC2626'
  ]
};

export const EnhancedBonusEffects: React.FC<EnhancedBonusEffectsProps> = ({ 
  explosions, 
  onExplosionComplete 
}) => {
  const [activeParticles, setActiveParticles] = useState<Particle[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(0);

  const createParticle = useCallback((
    x: number, 
    y: number, 
    type: Particle['type'], 
    orbType: ScoreOrbType,
    intensity: number = 1
  ): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 8) * intensity;
    const colors = COLOR_PALETTES[orbType];
    
    return {
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: type === 'shockwave' ? 30 : type === 'lightning' ? 20 : 60 + Math.random() * 40,
      size: type === 'shockwave' ? 100 : type === 'fragment' ? 6 + Math.random() * 8 : 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      type,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      gravity: type === 'fragment' ? 0.3 : type === 'energy' ? -0.1 : 0.1,
      friction: type === 'shockwave' ? 0.98 : 0.99,
      glow: type === 'energy' || type === 'lightning'
    };
  }, []);

  const createExplosionParticles = useCallback((explosion: BonusExplosion) => {
    const { x, y, orbType, intensity } = explosion;
    const newParticles: Particle[] = [];
    
    // Define particle counts with proper typing
    interface ParticleCounts {
      sparks: number;
      fragments: number;
      energy: number;
      shockwave?: number;
      flame?: number;
      lightning?: number;
    }
    
    // Determine particle counts based on orb type
    const counts: Record<ScoreOrbType, ParticleCounts> = {
      [ScoreOrbType.REGULAR]: { sparks: 15, fragments: 8, energy: 5 },
      [ScoreOrbType.BONUS]: { sparks: 25, fragments: 12, energy: 8, shockwave: 2 },
      [ScoreOrbType.JACKPOT]: { sparks: 40, fragments: 20, energy: 15, shockwave: 3, flame: 10, lightning: 5 }
    };

    const particleCounts = counts[orbType];

    // Create sparks
    for (let i = 0; i < particleCounts.sparks * intensity; i++) {
      newParticles.push(createParticle(x, y, 'spark', orbType, intensity));
    }

    // Create fragments
    for (let i = 0; i < particleCounts.fragments * intensity; i++) {
      newParticles.push(createParticle(x, y, 'fragment', orbType, intensity));
    }

    // Create energy particles
    for (let i = 0; i < particleCounts.energy * intensity; i++) {
      newParticles.push(createParticle(x, y, 'energy', orbType, intensity));
    }

    // Create shockwaves for bonus and jackpot
    if (particleCounts.shockwave) {
      for (let i = 0; i < particleCounts.shockwave; i++) {
        const shockwave = createParticle(x, y, 'shockwave', orbType, intensity);
        shockwave.vx = 0;
        shockwave.vy = 0;
        newParticles.push(shockwave);
      }
    }

    // Create flames for jackpot
    if (particleCounts.flame) {
      for (let i = 0; i < particleCounts.flame * intensity; i++) {
        newParticles.push(createParticle(x, y, 'flame', orbType, intensity));
      }
    }

    // Create lightning for jackpot
    if (particleCounts.lightning) {
      for (let i = 0; i < particleCounts.lightning; i++) {
        newParticles.push(createParticle(x, y, 'lightning', orbType, intensity));
      }
    }

    return newParticles;
  }, [createParticle]);

  // Update particles
  const updateParticles = useCallback((deltaTime: number) => {
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
        
        // Update life
        newParticle.life -= (1 / newParticle.maxLife) * deltaTime;
        
        // Special effects for different particle types
        if (newParticle.type === 'shockwave') {
          newParticle.size += 5 * deltaTime;
        } else if (newParticle.type === 'energy') {
          newParticle.size += Math.sin(Date.now() * 0.01) * 0.5;
        }
        
        return newParticle;
      }).filter(particle => particle.life > 0);
    });
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (lastUpdateRef.current === 0) {
        lastUpdateRef.current = timestamp;
      }
      
      const deltaTime = (timestamp - lastUpdateRef.current) * 0.016; // Normalize to ~60fps
      lastUpdateRef.current = timestamp;
      
      updateParticles(deltaTime);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateParticles]);

  // Handle new explosions
  useEffect(() => {
    explosions.forEach(explosion => {
      const newParticles = createExplosionParticles(explosion);
      setActiveParticles(prev => [...prev, ...newParticles]);
      
      // Clean up explosion after duration
      const duration = explosion.orbType === ScoreOrbType.JACKPOT ? 5000 : 
                     explosion.orbType === ScoreOrbType.BONUS ? 3500 : 2500;
      
      setTimeout(() => {
        onExplosionComplete(explosion.id);
      }, duration);
    });
  }, [explosions, createExplosionParticles, onExplosionComplete]);

  const getParticleStyle = (particle: Particle) => {
    const opacity = Math.max(0, particle.life);
    const scale = particle.type === 'shockwave' ? particle.life * 2 : 1;
    
    let background = particle.color;
    let boxShadow = '';
    let filter = '';
    
    if (particle.glow) {
      boxShadow = `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`;
    }
    
    if (particle.type === 'lightning') {
      filter = 'brightness(2) saturate(1.5)';
      background = `linear-gradient(45deg, ${particle.color}, #FFFFFF, ${particle.color})`;
    } else if (particle.type === 'flame') {
      filter = 'brightness(1.5) saturate(1.3)';
      background = `radial-gradient(circle, ${particle.color}, #FF4500)`;
    } else if (particle.type === 'shockwave') {
      background = 'transparent';
      boxShadow = `0 0 0 2px ${particle.color}`;
      filter = 'blur(1px)';
    }
    
    return {
      position: 'absolute' as const,
      left: `${particle.x}px`,
      top: `${particle.y}px`,
      width: `${particle.size}px`,
      height: `${particle.size}px`,
      background,
      borderRadius: particle.type === 'fragment' ? '20%' : '50%',
      opacity,
      transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${scale})`,
      boxShadow,
      filter,
      pointerEvents: 'none' as const,
      zIndex: particle.type === 'shockwave' ? 1 : particle.type === 'lightning' ? 10 : 5,
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Enhanced image effects */}
      {explosions.map(explosion => (
        <div 
          key={explosion.id}
          className="absolute pointer-events-none"
          style={{
            left: `${explosion.x}px`,
            top: `${explosion.y}px`,
            zIndex: 15,
          }}
        >
          {/* Main image with enhanced effects */}
          <div 
            className={`relative rounded-full border-4 shadow-2xl overflow-hidden ${
              explosion.orbType === ScoreOrbType.JACKPOT ? 'w-40 h-40 border-yellow-400' :
              explosion.orbType === ScoreOrbType.BONUS ? 'w-32 h-32 border-green-400' :
              'w-24 h-24 border-blue-400'
            }`}
            style={{
              backgroundImage: `url(${getAssetPath(`/pictures/bonus/${explosion.image}`)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              boxShadow: explosion.orbType === ScoreOrbType.JACKPOT 
                ? '0 0 60px rgba(255, 215, 0, 1), 0 0 120px rgba(255, 215, 0, 0.8), 0 0 180px rgba(255, 215, 0, 0.6)'
                : explosion.orbType === ScoreOrbType.BONUS
                ? '0 0 50px rgba(34, 197, 94, 0.9), 0 0 100px rgba(34, 197, 94, 0.7)'
                : '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(59, 130, 246, 0.6)',
              animation: explosion.orbType === ScoreOrbType.JACKPOT 
                ? 'jackpot-mega-explosion 5s ease-out forwards'
                : explosion.orbType === ScoreOrbType.BONUS
                ? 'bonus-super-explosion 3.5s ease-out forwards'
                : 'regular-explosion 2.5s ease-out forwards',
              filter: 'brightness(1.5) saturate(1.3)',
            }}
          >
            {/* Energy overlay */}
            <div 
              className="absolute inset-0"
              style={{
                background: explosion.orbType === ScoreOrbType.JACKPOT
                  ? 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)'
                  : explosion.orbType === ScoreOrbType.BONUS
                  ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                animation: 'energy-pulse 0.5s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* Enhanced orbital particles */}
          <div className="absolute inset-0 animate-spin-fast">
            {Array.from({ length: explosion.orbType === ScoreOrbType.JACKPOT ? 12 : 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  background: COLOR_PALETTES[explosion.orbType][i % COLOR_PALETTES[explosion.orbType].length],
                  transform: `rotate(${(360 / (explosion.orbType === ScoreOrbType.JACKPOT ? 12 : 8)) * i}deg) translateX(${explosion.orbType === ScoreOrbType.JACKPOT ? '80px' : '60px'}) translateY(-50%)`,
                  boxShadow: `0 0 20px ${COLOR_PALETTES[explosion.orbType][i % COLOR_PALETTES[explosion.orbType].length]}`,
                  animation: `orbital-glow 0.3s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Render particles */}
      {activeParticles.map(particle => (
        <div key={particle.id} style={getParticleStyle(particle)} />
      ))}

      {/* Enhanced CSS animations */}
      <style>{`
        @keyframes jackpot-mega-explosion {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px) hue-rotate(0deg);
          }
          10% { 
            transform: scale(1.2) rotate(36deg); 
            opacity: 1; 
            filter: brightness(3) blur(2px) hue-rotate(60deg);
          }
          25% { 
            transform: scale(1.8) rotate(90deg); 
            opacity: 1; 
            filter: brightness(4) blur(3px) hue-rotate(120deg);
          }
          50% { 
            transform: scale(2.2) rotate(180deg); 
            opacity: 1; 
            filter: brightness(5) blur(4px) hue-rotate(240deg);
          }
          75% { 
            transform: scale(1.5) rotate(270deg); 
            opacity: 0.8; 
            filter: brightness(3) blur(2px) hue-rotate(360deg);
          }
          100% { 
            transform: scale(0.1) rotate(360deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px) hue-rotate(720deg);
          }
        }

        @keyframes bonus-super-explosion {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px) hue-rotate(0deg);
          }
          15% { 
            transform: scale(1.3) rotate(45deg); 
            opacity: 1; 
            filter: brightness(2.5) blur(2px) hue-rotate(90deg);
          }
          40% { 
            transform: scale(1.6) rotate(135deg); 
            opacity: 1; 
            filter: brightness(3) blur(3px) hue-rotate(180deg);
          }
          70% { 
            transform: scale(1.2) rotate(225deg); 
            opacity: 0.8; 
            filter: brightness(2) blur(1px) hue-rotate(270deg);
          }
          100% { 
            transform: scale(0.2) rotate(315deg); 
            opacity: 0; 
            filter: brightness(0.5) blur(0px) hue-rotate(360deg);
          }
        }

        @keyframes regular-explosion {
          0% { 
            transform: scale(0) rotate(0deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px);
          }
          20% { 
            transform: scale(1.2) rotate(60deg); 
            opacity: 1; 
            filter: brightness(2) blur(1px);
          }
          60% { 
            transform: scale(1.4) rotate(180deg); 
            opacity: 1; 
            filter: brightness(2.5) blur(2px);
          }
          100% { 
            transform: scale(0.3) rotate(270deg); 
            opacity: 0; 
            filter: brightness(1) blur(0px);
          }
        }

        @keyframes energy-pulse {
          0% { opacity: 0.3; transform: scale(1); }
          100% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes orbital-glow {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin-fast {
          animation: spin-fast 1s linear infinite;
        }
      `}</style>
    </div>
  );
};
