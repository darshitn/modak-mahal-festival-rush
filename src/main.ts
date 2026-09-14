import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { ShopScene } from './scenes/ShopScene.ts';
import { UIScene } from './scenes/UIScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#1a0f0b',
  scale: {
    mode: Phaser.Scale.FIT,
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
