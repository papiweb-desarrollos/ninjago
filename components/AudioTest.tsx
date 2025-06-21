import React, { useState, useEffect } from 'react';
import { audioManager } from '../AudioManager';
import { SoundEffect } from '../types';
import { Button } from './ui/Button';

interface AudioTestProps {
  onClose: () => void;
}

export const AudioTest: React.FC<AudioTestProps> = ({ onClose }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [currentlyTesting, setCurrentlyTesting] = useState<string>('');

  useEffect(() => {
    initializeAudio();
  }, []);

  const initializeAudio = async () => {
    const success = await audioManager.initialize();
    setIsInitialized(success);
    if (success) {
      console.log('AudioManager initialized successfully');
    } else {
      console.error('Failed to initialize AudioManager');
    }
  };

  const testSound = async (effect: SoundEffect, name: string) => {
    setCurrentlyTesting(name);
    try {
      await audioManager.playSound(effect, 0.5);
      setTestResults(prev => ({ ...prev, [name]: true }));
      console.log(`✅ ${name} played successfully`);
    } catch (error) {
      setTestResults(prev => ({ ...prev, [name]: false }));
      console.error(`❌ Failed to play ${name}:`, error);
    }
    setCurrentlyTesting('');
  };

  const testAllSounds = async () => {
    const sounds = [
      { effect: SoundEffect.UI_CLICK_GENERAL, name: 'UI Click' },
      { effect: SoundEffect.PLAYER_SHURIKEN_THROW, name: 'Shuriken Throw' },
      { effect: SoundEffect.PROJECTILE_HIT_ROBOT, name: 'Hit Robot' },
      { effect: SoundEffect.ROBOT_DEFEATED, name: 'Robot Defeated' },
      { effect: SoundEffect.SCORE_ORB_COLLECT, name: 'Score Orb' },
    ];

    for (const sound of sounds) {
      await testSound(sound.effect, sound.name);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">🔊 Audio Test</h2>
        
        <div className="mb-4">
          <p className="text-slate-300 mb-2">
            AudioManager Status: {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
          </p>
          <p className="text-slate-300 mb-4">
            Context State: {audioManager.getAudioContextState() || 'Unknown'}
          </p>
        </div>

        {!isInitialized && (
          <Button 
            onClick={initializeAudio}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-500"
          >
            Initialize Audio
          </Button>
        )}

        {isInitialized && (
          <>
            <div className="space-y-2 mb-4">
              <Button 
                onClick={() => testSound(SoundEffect.UI_CLICK_GENERAL, 'UI Click')}
                className="w-full bg-green-600 hover:bg-green-500"
                disabled={currentlyTesting === 'UI Click'}
              >
                {currentlyTesting === 'UI Click' ? 'Testing...' : 'Test UI Click'}
                {testResults['UI Click'] !== undefined && (
                  <span className="ml-2">{testResults['UI Click'] ? '✅' : '❌'}</span>
                )}
              </Button>

              <Button 
                onClick={() => testSound(SoundEffect.PLAYER_SHURIKEN_THROW, 'Shuriken')}
                className="w-full bg-purple-600 hover:bg-purple-500"
                disabled={currentlyTesting === 'Shuriken'}
              >
                {currentlyTesting === 'Shuriken' ? 'Testing...' : 'Test Shuriken'}
                {testResults['Shuriken'] !== undefined && (
                  <span className="ml-2">{testResults['Shuriken'] ? '✅' : '❌'}</span>
                )}
              </Button>

              <Button 
                onClick={() => testSound(SoundEffect.PROJECTILE_HIT_ROBOT, 'Hit Effect')}
                className="w-full bg-red-600 hover:bg-red-500"
                disabled={currentlyTesting === 'Hit Effect'}
              >
                {currentlyTesting === 'Hit Effect' ? 'Testing...' : 'Test Hit Effect'}
                {testResults['Hit Effect'] !== undefined && (
                  <span className="ml-2">{testResults['Hit Effect'] ? '✅' : '❌'}</span>
                )}
              </Button>

              <Button 
                onClick={testAllSounds}
                className="w-full bg-orange-600 hover:bg-orange-500"
                disabled={currentlyTesting !== ''}
              >
                {currentlyTesting ? `Testing ${currentlyTesting}...` : 'Test All Sounds'}
              </Button>
            </div>

            <div className="mb-4">
              <Button 
                onClick={() => audioManager.toggleMute()}
                className="w-full bg-yellow-600 hover:bg-yellow-500"
              >
                {audioManager.getIsMuted() ? 'Unmute' : 'Mute'} Audio
              </Button>
            </div>
          </>
        )}

        <Button 
          onClick={onClose}
          className="w-full bg-slate-600 hover:bg-slate-500"
        >
          Close Test
        </Button>
      </div>
    </div>
  );
};