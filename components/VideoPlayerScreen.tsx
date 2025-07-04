import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoInfo, SoundEffect } from '../types';
import { 
  VIDEO_CATALOG, GAME_WIDTH, GAME_HEIGHT, 
  PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, FullscreenEnterIcon, FullscreenExitIcon, VideoReplayIcon, BackToListIcon, FilmIcon,
  SoundOnIcon, SoundOffIcon // For global mute button consistency
} from '../constants';
import { audioManager } from '../AudioManager';
import { Button } from './ui/Button';
import { useVideoAvailability } from '../hooks/useVideoAvailability';

interface VideoPlayerScreenProps {
  onBackToMenu: () => void;
}

const formatTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({ onBackToMenu }) => {
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7); // Video element volume
  const [isVideoMuted, setIsVideoMuted] = useState(false); // Video element mute
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isGameFullScreen, setIsGameFullScreen] = useState(false); // Custom fullscreen within game container
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false); // True browser fullscreen
  const [showControls, setShowControls] = useState(true);
  const [isAppMuted, setIsAppMuted] = useState(audioManager.getIsMuted());
  const [videoError, setVideoError] = useState<string | null>(null); // State for video errors

  const videoStatus = useVideoAvailability(VIDEO_CATALOG);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioInitializedRef = useRef(false);

   const tryInitializeAudio = useCallback(async () => {
    if (!audioInitializedRef.current) {
      const success = await audioManager.initialize();
      if (success) {
        audioInitializedRef.current = true;
        await audioManager.preloadSounds([SoundEffect.UI_CLICK_GENERAL]); // Preload click for mute button
        console.log("Audio initialized for Video Player (for UI sounds).");
      }
    } else if (audioManager.getAudioContextState() === 'suspended') {
      await audioManager.initialize(); // Resume
    }
  }, []);


  useEffect(() => {
    audioManager.stopMusic(); // Stop any game background music
    tryInitializeAudio(); // Initialize audio for UI sounds (mute button)

    return () => {
      if (videoRef.current) {
        videoRef.current.pause(); // Ensure video is paused on unmount
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [tryInitializeAudio]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isVideoMuted;
    }
  }, [volume, isVideoMuted]);

  const handleVideoSelect = (video: VideoInfo) => {
    const mode = (import.meta as any).env?.MODE || 'development';
    console.log("📹 Selecting video:", {
      title: video.title,
      fileName: video.fileName,
      path: video.path,
      mode: mode,
      basePath: mode === 'production' ? '/ninjago' : ''
    });
    setCurrentVideo(video);
    setIsPlaying(false); // Start paused
    setCurrentTime(0);
    setDuration(0);
    setVideoError(null); // Clear previous errors
  };

  const handlePlayPause = () => {
    if (!videoRef.current || videoError) return; // Don't try to play if there's an error
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(error => {
        console.error("Error playing video:", error);
        setVideoError(`Could not play "${currentVideo?.title}". The file might be corrupted or in an unsupported format.`);
        setIsPlaying(false);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
    setIsVideoMuted(newVolume === 0);
  };

  const handleToggleMuteVideo = () => {
    if (videoRef.current) {
      if (isVideoMuted) {
        setIsVideoMuted(false);
        if (volume === 0) setVolume(0.5); // Restore to a default volume if it was 0
      } else {
        setIsVideoMuted(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current || videoError) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || videoError) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current || videoError) return;
    setDuration(videoRef.current.duration);
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleReplay = () => {
    if(videoRef.current && !videoError) {
      setVideoError(null); // Clear error on replay attempt
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => {
        console.error("Replay error", e);
        setVideoError(`Could not replay "${currentVideo?.title}". The file might be corrupted or in an unsupported format.`);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // More specific error based on video element's error object if available
    const videoElement = e.currentTarget;
    let errorMsg = `Error playing "${currentVideo?.title || 'this video'}".`;
    
    console.error("❌ Video Error:", {
      videoTitle: currentVideo?.title,
      videoPath: currentVideo?.path,
      fileName: currentVideo?.fileName,
      errorCode: videoElement.error?.code,
      errorMessage: videoElement.error?.message,
      src: videoElement.src,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState
    });
    
    if (videoElement.error) {
        switch (videoElement.error.code) {
            case videoElement.error.MEDIA_ERR_ABORTED:
                errorMsg += ' Playback aborted.';
                break;
            case videoElement.error.MEDIA_ERR_NETWORK:
                errorMsg += ' A network error occurred. Check if the file exists at: ' + currentVideo?.path;
                break;
            case videoElement.error.MEDIA_ERR_DECODE:
                errorMsg += ' Error decoding the video. File might be corrupted or unsupported format.';
                break;
            case videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg += ' Video format not supported or file not found at: ' + currentVideo?.path;
                break;
            default:
                errorMsg += ' An unknown error occurred.';
        }
    } else {
       errorMsg += ' The file might be missing, corrupted, or in an unsupported format. Path: ' + currentVideo?.path;
    }
    setVideoError(errorMsg);
    setIsPlaying(false);
    setShowControls(true); // Ensure controls are visible to show error and back button
  };

  const toggleGameFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Entrar en pantalla completa del navegador
        if (playerContainerRef.current?.requestFullscreen) {
          await playerContainerRef.current.requestFullscreen();
        }
      } else {
        // Salir de pantalla completa del navegador
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Fallback: usar solo el modo "fullscreen" dentro del juego
      setIsGameFullScreen(!isGameFullScreen);
    }
  };

  // Escuchar cambios de pantalla completa del navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsBrowserFullScreen(isCurrentlyFullscreen);
      if (isCurrentlyFullscreen) {
        setIsGameFullScreen(true);
      } else {
        setIsGameFullScreen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (isBrowserFullScreen || isGameFullScreen)) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        } else {
          setIsGameFullScreen(false);
        }
      }
      // Barra espaciadora para play/pause
      if (event.key === ' ' && currentVideo) {
        event.preventDefault();
        handlePlayPause();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isBrowserFullScreen, isGameFullScreen, currentVideo, handlePlayPause]);

  const handleBackToList = async () => {
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);
    setCurrentVideo(null);
    setIsGameFullScreen(false);
    setVideoError(null); // Clear errors when going back
    
    // Salir de pantalla completa si está activa
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error('Error exiting fullscreen:', error);
      }
    }
  };
  
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !videoError) { // Don't hide controls if there's an error
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleToggleAppMute = useCallback(async () => {
    if(!audioInitializedRef.current) await tryInitializeAudio();
    const newMuteState = audioManager.toggleMute();
    setIsAppMuted(newMuteState);
    audioManager.playSound(SoundEffect.UI_CLICK_GENERAL, 0.5);
  }, [tryInitializeAudio]);


  if (!currentVideo) {
    return (
      <div 
        className="flex flex-col w-full bg-slate-800 text-white"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* Header fijo */}
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-600 flex-shrink-0">
          <h1 className="text-3xl font-bold text-sky-400">Ninja Video Archives</h1>
          <Button onClick={onBackToMenu} variant="secondary">Back to Menu</Button>
        </div>
        
        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4">
          {VIDEO_CATALOG.length === 0 && (
            <p className="text-center text-slate-400 text-lg mt-8">
              No videos found in the catalog. Please add videos to 
              <code className="bg-slate-700 px-1 rounded mx-1">public/videos/</code> 
              and update <code className="bg-slate-700 px-1 rounded mx-1">VIDEO_CATALOG</code> in 
              <code className="bg-slate-700 px-1 rounded mx-1">src/constants.tsx</code>.
            </p>
          )}
          
          {/* Lista de videos con scroll personalizado */}
          <div className="space-y-3 max-h-full pr-2 custom-scrollbar">
            {VIDEO_CATALOG.map(video => {
              const status = videoStatus[video.id];
              const isAvailable = status?.available ?? false;
              const isLoading = status?.loading ?? true;
              const error = status?.error;
              const size = status?.size;
              
              return (
              <div 
                key={video.id} 
                className={`bg-slate-700 p-4 rounded-lg transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  isAvailable ? 'hover:bg-slate-600' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => isAvailable && handleVideoSelect(video)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && isAvailable) handleVideoSelect(video);}}
                aria-label={`Play video: ${video.title}${isAvailable ? '' : ' (unavailable)'}`}
              >
                <div className="flex items-center space-x-3">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded"/>
                  ) : (
                    <div className="w-24 h-16 bg-slate-500 rounded flex items-center justify-center flex-shrink-0">
                      <FilmIcon size={32} className="text-slate-400"/>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-sky-300 truncate">{video.title}</h2>
                      {isLoading && <span className="text-yellow-400">⏳</span>}
                      {!isLoading && isAvailable && <span className="text-green-400">✅</span>}
                      {!isLoading && !isAvailable && <span className="text-red-400">❌</span>}
                    </div>
                    {video.description && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2 overflow-hidden">{video.description}</p>
                    )}
                    {/* Status and debug info */}
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      <div className="truncate">📁 File: {video.fileName}</div>
                      <div className="truncate">🔗 Path: {video.path}</div>
                      {size && (
                        <div className="text-green-400">📦 Size: {(size / 1024 / 1024).toFixed(1)}MB</div>
                      )}
                      {error && (
                        <div className="text-red-400">⚠️ {error}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
        
        {/* Estilo CSS para scroll personalizado */}
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgb(51, 65, 85);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgb(71, 85, 105);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgb(100, 116, 139);
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }

  // Video Player View
  return (
    <div 
      ref={playerContainerRef}
      className={`relative flex flex-col items-center justify-center bg-black text-white transition-all duration-300 ease-in-out ${
        isBrowserFullScreen 
          ? 'fixed inset-0 z-50 w-screen h-screen' 
          : isGameFullScreen 
            ? 'fixed inset-0 z-50 w-screen h-screen' 
            : 'w-full h-full'
      }`}
      style={!isGameFullScreen && !isBrowserFullScreen ? {width: GAME_WIDTH, height: GAME_HEIGHT} : {}}
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)} 
    >
      <video
        ref={videoRef}
        src={currentVideo.path}
        className="max-w-full max-h-full object-contain"
        style={{ 
          width: '100%', 
          height: isBrowserFullScreen || isGameFullScreen ? 'calc(100vh - 60px)' : 'calc(100% - 60px)' 
        }} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleVideoEnded}
        onPlay={() => { if(!videoError) setIsPlaying(true);}}
        onPause={() => setIsPlaying(false)}
        onClick={handlePlayPause} 
        onError={handleVideoError} // Add error handler
      >
        Your browser does not support the video tag.
      </video>

      {videoError && (
        <div className="absolute inset-0 bg-black bg-opacity-85 flex flex-col items-center justify-center text-red-400 p-4 z-20 text-center">
          <p className="text-lg font-semibold mb-2">Video Playback Error</p>
          <p className="text-sm mb-4">{videoError}</p>
          <Button onClick={handleBackToList} variant="secondary">
            Back to Video List
          </Button>
        </div>
      )}

      {/* Custom Controls Overlay - Conditionally render or hide if videoError */}
      {!videoError && (
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-2 sm:p-3 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ zIndex: 10 }}
        >
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            aria-label="Video seek bar"
          />
          <div className="flex items-center justify-between text-xs sm:text-sm mt-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button onClick={handlePlayPause} className="text-white hover:text-sky-400 p-1" aria-label={isPlaying ? "Pause video" : "Play video"}>
                {isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
              </button>
              <button onClick={handleReplay} className="text-white hover:text-sky-400 p-1" aria-label="Replay video">
                  <VideoReplayIcon size={24} />
              </button>
              <button onClick={handleToggleMuteVideo} className="text-white hover:text-sky-400 p-1" aria-label={isVideoMuted ? "Unmute video" : "Mute video"}>
                {isVideoMuted || volume === 0 ? <VolumeOffIcon size={24} /> : <VolumeUpIcon size={24} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isVideoMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-500"
                aria-label="Volume control"
              />
            </div>

            <div className="text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                  onClick={handleToggleAppMute}
                  className="p-1 text-white hover:text-sky-400"
                  aria-label={isAppMuted ? "Unmute Game Sounds" : "Mute Game Sounds"}
              >
                  {isAppMuted ? <SoundOffIcon size={20} /> : <SoundOnIcon size={20} />}
              </button>
              <button onClick={toggleGameFullScreen} className="text-white hover:text-sky-400 p-1" aria-label={isBrowserFullScreen || isGameFullScreen ? "Exit fullscreen" : "Enter fullscreen"}>
                {isBrowserFullScreen || isGameFullScreen ? <FullscreenExitIcon size={24} /> : <FullscreenEnterIcon size={24} />}
              </button>
              <button onClick={handleBackToList} className="text-white hover:text-sky-400 p-1" aria-label="Back to video list">
                <BackToListIcon size={24}/>
              </button>
            </div>
          </div>
        </div>
      )}
       
      {currentVideo && !videoError && (showControls || !isPlaying) && (
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 via-black/40 to-transparent pointer-events-none transition-opacity duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-white truncate">{currentVideo.title}</h2>
              {(isBrowserFullScreen || isGameFullScreen) && (
                <span className="text-xs bg-black/50 px-2 py-1 rounded text-white">
                  Pantalla Completa • ESC para salir
                </span>
              )}
            </div>
        </div>
      )}
    </div>
  );
};
