import type Phaser from 'phaser';

export interface AudioManagerConfig {
  calmVolume: number;
  festivalVolume: number;
  fadeDurationMs: number;
  musicAssetKey: string;
  musicAssetPath: string;
  storageMuteKey: string;
}

export const DEFAULT_AUDIO_CONFIG: AudioManagerConfig = {
  calmVolume: 0.18,
  festivalVolume: 0.25,
  fadeDurationMs: 800,
  musicAssetKey: 'modak_mahal_theme',
  musicAssetPath: 'assets/audio/modak-mahal-theme.mp3',
  storageMuteKey: 'modak_mahal_audio_muted'
};

export type AudioPhase = 'calm' | 'festival' | 'victory' | 'defeat';

export type GameSfx =
  | 'purchase'
  | 'load'
  | 'ready'
  | 'pack'
  | 'sale'
  | 'upgrade'
  | 'dispatch'
  | 'error';

interface SfxTone {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  wave: OscillatorType;
}

/** Small, offline-only feedback sounds. None are audio files or network requests. */
export const GAME_SFX: Record<GameSfx, SfxTone[]> = {
  purchase: [{ frequency: 659.25, start: 0, duration: 0.11, gain: 0.07, wave: 'triangle' }],
  load: [{ frequency: 196, start: 0, duration: 0.09, gain: 0.06, wave: 'triangle' }],
  ready: [
    { frequency: 783.99, start: 0, duration: 0.15, gain: 0.075, wave: 'sine' },
    { frequency: 1046.5, start: 0.09, duration: 0.22, gain: 0.08, wave: 'sine' }
  ],
  pack: [
    { frequency: 330, start: 0, duration: 0.07, gain: 0.055, wave: 'square' },
    { frequency: 440, start: 0.06, duration: 0.09, gain: 0.045, wave: 'triangle' }
  ],
  sale: [
    { frequency: 987.77, start: 0, duration: 0.09, gain: 0.075, wave: 'triangle' },
    { frequency: 1318.51, start: 0.08, duration: 0.16, gain: 0.08, wave: 'triangle' }
  ],
  upgrade: [
    { frequency: 523.25, start: 0, duration: 0.10, gain: 0.07, wave: 'triangle' },
    { frequency: 659.25, start: 0.08, duration: 0.12, gain: 0.08, wave: 'triangle' },
    { frequency: 783.99, start: 0.18, duration: 0.18, gain: 0.09, wave: 'triangle' }
  ],
  dispatch: [
    { frequency: 392, start: 0, duration: 0.10, gain: 0.07, wave: 'triangle' },
    { frequency: 587.33, start: 0.08, duration: 0.16, gain: 0.08, wave: 'triangle' }
  ],
  error: [{ frequency: 155.56, start: 0, duration: 0.12, gain: 0.045, wave: 'sine' }]
};

export const GAME_SFX_COOLDOWNS_MS: Record<GameSfx, number> = {
  purchase: 180,
  load: 160,
  ready: 750,
  pack: 250,
  sale: 350,
  upgrade: 400,
  dispatch: 350,
  error: 500
};

/**
 * Procedural Web Audio victory chime.
 * Generates a short, non-looping 4-note festive bell arpeggio (G5, C6, E6, G6)
 * without requiring any downloaded assets or external network calls (0 bytes).
 */
export function playSynthesizedVictoryChime(customContext?: AudioContext | null): boolean {
  let ctx: AudioContext | null = customContext || null;
  if (!ctx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      try {
        ctx = new AudioCtx();
      } catch {
        return false;
      }
    }
  }

  if (!ctx) return false;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Festive Indian bell arpeggio: G5 (783.99Hz), C6 (1046.50Hz), E6 (1318.51Hz), G6 (1567.98Hz)
    const notes = [
      { freq: 783.99,  start: 0.00, dur: 0.35, gain: 0.14 },
      { freq: 1046.50, start: 0.10, dur: 0.40, gain: 0.16 },
      { freq: 1318.51, start: 0.22, dur: 0.45, gain: 0.15 },
      { freq: 1567.98, start: 0.36, dur: 0.70, gain: 0.18 }
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      // Bell envelope: sharp attack, gentle exponential decay
      gain.gain.setValueAtTime(0.0001, now + note.start);
      gain.gain.exponentialRampToValueAtTime(note.gain, now + note.start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Responsive, mobile-safe AudioManager for Modak Mahal.
 * - Never loads audio during BootScene / initial page load
 * - Loads music lazily upon the player's first explicit interaction
 * - Loops seamlessly at calm 18% default volume
 * - Smoothly fades to 25% over 800ms when festival timer starts after first sale
 * - Synchronizes immediately with game pause / resume
 * - Fades appropriately on victory and defeat
 * - Synthesizes 0-byte local victory chime
 * - Manages persistent mute toggle in localStorage
 */
export class AudioManager {
  public config: AudioManagerConfig;
  public isMuted = false;
  public isLoaded = false;
  public isLoading = false;
  public isError = false;
  public lastError = '';
  public phase: AudioPhase = 'calm';
  public targetVolume: number;

  private scene: Phaser.Scene | null = null;
  private themeSound: Phaser.Sound.BaseSound | null = null;
  private volumeTween: Phaser.Tweens.Tween | null = null;
  private listeners: Array<(muted: boolean) => void> = [];
  private sfxLastPlayedAt = new Map<GameSfx, number>();

  constructor(customConfig?: Partial<AudioManagerConfig>) {
    this.config = { ...DEFAULT_AUDIO_CONFIG, ...customConfig };
    this.targetVolume = this.config.calmVolume;
    this.initMuteState();
  }

  private initMuteState() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.config.storageMuteKey);
        if (stored !== null) {
          this.isMuted = stored === 'true';
        } else {
          // Default to unmuted unless browser policy blocks it
          this.isMuted = false;
        }
      } catch {
        this.isMuted = false;
      }
    }
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.isMuted);
    }
  }

  public init(scene: Phaser.Scene) {
    this.scene = scene;

    // Synchronize Phaser sound manager mute state
    if (this.scene.sound) {
      this.scene.sound.mute = this.isMuted;
    }

    // Attach first-interaction listeners if not already loaded or loading
    if (!this.isLoaded && !this.isLoading) {
      this.setupInteractionListeners();
    }
  }

  public setupInteractionListeners() {
    if (!this.scene) return;

    const trigger = () => {
      this.onFirstInteraction('user_gesture');
    };

    // Keyboard first interaction
    this.scene.input?.keyboard?.once('keydown', trigger);

    // Pointer / touch first interaction
    this.scene.input?.once('pointerdown', trigger);

    // Window level fallbacks
    if (typeof window !== 'undefined') {
      const windowTrigger = () => {
        window.removeEventListener('keydown', windowTrigger);
        window.removeEventListener('pointerdown', windowTrigger);
        window.removeEventListener('touchstart', windowTrigger);
        trigger();
      };
      window.addEventListener('keydown', windowTrigger, { once: true, passive: true });
      window.addEventListener('pointerdown', windowTrigger, { once: true, passive: true });
      window.addEventListener('touchstart', windowTrigger, { once: true, passive: true });
    }
  }

  /**
   * Called on player's first explicit interaction:
   * Play button on station tour, first keydown, first touch, or first game action.
   */
  public onFirstInteraction(_source = 'interaction') {
    if (this.isLoaded || this.isLoading || !this.scene) return;
    this.isLoading = true;

    // Resume AudioContext if suspended by browser policy
    const soundMgr = this.scene.sound as unknown as { context?: AudioContext };
    if (soundMgr?.context && soundMgr.context.state === 'suspended') {
      soundMgr.context.resume().catch(() => {
        // Autoplay policy prevented resume; default to muted
        this.setMuted(true);
      });
    }

    // Check if sound is already in Phaser cache
    if (this.scene.cache.audio.exists(this.config.musicAssetKey)) {
      this.handleAudioReady();
      return;
    }

    // Lazily load the theme music via Phaser Loader
    try {
      this.scene.load.audio(this.config.musicAssetKey, this.config.musicAssetPath);

      const onFileComplete = (key: string) => {
        if (key === this.config.musicAssetKey) {
          this.scene?.load.off('filecomplete', onFileComplete);
          this.handleAudioReady();
        }
      };
      this.scene.load.on('filecomplete', onFileComplete);

      this.scene.load.once('loaderror', (file: { key: string; src?: string }) => {
        if (file?.key === this.config.musicAssetKey) {
          this.isLoading = false;
          this.isError = true;
          this.lastError = `loaderror for ${file.key}, src: ${file.src || 'unknown'}`;
          console.error('AudioManager loaderror:', file);
        }
      });

      if (!this.scene.load.isLoading()) {
        this.scene.load.start();
      }
    } catch (err) {
      this.isLoading = false;
      this.isError = true;
      this.lastError = `catch: ${String(err)}`;
      console.error('AudioManager catch:', err);
    }
  }

  /**
   * Plays one short procedural feedback cue after the same explicit-interaction
   * gate as music. A per-cue cooldown prevents station stay-loops from stacking
   * duplicate oscillators.
   */
  public playEffect(effect: GameSfx, now = Date.now()): boolean {
    if (!this.isLoaded || this.isMuted || !this.scene || this.phase === 'defeat') return false;

    const lastPlayedAt = this.sfxLastPlayedAt.get(effect) ?? -Infinity;
    if (now - lastPlayedAt < GAME_SFX_COOLDOWNS_MS[effect]) return false;

    const context = (this.scene.sound as unknown as { context?: AudioContext })?.context;
    if (!context || context.state !== 'running') return false;

    try {
      const baseTime = context.currentTime;
      for (const tone of GAME_SFX[effect]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startTime = baseTime + tone.start;
        const endTime = startTime + tone.duration;

        oscillator.type = tone.wave;
        oscillator.frequency.setValueAtTime(tone.frequency, startTime);
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(tone.gain, startTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime);
      }
      this.sfxLastPlayedAt.set(effect, now);
      return true;
    } catch {
      return false;
    }
  }

  private handleAudioReady() {
    this.isLoading = false;
    this.isLoaded = true;

    if (!this.scene) return;

    try {
      if (!this.themeSound) {
        this.themeSound = this.scene.sound.add(this.config.musicAssetKey, {
          loop: true,
          volume: this.targetVolume
        });
      }

      // If phase has ended (victory/defeat), don't play
      if (this.phase === 'victory' || this.phase === 'defeat') return;

      // Start playing if not muted and scene is active
      if (!this.isMuted) {
        const soundWithState = this.themeSound as unknown as { isPlaying?: boolean; isPaused?: boolean; play: (config?: unknown) => void };
        if (!soundWithState.isPlaying) {
          try {
            soundWithState.play({
              loop: true,
              volume: this.targetVolume
            });
          } catch {
            // Autoplay policy blocked; default to muted
            this.setMuted(true);
          }
        }
      }
    } catch {
      this.isError = true;
    }
  }

  public toggleMute() {
    this.setMuted(!this.isMuted);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageMuteKey, String(muted));
      } catch {
        // Private browsing guard
      }
    }

    if (this.scene?.sound) {
      this.scene.sound.mute = muted;
    }

    if (this.themeSound) {
      const sound = this.themeSound as unknown as { isPlaying?: boolean; isPaused?: boolean; pause: () => void; resume: () => void; play: (config?: unknown) => void };
      if (muted) {
        if (sound.isPlaying) {
          sound.pause();
        }
      } else {
        // Unmuting
        if (this.phase !== 'victory' && this.phase !== 'defeat') {
          if (sound.isPaused) {
            sound.resume();
          } else if (!sound.isPlaying) {
            sound.play({ loop: true, volume: this.targetVolume });
          }
        }
      }
    } else if (!muted && !this.isLoaded && !this.isLoading) {
      // Unmuting before first interaction triggers load
      this.onFirstInteraction('unmute_toggle');
    }

    this.notify();
  }

  /**
   * Smoothly fades music from 18% to 25% over 800ms when festival opens after first sale.
   * Playback speed (rate) remains untouched (1.0).
   */
  public onFestivalStart() {
    this.phase = 'festival';
    this.targetVolume = this.config.festivalVolume;

    if (!this.themeSound || !this.scene) return;

    const sound = this.themeSound as unknown as { volume: number; isPlaying?: boolean };
    if (this.volumeTween) {
      this.volumeTween.stop();
      this.volumeTween = null;
    }

    if (sound.isPlaying && !this.isMuted) {
      this.volumeTween = this.scene.tweens.add({
        targets: sound,
        volume: this.config.festivalVolume,
        duration: this.config.fadeDurationMs,
        ease: 'Linear',
        onComplete: () => {
          this.volumeTween = null;
        }
      });
    } else {
      sound.volume = this.config.festivalVolume;
    }
  }

  /**
   * Immediately pauses music when game pauses.
   */
  public onPause() {
    if (!this.themeSound) return;
    const sound = this.themeSound as unknown as { isPlaying?: boolean; pause: () => void };
    if (sound.isPlaying) {
      sound.pause();
    }
  }

  /**
   * Resumes music when game resumes, if not muted.
   */
  public onResume() {
    if (!this.themeSound || this.isMuted) return;
    if (this.phase === 'victory' || this.phase === 'defeat') return;

    const sound = this.themeSound as unknown as { isPaused?: boolean; isPlaying?: boolean; resume: () => void; play: (config?: unknown) => void };
    if (sound.isPaused) {
      sound.resume();
    } else if (!sound.isPlaying) {
      sound.play({ loop: true, volume: this.targetVolume });
    }
  }

  /**
   * Stops/fades music on victory and triggers the local victory chime.
   */
  public onVictory() {
    this.phase = 'victory';
    if (this.volumeTween) {
      this.volumeTween.stop();
      this.volumeTween = null;
    }

    if (this.themeSound && this.scene) {
      const sound = this.themeSound as unknown as { volume: number; isPlaying?: boolean; stop: () => void };
      if (sound.isPlaying) {
        this.scene.tweens.add({
          targets: sound,
          volume: 0,
          duration: 600,
          ease: 'Linear',
          onComplete: () => {
            sound.stop();
          }
        });
      }
    }

    // Play local non-looping victory chime (0 bytes, offline synthesized)
    if (!this.isMuted) {
      const soundMgr = this.scene?.sound as unknown as { context?: AudioContext };
      playSynthesizedVictoryChime(soundMgr?.context);
    }
  }

  /**
   * Fades out music on defeat (time expired).
   */
  public onDefeat() {
    this.phase = 'defeat';
    if (this.volumeTween) {
      this.volumeTween.stop();
      this.volumeTween = null;
    }

    if (this.themeSound && this.scene) {
      const sound = this.themeSound as unknown as { volume: number; isPlaying?: boolean; stop: () => void };
      if (sound.isPlaying) {
        this.scene.tweens.add({
          targets: sound,
          volume: 0,
          duration: 800,
          ease: 'Linear',
          onComplete: () => {
            sound.stop();
          }
        });
      }
    }
  }

  /**
   * Resets audio manager state for Restart Festival.
   */
  public onRestart() {
    this.phase = 'calm';
    this.targetVolume = this.config.calmVolume;
    if (this.volumeTween) {
      this.volumeTween.stop();
      this.volumeTween = null;
    }

    if (this.themeSound) {
      const sound = this.themeSound as unknown as { volume: number; isPlaying?: boolean; stop: () => void; play: (config?: unknown) => void };
      sound.stop();
      sound.volume = this.config.calmVolume;
      if (!this.isMuted) {
        sound.play({ loop: true, volume: this.config.calmVolume });
      }
    }
    this.sfxLastPlayedAt.clear();
  }

  public getThemeSound(): Phaser.Sound.BaseSound | null {
    return this.themeSound;
  }
}

// Global singleton instance shared across scenes
export const audioManager = new AudioManager();
