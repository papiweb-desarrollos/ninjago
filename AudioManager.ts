import { SoundEffect } from './types';
import { SOUND_FILES } from './constants';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private soundCache: Map<SoundEffect, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private globalVolume: number = 0.7; // Default volume (0.0 to 1.0)
  private masterGainNode: GainNode | null = null;
  private isInitialized: boolean = false;

  private musicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private currentMusicEffect: SoundEffect | null = null;

  constructor() {
    // AudioContext should be created/resumed after a user gesture.
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized && this.audioContext) {
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log("AudioContext resumed successfully.");
                this.isInitialized = true; // Ensure this is set
                return true;
            } catch (e) {
                console.error("Error resuming AudioContext:", e);
                return false;
            }
        }
        return true; 
    }

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.globalVolume, this.audioContext.currentTime);
      this.masterGainNode.connect(this.audioContext.destination);
      this.isInitialized = true;
      console.log("AudioContext initialized successfully.");
      return true;
    } catch (e) {
      console.error("Error initializing AudioContext:", e);
      this.isInitialized = false;
      return false;
    }
  }
  
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getAudioContextState(): AudioContextState | null {
    return this.audioContext ? this.audioContext.state : null;
  }

  public async loadSound(effect: SoundEffect, filePath?: string): Promise<AudioBuffer | null> {
    if (!this.audioContext) {
      console.warn("AudioContext not initialized. Cannot load sound:", effect);
      // Attempt to initialize if not already tried, or if it failed before
      if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success || !this.audioContext) {
          console.error("Failed to initialize AudioContext during loadSound.");
          return null;
        }
      } else if (!this.audioContext) { // isInitialized but no context somehow (should not happen)
        return null;
      }
    }
    const path = filePath || SOUND_FILES[effect];
    if (!path) {
        console.error(`Sound path for ${effect} not found.`);
        return null;
    }

    if (this.soundCache.has(effect)) {
      return this.soundCache.get(effect)!;
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch sound ${effect}: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(effect, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Error loading sound ${effect} from ${path}:`, error);
      return null;
    }
  }

  public async preloadSounds(effects: SoundEffect[]): Promise<void> {
    if (!this.isInitialized && !this.audioContext) {
        const success = await this.initialize();
        if(!success) {
            console.warn("Audio Manager could not be initialized. Preloading sounds aborted.");
            return;
        }
    }
    if (!this.audioContext) { // Still not initialized after attempt
        console.warn("AudioContext not available for preloading sounds.");
        return;
    }

    const loadPromises = effects.map(effect => this.loadSound(effect));
    await Promise.all(loadPromises);
    console.log("Requested sounds preloaded/verified.");
  }

  public playSound(effect: SoundEffect, volume: number = 1.0, loop: boolean = false): AudioBufferSourceNode | null {
    if (!this.audioContext || !this.masterGainNode || (this.isMuted && !loop)) { // Allow music to be "playing" but silent if muted
      // console.warn("AudioContext not ready or muted. Cannot play sound:", effect);
      return null;
    }

    const audioBuffer = this.soundCache.get(effect);
    if (!audioBuffer) {
      console.warn(`Sound ${effect} not loaded. Attempting to load and play.`);
      this.loadSound(effect).then(buffer => {
          if (buffer) this.playSound(effect, volume, loop); // Retry once loaded
      });
      return null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    // For non-looping sounds, if muted, effectively play at 0 volume before masterGain handles it completely.
    // For looping sounds (music), we want them to continue "playing" so they can be unmuted.
    const effectiveVolume = (this.isMuted && !loop) ? 0 : volume * this.globalVolume;
    gainNode.gain.setValueAtTime(effectiveVolume, this.audioContext.currentTime);
    
    source.connect(gainNode);
    gainNode.connect(this.masterGainNode); // Always connect to masterGainNode
    
    source.start();
    return source;
  }

  public playMusic(effect: SoundEffect, volume: number = 0.3): void {
    if (!this.audioContext || !this.masterGainNode) {
        console.warn("AudioContext not ready for music.");
        // Attempt to load and then play if context becomes available
        this.loadSound(effect).then(buffer => {
            if (buffer && this.audioContext && this.masterGainNode) {
                this.playMusic(effect, volume);
            }
        });
        return;
    }
    if (this.currentMusicEffect === effect && this.musicSource) {
        // If it's the same music and source exists, ensure it's playing (e.g., after mute/unmute)
        // This logic can be more complex if needing to resume, for now, just avoids double play.
        return;
    }

    this.stopMusic(); 

    const audioBuffer = this.soundCache.get(effect);
    if (!audioBuffer) {
        console.warn(`Music ${effect} not loaded. Attempting to load and play.`);
        this.loadSound(effect).then(buffer => {
            if (buffer) this.playMusic(effect, volume); 
        });
        return;
    }

    this.musicSource = this.audioContext.createBufferSource();
    this.musicSource.buffer = audioBuffer;
    this.musicSource.loop = true;

    this.musicGainNode = this.audioContext.createGain();
    // Music volume is independent of global effect volume but is affected by master mute/volume
    this.musicGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime); 

    this.musicSource.connect(this.musicGainNode);
    this.musicGainNode.connect(this.masterGainNode); // Music also goes through master gain
    this.musicSource.start();
    this.currentMusicEffect = effect;
    console.log(`Playing music: ${effect}`);
  }

  public stopMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // console.warn("Error stopping music source (already stopped or not started):", e);
      }
      this.musicSource.disconnect();
      this.musicSource = null;
    }
    if (this.musicGainNode) {
      this.musicGainNode.disconnect();
      this.musicGainNode = null;
    }
    this.currentMusicEffect = null;
    // console.log("Music stopped.");
  }


  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGainNode && this.audioContext) {
      // Master gain controls overall mute/unmute state
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.globalVolume, this.audioContext.currentTime);
    }
    console.log(this.isMuted ? "Audio Muted" : "Audio Unmuted");
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume)); 
    if (this.masterGainNode && this.audioContext && !this.isMuted) {
      this.masterGainNode.gain.setValueAtTime(this.globalVolume, this.audioContext.currentTime);
    }
    // If music has its own gain node, and its volume was set considering globalVolume,
    // changing globalVolume via masterGainNode is sufficient.
    // If music volume should be independent of effects global volume, musicGainNode needs direct adjustment here.
    // For now, masterGainNode handles the scaling for all connected nodes.
  }
}

export const audioManager = new AudioManager();