import React, { useState, useEffect } from 'react';
import { audioManager } from '../../AudioManager';

interface VolumeControlProps {
  className?: string;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ className = '' }) => {
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Cargar valores actuales del AudioManager
    const currentVolume = audioManager.getGlobalVolume();
    const currentMuted = audioManager.getIsMuted();
    setVolume(currentVolume);
    setIsMuted(currentMuted);
  }, []);

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    audioManager.setGlobalVolume(newVolume);
    
    // Si el volumen es > 0 y estaba muteado, desmutear
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const newMutedState = audioManager.toggleMute();
    setIsMuted(newMutedState);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return '🔇';
    if (volume < 0.3) return '🔈';
    if (volume < 0.7) return '🔉';
    return '🔊';
  };

  return (
    <div className={`volume-control ${className}`}>
      <div 
        className="volume-trigger"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <button
          onClick={toggleMute}
          className="volume-button btn bg-slate-700 hover:bg-slate-600 p-2 rounded"
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          <span className="text-lg">{getVolumeIcon()}</span>
        </button>
        
        {isVisible && (
          <div className="volume-slider-container absolute bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 mt-2 z-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">Vol:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                disabled={isMuted}
              />
              <span className="text-xs text-slate-300 min-w-0">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
