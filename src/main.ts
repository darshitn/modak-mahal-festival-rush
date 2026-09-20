import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { UIScene } from './scenes/UIScene.ts';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config/layout.ts';

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
  new Phaser.Game(config);
});
