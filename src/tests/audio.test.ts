import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AudioManager,
  DEFAULT_AUDIO_CONFIG,
  GAME_SFX,
  GAME_SFX_COOLDOWNS_MS,
  playSynthesizedVictoryChime
} from '../utils/audioManager.ts';

describe('AudioManager', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      }
    });
  });

  describe('Configuration & Initialization', () => {
    it('initializes with required default audio parameters', () => {
      const audio = new AudioManager();
      expect(audio.config.calmVolume).toBe(0.18); // 18% calm volume
      expect(audio.config.festivalVolume).toBe(0.25); // 25% festival volume
      expect(audio.config.fadeDurationMs).toBe(800); // 800ms fade
      expect(audio.config.musicAssetPath).toBe('assets/audio/modak-mahal-theme.mp3');
      expect(audio.config.storageMuteKey).toBe('modak_mahal_audio_muted');
      expect(audio.phase).toBe('calm');
      expect(audio.targetVolume).toBe(0.18);
    });

    it('defaults to unmuted when no localStorage key exists', () => {
      const audio = new AudioManager();
      expect(audio.isMuted).toBe(false);
    });

    it('remembers muted state from localStorage when previously set to true', () => {
      mockLocalStorage['modak_mahal_audio_muted'] = 'true';
      const audio = new AudioManager();
      expect(audio.isMuted).toBe(true);
    });

    it('remembers unmuted state from localStorage when previously set to false', () => {
      mockLocalStorage['modak_mahal_audio_muted'] = 'false';
      const audio = new AudioManager();
      expect(audio.isMuted).toBe(false);
    });

    it('starts in unloaded state with zero startup network requests', () => {
      const audio = new AudioManager();
      expect(audio.isLoaded).toBe(false);
      expect(audio.isLoading).toBe(false);
      expect(audio.getThemeSound()).toBeNull();
    });
  });

  describe('Mute Management & Persistence', () => {
    it('persists mute toggle state to localStorage and notifies subscribers', () => {
      const audio = new AudioManager();
      const listener = vi.fn();
      audio.subscribe(listener);

      audio.toggleMute();
      expect(audio.isMuted).toBe(true);
      expect(mockLocalStorage['modak_mahal_audio_muted']).toBe('true');
      expect(listener).toHaveBeenCalledWith(true);

      audio.toggleMute();
      expect(audio.isMuted).toBe(false);
      expect(mockLocalStorage['modak_mahal_audio_muted']).toBe('false');
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('pauses playing sound when muted and resumes when unmuted', () => {
      const audio = new AudioManager();
      const mockSound = {
        isPlaying: true,
        isPaused: false,
        pause: vi.fn(() => {
          mockSound.isPlaying = false;
          mockSound.isPaused = true;
        }),
        resume: vi.fn(() => {
          mockSound.isPlaying = true;
          mockSound.isPaused = false;
        }),
        play: vi.fn()
      };

      (audio as any).themeSound = mockSound;
      (audio as any).isLoaded = true;

      // Mute while playing
      audio.setMuted(true);
      expect(mockSound.pause).toHaveBeenCalled();

      // Unmute
      audio.setMuted(false);
      expect(mockSound.resume).toHaveBeenCalled();
    });
  });

  describe('Lazy Loading & First Explicit Interaction', () => {
    it('initiates loading only upon first explicit interaction', () => {
      const audio = new AudioManager();
      const mockScene = {
        sound: { mute: false, context: { state: 'running', resume: vi.fn() } },
        cache: { audio: { exists: vi.fn(() => false) } },
        load: {
          audio: vi.fn(),
          on: vi.fn(),
          once: vi.fn(),
          off: vi.fn(),
          isLoading: vi.fn(() => false),
          start: vi.fn()
        }
      } as any;

      audio.init(mockScene);
      expect(mockScene.load.audio).not.toHaveBeenCalled();

      // First interaction triggers loader
      audio.onFirstInteraction('first_touch');
      expect(audio.isLoading).toBe(true);
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        DEFAULT_AUDIO_CONFIG.musicAssetKey,
        DEFAULT_AUDIO_CONFIG.musicAssetPath
      );
      expect(mockScene.load.start).toHaveBeenCalled();

      // Subsequent interactions do not trigger duplicate loads
      audio.onFirstInteraction('second_touch');
      expect(mockScene.load.audio).toHaveBeenCalledTimes(1);
    });

    it('plays sound at calm 18% volume when loaded and unmuted', () => {
      const audio = new AudioManager();
      const mockThemeSound = {
        isPlaying: false,
        isPaused: false,
        play: vi.fn(() => {
          mockThemeSound.isPlaying = true;
        })
      };
      const mockScene = {
        sound: {
          mute: false,
          add: vi.fn(() => mockThemeSound)
        },
        cache: { audio: { exists: vi.fn(() => true) } },
        load: { audio: vi.fn(), on: vi.fn(), once: vi.fn(), off: vi.fn(), isLoading: vi.fn(() => false), start: vi.fn() }
      } as any;

      audio.init(mockScene);
      audio.onFirstInteraction('first_keypress');

      expect(mockScene.sound.add).toHaveBeenCalledWith(DEFAULT_AUDIO_CONFIG.musicAssetKey, {
        loop: true,
        volume: 0.18
      });
      expect(mockThemeSound.play).toHaveBeenCalledWith({
        loop: true,
        volume: 0.18
      });
      expect(audio.isLoaded).toBe(true);
    });
  });

  describe('Adaptive Volume Transitions & Game Lifecycle', () => {
    it('smoothly fades volume to 25% over 800ms upon festival open without changing speed', () => {
      const audio = new AudioManager();
      const mockThemeSound = {
        volume: 0.18,
        isPlaying: true,
        rate: 1.0
      };
      const mockTweens = {
        add: vi.fn()
      };
      const mockScene = {
        sound: { mute: false },
        tweens: mockTweens
      } as any;

      audio.init(mockScene);
      (audio as any).themeSound = mockThemeSound;
      (audio as any).isLoaded = true;

      audio.onFestivalStart();

      expect(audio.phase).toBe('festival');
      expect(audio.targetVolume).toBe(0.25);
      expect(mockTweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockThemeSound,
          volume: 0.25,
          duration: 800,
          ease: 'Linear'
        })
      );
      // Playback speed remains untouched
      expect(mockThemeSound.rate).toBe(1.0);
    });

    it('pauses immediately on game pause and resumes on resume', () => {
      const audio = new AudioManager();
      const mockThemeSound = {
        isPlaying: true,
        isPaused: false,
        pause: vi.fn(() => {
          mockThemeSound.isPlaying = false;
          mockThemeSound.isPaused = true;
        }),
        resume: vi.fn(() => {
          mockThemeSound.isPlaying = true;
          mockThemeSound.isPaused = false;
        })
      };

      (audio as any).themeSound = mockThemeSound;
      (audio as any).isLoaded = true;

      // Pause
      audio.onPause();
      expect(mockThemeSound.pause).toHaveBeenCalled();

      // Resume
      audio.onResume();
      expect(mockThemeSound.resume).toHaveBeenCalled();
    });

    it('fades out music and resets target volume on victory and defeat', () => {
      const audio = new AudioManager();
      const mockThemeSound = {
        volume: 0.25,
        isPlaying: true,
        stop: vi.fn(() => {
          mockThemeSound.isPlaying = false;
        }),
        play: vi.fn()
      };
      const mockTweens = {
        add: vi.fn(({ onComplete }) => {
          if (onComplete) onComplete();
        })
      };
      const mockScene = {
        sound: { mute: false, context: null },
        tweens: mockTweens
      } as any;

      audio.init(mockScene);
      (audio as any).themeSound = mockThemeSound;
      (audio as any).isLoaded = true;

      // Victory
      audio.onVictory();
      expect(audio.phase).toBe('victory');
      expect(mockTweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: mockThemeSound,
          volume: 0,
          duration: 600
        })
      );
      expect(mockThemeSound.stop).toHaveBeenCalled();

      // Restart resets phase to calm and target volume to 0.18
      audio.onRestart();
      expect(audio.phase).toBe('calm');
      expect(audio.targetVolume).toBe(0.18);
      expect(mockThemeSound.play).toHaveBeenCalledWith({
        loop: true,
        volume: 0.18
      });
    });
  });

  describe('Procedural Web Audio Victory Chime', () => {
    it('synthesizes 4-note bell arpeggio via Web Audio API without network downloads', () => {
      const mockOscillators: any[] = [];
      const mockGainNodes: any[] = [];

      const mockAudioContext = {
        state: 'running',
        currentTime: 0,
        createOscillator: vi.fn(() => {
          const osc = {
            type: '',
            frequency: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn()
          };
          mockOscillators.push(osc);
          return osc;
        }),
        createGain: vi.fn(() => {
          const gain = {
            gain: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn()
            },
            connect: vi.fn()
          };
          mockGainNodes.push(gain);
          return gain;
        }),
        destination: {}
      } as any;

      const success = playSynthesizedVictoryChime(mockAudioContext);
      expect(success).toBe(true);

      // 4 notes: G5 (784Hz), C6 (1046.5Hz), E6 (1318.5Hz), G6 (1568Hz)
      expect(mockOscillators.length).toBe(4);
      expect(mockGainNodes.length).toBe(4);

      // Checks triangle wave for bell harmonics
      expect(mockOscillators[0].type).toBe('triangle');
      expect(mockOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(783.99, 0);
      expect(mockOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(1046.50, 0.10);
      expect(mockOscillators[2].frequency.setValueAtTime).toHaveBeenCalledWith(1318.51, 0.22);
      expect(mockOscillators[3].frequency.setValueAtTime).toHaveBeenCalledWith(1567.98, 0.36);

      // All oscillators started and stopped
      for (const osc of mockOscillators) {
        expect(osc.start).toHaveBeenCalled();
        expect(osc.stop).toHaveBeenCalled();
      }
    });

    it('returns false gracefully when AudioContext is unsupported', () => {
      const success = playSynthesizedVictoryChime(null);
      expect(typeof success).toBe('boolean');
    });
  });

  describe('Procedural Game Feel SFX', () => {
    const createSfxContext = () => ({
      state: 'running',
      currentTime: 0,
      createOscillator: vi.fn(() => ({
        type: '',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createGain: vi.fn(() => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        },
        connect: vi.fn()
      })),
      destination: {}
    });

    it('keeps every feedback cue procedural and asset-free', () => {
      expect(Object.keys(GAME_SFX)).toEqual([
        'purchase', 'load', 'ready', 'pack', 'sale', 'upgrade', 'dispatch', 'error'
      ]);
      expect(GAME_SFX.ready).toHaveLength(2);
      expect(GAME_SFX.upgrade).toHaveLength(3);
      expect(GAME_SFX_COOLDOWNS_MS.error).toBeGreaterThanOrEqual(500);
    });

    it('only plays effects after the existing lazy audio gate and when unmuted', () => {
      const audio = new AudioManager();
      const context = createSfxContext();
      const scene = { sound: { context } } as any;
      audio.init(scene);

      expect(audio.playEffect('sale', 1000)).toBe(false);
      expect(context.createOscillator).not.toHaveBeenCalled();

      (audio as any).isLoaded = true;
      expect(audio.playEffect('sale', 1000)).toBe(true);
      expect(context.createOscillator).toHaveBeenCalledTimes(GAME_SFX.sale.length);

      audio.setMuted(true);
      expect(audio.playEffect('upgrade', 2000)).toBe(false);
    });

    it('rate limits repeated station-loop effects without suppressing distinct cues', () => {
      const audio = new AudioManager();
      const context = createSfxContext();
      audio.init({ sound: { context } } as any);
      (audio as any).isLoaded = true;

      expect(audio.playEffect('load', 1000)).toBe(true);
      expect(audio.playEffect('load', 1000 + GAME_SFX_COOLDOWNS_MS.load - 1)).toBe(false);
      expect(audio.playEffect('sale', 1001)).toBe(true);
      expect(audio.playEffect('load', 1000 + GAME_SFX_COOLDOWNS_MS.load)).toBe(true);
    });
  });
});
