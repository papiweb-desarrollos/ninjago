import { useState, useEffect } from 'react';
import { VideoInfo } from '../types';

interface VideoStatus {
  [videoId: string]: {
    available: boolean;
    loading: boolean;
    error?: string;
    size?: number;
  };
}

export const useVideoAvailability = (videos: VideoInfo[]) => {
  const [videoStatus, setVideoStatus] = useState<VideoStatus>({});

  useEffect(() => {
    // Initialize all videos as loading
    const initialStatus: VideoStatus = {};
    videos.forEach(video => {
      initialStatus[video.id] = {
        available: false,
        loading: true
      };
    });
    setVideoStatus(initialStatus);

    // Check each video
    const checkVideo = async (video: VideoInfo) => {
      try {
        console.log(`🔍 Checking video availability: ${video.title} at ${video.path}`);
        
        // Use HEAD request to check if file exists without downloading
        const response = await fetch(video.path, { 
          method: 'HEAD',
          cache: 'no-cache'
        });

        const isAvailable = response.ok;
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : undefined;

        // Verificar si es un archivo Git LFS no descargado (muy pequeño)
        const isGitLFSPointer = size && size < 1000;

        console.log(`${isAvailable ? '✅' : '❌'} ${video.title}: ${response.status} ${response.statusText}${size ? ` (${(size / 1024 / 1024).toFixed(1)}MB)` : ''}`);

        setVideoStatus(prev => ({
          ...prev,
          [video.id]: {
            available: isAvailable && !isGitLFSPointer,
            loading: false,
            error: !isAvailable ? `HTTP ${response.status}: ${response.statusText}` : 
                   isGitLFSPointer ? 'Git LFS pointer - ejecuta "git lfs pull" para descargar' : undefined,
            size
          }
        }));
      } catch (error) {
        console.error(`❌ ${video.title}: Network error`, error);
        
        setVideoStatus(prev => ({
          ...prev,
          [video.id]: {
            available: false,
            loading: false,
            error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }));
      }
    };

    // Check all videos with a small delay between requests
    videos.forEach((video, index) => {
      setTimeout(() => checkVideo(video), index * 100);
    });
  }, [videos]);

  return videoStatus;
};
