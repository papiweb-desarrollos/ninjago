import React, { useEffect } from 'react';
import { usePerformanceOptimization } from './PerformanceMonitor';

interface GlobalOptimizerProps {
  children: React.ReactNode;
}

export const GlobalOptimizer: React.FC<GlobalOptimizerProps> = ({ children }) => {
  const { isLowEnd, shouldReduceEffects, getOptimizedSettings } = usePerformanceOptimization();
  
  useEffect(() => {
    if (shouldReduceEffects) {
      const settings = getOptimizedSettings();
      
      // Aplicar optimizaciones CSS globales
      const root = document.documentElement;
      
      if (!settings.enableGlow) {
        root.style.setProperty('--glow-intensity', '0');
      }
      
      if (!settings.enableBlur) {
        root.style.setProperty('--blur-intensity', '0px');
      }
      
      if (!settings.enableShadows) {
        root.style.setProperty('--shadow-intensity', '0');
      }
      
      if (!settings.enableAdvancedEffects) {
        root.style.setProperty('--animation-duration', '0s');
        root.style.setProperty('--particle-opacity', '0');
      }
      
      // Reducir la cantidad de partículas
      root.style.setProperty('--particle-count', settings.particleCount.toString());
      
      // Ajustar velocidad de animaciones
      root.style.setProperty('--animation-speed', settings.animationSpeed.toString());
      
      console.log('🔧 Optimizaciones aplicadas para dispositivo de bajo rendimiento:', settings);
    } else {
      // Restaurar valores predeterminados
      const root = document.documentElement;
      root.style.removeProperty('--glow-intensity');
      root.style.removeProperty('--blur-intensity');
      root.style.removeProperty('--shadow-intensity');
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--particle-opacity');
      root.style.removeProperty('--particle-count');
      root.style.removeProperty('--animation-speed');
    }
  }, [shouldReduceEffects, getOptimizedSettings]);
  
  return (
    <div 
      className={`global-optimizer ${isLowEnd ? 'low-end-device' : 'high-end-device'}`}
      data-optimized={shouldReduceEffects}
    >
      {children}
    </div>
  );
};

export default GlobalOptimizer;
