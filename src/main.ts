import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { UIScene } from './scenes/UIScene.ts';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config/layout.ts';

// Cap device pixel ratio at 2 to use for explicit canvas/text scaling decisions.
// Phaser 3.88 does not expose a `render.resolution` property in TypeScript types
// (it was removed in Phaser 3.60). High-DPI sharpness is achieved by:
//   1. Calling text.setResolution(2) on all Phaser text objects (done throughout the codebase).
//   2. The orientationchange handler calling game.scale.refresh() so the canvas
//      is correctly re-measured and redrawn without a page refresh.
// See: https://phaser.io/phaser3/devlog/136 (3.60 scale manager changes)
export const deviceResolution = typeof window !== 'undefined'
  ? Math.min(window.devicePixelRatio || 1, 2)
  : 1;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a0f0b',
  render: {
    antialias: true,
    antialiasGL: true,
    roundPixels: false,
    powerPreference: 'high-performance'
  },
  scale: {
    // The world camera handles desktop fitting and portrait following. RESIZE
    // keeps the canvas full-height on a phone instead of shrinking a 16:9
    // game into a narrow 390×220 strip.
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, ShopScene, UIScene]
};

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game(config);

  // Forward orientationchange to Phaser's scale manager so the game adapts
  // instantly on real devices without needing a page refresh.  The debounce
  // prevents duplicate resize events that fire on some Android browsers.
  let _orientationTimer: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener('orientationchange', () => {
    if (_orientationTimer !== null) clearTimeout(_orientationTimer);
    _orientationTimer = setTimeout(() => {
      _orientationTimer = null;
      game.scale.refresh();
    }, 150);
  });
});
