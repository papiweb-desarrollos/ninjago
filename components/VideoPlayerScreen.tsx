import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoInfo, SoundEffect } from '../types';
import { 
  VIDEO_CATALOG, GAME_WIDTH, GAME_HEIGHT, 
  PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, FullscreenEnterIcon, FullscreenExitIcon, VideoReplayIcon, BackToListIcon, FilmIcon,
  SoundOnIcon, SoundOffIcon // For global mute button consistency
} from '../constants';
import { audioManager } from '../AudioManager';
import { Button } from './ui/Button';

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
  const [showControls, setShowControls] = useState(true);
  const [isAppMuted, setIsAppMuted] = useState(audioManager.getIsMuted());
  const [videoError, setVideoError] = useState<string | null>(null); // State for video errors

  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
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
    if (videoElement.error) {
        switch (videoElement.error.code) {
            case videoElement.error.MEDIA_ERR_ABORTED:
                errorMsg += ' Playback aborted.';
                break;
            case videoElement.error.MEDIA_ERR_NETWORK:
                errorMsg += ' A network error occurred.';
                break;
            case videoElement.error.MEDIA_ERR_DECODE:
                errorMsg += ' Error decoding the video. File might be corrupted or unsupported format.';
                break;
            case videoElement.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg += ' Video format not supported or file not found.';
                break;
            default:
                errorMsg += ' An unknown error occurred.';
        }
    } else {
       errorMsg += ' The file might be missing, corrupted, or in an unsupported format.';
    }
    setVideoError(errorMsg);
    setIsPlaying(false);
    setShowControls(true); // Ensure controls are visible to show error and back button
  };

  const toggleGameFullScreen = () => {
    setIsGameFullScreen(!isGameFullScreen);
  };

  const handleBackToList = () => {
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);
    setCurrentVideo(null);
    setIsGameFullScreen(false); 
    setVideoError(null); // Clear errors when going back
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
      <div className="flex flex-col h-full w-full bg-slate-800 text-white p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-sky-400">Ninja Video Archives</h1>
          <Button onClick={onBackToMenu} variant="secondary">Back to Menu</Button>
        </div>
        {VIDEO_CATALOG.length === 0 && (
          <p className="text-center text-slate-400 text-lg mt-8">
            No videos found in the catalog. Please add videos to 
            <code className="bg-slate-700 px-1 rounded mx-1">public/videos/</code> 
            and update <code className="bg-slate-700 px-1 rounded mx-1">VIDEO_CATALOG</code> in 
            <code className="bg-slate-700 px-1 rounded mx-1">src/constants.tsx</code>.
          </p>
        )}
        <ul className="space-y-3">
          {VIDEO_CATALOG.map(video => (
            <li key={video.id} 
                className="bg-slate-700 p-4 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer shadow-md"
                onClick={() => handleVideoSelect(video)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleVideoSelect(video);}}
                aria-label={`Play video: ${video.title}`}
            >
              <div className="flex items-center space-x-3">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-24 h-16 object-cover rounded"/>
                ) : (
                  <div className="w-24 h-16 bg-slate-500 rounded flex items-center justify-center">
                    <FilmIcon size={32} className="text-slate-400"/>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-sky-300">{video.title}</h2>
                  {video.description && <p className="text-sm text-slate-400 mt-1">{video.description}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Video Player View
  return (
    <div 
      ref={playerContainerRef}
      className={`relative flex flex-col items-center justify-center bg-black text-white transition-all duration-300 ease-in-out ${isGameFullScreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'w-full h-full'}`}
      style={!isGameFullScreen ? {width: GAME_WIDTH, height: GAME_HEIGHT} : {}}
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)} 
    >
      <video
        ref={videoRef}
        src={currentVideo.path}
        className="max-w-full max-h-full object-contain"
        style={{ width: '100%', height: isGameFullScreen ? 'calc(100% - 60px)' : 'calc(100% - 60px)' }} 
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
              <button onClick={toggleGameFullScreen} className="text-white hover:text-sky-400 p-1" aria-label={isGameFullScreen ? "Exit fullscreen" : "Enter fullscreen"}>
                {isGameFullScreen ? <FullscreenExitIcon size={24} /> : <FullscreenEnterIcon size={24} />}
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
            <h2 className="text-lg sm:text-xl font-semibold text-white truncate">{currentVideo.title}</h2>
        </div>
      )}
    </div>
  );
};
