import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  avgFps: number;
  frameTime: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onPerformanceChange?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  position = 'top-right',
  onPerformanceChange
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    avgFps: 0,
    frameTime: 0,
    memoryUsage: 0
  });

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      if (delta >= 1000) { // Actualizar cada segundo
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        
        // Mantener historial de FPS para promedio
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }
        
        const avgFps = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );

        // Obtener uso de memoria si está disponible
        let memoryUsage = 0;
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        }

        const newMetrics: PerformanceMetrics = {
          fps,
          avgFps,
          frameTime: Math.round(delta / frameCountRef.current * 100) / 100,
          memoryUsage
        };

        setMetrics(newMetrics);
        onPerformanceChange?.(newMetrics);

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      frameCountRef.current++;
      animationFrameRef.current = requestAnimationFrame(measurePerformance);
    };

    animationFrameRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, onPerformanceChange]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'top-right':
        return 'top-2 right-2';
      case 'bottom-left':
        return 'bottom-2 left-2';
      case 'bottom-right':
        return 'bottom-2 right-2';
      default:
        return 'top-2 right-2';
    }
  };

  const getPerformanceColor = () => {
    if (metrics.fps >= 55) return 'text-green-400';
    if (metrics.fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!enabled) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 glass-effect-dark border border-white/20 rounded-lg p-2 text-xs font-mono`}>
      <div className="space-y-1">
        <div className={`flex justify-between gap-3 ${getPerformanceColor()}`}>
          <span>FPS:</span>
          <span className="font-bold">{metrics.fps}</span>
        </div>
        
        <div className="flex justify-between gap-3 text-blue-400">
          <span>Avg:</span>
          <span>{metrics.avgFps}</span>
        </div>
        
        <div className="flex justify-between gap-3 text-purple-400">
          <span>Frame:</span>
          <span>{metrics.frameTime}ms</span>
        </div>
        
        {metrics.memoryUsage !== undefined && (
          <div className="flex justify-between gap-3 text-orange-400">
            <span>RAM:</span>
            <span>{metrics.memoryUsage}MB</span>
          </div>
        )}
        
        {/* Indicador visual de rendimiento */}
        <div className="mt-2">
          <div className="w-full h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                metrics.fps >= 55 ? 'bg-green-400' :
                metrics.fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, (metrics.fps / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook para detectar dispositivos de bajo rendimiento
export const usePerformanceOptimization = () => {
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [shouldReduceEffects, setShouldReduceEffects] = useState(false);

  useEffect(() => {
    // Detectar hardware limitado
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    const lowEndDevice = hardwareConcurrency < 4 || deviceMemory < 4;
    setIsLowEnd(lowEndDevice);
    
    // Detectar conexión lenta
    const connection = (navigator as any).connection;
    const slowConnection = connection && 
      (connection.effectiveType === 'slow-2g' || 
       connection.effectiveType === '2g' ||
       connection.effectiveType === '3g');

    setShouldReduceEffects(lowEndDevice || slowConnection);
  }, []);

  const getOptimizedSettings = () => ({
    particleCount: isLowEnd ? 15 : shouldReduceEffects ? 25 : 50,
    enableGlow: !shouldReduceEffects,
    enableBlur: !isLowEnd,
    enableShadows: !shouldReduceEffects,
    animationSpeed: isLowEnd ? 0.7 : 1,
    enableAdvancedEffects: !isLowEnd && !shouldReduceEffects
  });

  return {
    isLowEnd,
    shouldReduceEffects,
    getOptimizedSettings
  };
};

// Componente para mostrar consejos de optimización
export const OptimizationTips: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    // Mostrar consejos si el rendimiento es bajo
    if (metrics.fps < 30 && metrics.fps > 0) {
      setShowTips(true);
      
      // Ocultar después de 5 segundos
      setTimeout(() => setShowTips(false), 5000);
    }
  }, [metrics.fps]);

  if (!showTips) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 glass-effect border border-yellow-500/50 rounded-lg p-4 text-sm z-40">
      <div className="flex items-start gap-3">
        <div className="text-yellow-500 text-xl">⚠️</div>
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Rendimiento Bajo Detectado</h3>
          <ul className="text-yellow-200 space-y-1 text-xs">
            <li>• Considera reducir la calidad de efectos visuales</li>
            <li>• Cierra otras pestañas del navegador</li>
            <li>• Los efectos se optimizarán automáticamente</li>
          </ul>
        </div>
        <button 
          onClick={() => setShowTips(false)}
          className="text-yellow-400 hover:text-yellow-200 ml-auto"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
