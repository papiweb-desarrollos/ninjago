import React from 'react';
import { VideoInfo } from '../../types';

interface VideoStatus {
  [videoId: string]: {
    available: boolean;
    loading: boolean;
    error?: string;
    size?: number;
  };
}

interface VideoStatusIndicatorProps {
  video: VideoInfo;
  status?: {
    available: boolean;
    loading: boolean;
    error?: string;
    size?: number;
  };
  className?: string;
}

export const VideoStatusIndicator: React.FC<VideoStatusIndicatorProps> = ({ 
  video, 
  status,
  className = '' 
}) => {
  if (!status) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-gray-400">No verificado</span>
      </div>
    );
  }

  if (status.loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-sm text-yellow-400">Verificando...</span>
      </div>
    );
  }

  if (status.available) {
    const sizeText = status.size ? `(${(status.size / 1024 / 1024).toFixed(1)}MB)` : '';
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="text-sm text-green-400">Disponible {sizeText}</span>
      </div>
    );
  }

  const isGitLFS = status.error?.includes('Git LFS');
  const iconColor = isGitLFS ? 'text-blue-400' : 'text-red-400';
  const dotColor = isGitLFS ? 'bg-blue-400' : 'bg-red-400';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
      <div className="flex flex-col">
        <span className={`text-sm ${iconColor}`}>
          {isGitLFS ? '📦 Git LFS' : '❌ No disponible'}
        </span>
        {status.error && (
          <span className="text-xs text-gray-400">{status.error}</span>
        )}
      </div>
    </div>
  );
};

interface VideoListProps {
  videos: VideoInfo[];
  videoStatus: VideoStatus;
  onVideoSelect: (video: VideoInfo) => void;
  selectedVideoId?: string;
}

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  videoStatus,
  onVideoSelect,
  selectedVideoId
}) => {
  const availableVideos = videos.filter(video => 
    videoStatus[video.id]?.available !== false
  );
  
  const unavailableVideos = videos.filter(video => 
    videoStatus[video.id]?.available === false
  );

  return (
    <div className="space-y-4">
      {availableVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-400 mb-3">
            🎬 Videos Disponibles ({availableVideos.length})
          </h3>
          <div className="space-y-2">
            {availableVideos.map(video => (
              <div
                key={video.id}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-200
                  ${selectedVideoId === video.id 
                    ? 'border-blue-500 bg-blue-900/20' 
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                  }
                `}
                onClick={() => onVideoSelect(video)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{video.title}</h4>
                    <p className="text-sm text-gray-400 mt-1">{video.description}</p>
                    <p className="text-xs text-gray-500 mt-1">📁 {video.fileName}</p>
                  </div>
                  <VideoStatusIndicator 
                    video={video} 
                    status={videoStatus[video.id]}
                    className="ml-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unavailableVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-400 mb-3">
            ❌ Videos No Disponibles ({unavailableVideos.length})
          </h3>
          <div className="space-y-2">
            {unavailableVideos.map(video => (
              <div
                key={video.id}
                className="p-3 rounded-lg border border-red-600/30 bg-red-900/10 opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-300">{video.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{video.description}</p>
                    <p className="text-xs text-gray-600 mt-1">📁 {video.fileName}</p>
                  </div>
                  <VideoStatusIndicator 
                    video={video} 
                    status={videoStatus[video.id]}
                    className="ml-3"
                  />
                </div>
              </div>
            ))}
          </div>
          
          {unavailableVideos.some(video => 
            videoStatus[video.id]?.error?.includes('Git LFS')
          ) && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <h4 className="font-medium text-blue-400 mb-2">💡 Para descargar videos de Git LFS:</h4>
              <code className="text-sm text-gray-300 bg-black/30 px-2 py-1 rounded">
                git lfs pull
              </code>
              <p className="text-xs text-gray-400 mt-2">
                Esto descargará los archivos de video originales desde Git LFS.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
