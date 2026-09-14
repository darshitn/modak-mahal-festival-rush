import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

export class SteamerStation extends BaseStation {
  public steamerId: number;
  private statusText: Phaser.GameObjects.Text;
  private steamEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private cookedPlateSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, steamerId: number, gameState: GameState) {
    super(
      scene,
      x,
      y,
      'station_steamer',
      steamerId === 0 ? 'Brass Steamer 1' : 'Brass Steamer 2',
      gameState,
      55
    );
    this.steamerId = steamerId;

    // Status text (Idle / Steaming 4.2s / Ready!)
    this.statusText = scene.add.text(0, 32, 'Idle', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#263238',
      padding: { x: 6, y: 2 }
    });
    this.statusText.setOrigin(0.5);
    this.add(this.statusText);

    // Cooked batch display on top when ready
    this.cookedPlateSprite = scene.add.sprite(0, -18, 'item_batch');
    this.cookedPlateSprite.setScale(0.9);
    this.cookedPlateSprite.setVisible(false);
    this.add(this.cookedPlateSprite);

    // Steam particle emitter
    if (scene.textures.exists('particle_steam')) {
      this.steamEmitter = scene.add.particles(x, y - 10, 'particle_steam', {
        speedY: { min: -40, max: -70 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.8, end: 1.8 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 900,
        frequency: 200,
        emitting: false
      });
      this.steamEmitter.setDepth(y + 20);
    }

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public update(_delta: number) {
    const steamer = this.gameState.steamers.find(s => s.id === this.steamerId);
    if (!steamer || !steamer.unlocked) return;

    if (steamer.state === 'steaming') {
      this.drawRing(this.isPlayerInside, steamer.progress, 0xff7043);
      if (this.steamEmitter && !this.steamEmitter.emitting) {
        this.steamEmitter.start();
      }
    } else {
      if (this.steamEmitter && this.steamEmitter.emitting) {
        this.steamEmitter.stop();
      }
      this.drawRing(this.isPlayerInside, steamer.state === 'ready' ? 1 : 0, 0x4caf50);
    }
  }

  public updateDisplay() {
    const steamer = this.gameState.steamers.find(s => s.id === this.steamerId);
    if (!steamer || !steamer.unlocked) {
      this.statusText.setText('Locked');
      this.cookedPlateSprite.setVisible(false);
      return;
    }

    if (steamer.state === 'idle') {
      this.statusText.setText('Idle (Load Bundle)');
      this.statusText.setStyle({ color: '#b0bec5', backgroundColor: '#263238' });
      this.cookedPlateSprite.setVisible(false);
    } else if (steamer.state === 'steaming') {
      const remaining = Math.max(0, this.gameState.config.steamTimeSeconds - steamer.timer);
      this.statusText.setText(`Steaming... ${remaining.toFixed(1)}s`);
      this.statusText.setStyle({ color: '#ffcc80', backgroundColor: '#e65100' });
      this.cookedPlateSprite.setVisible(false);
    } else if (steamer.state === 'ready') {
      this.statusText.setText('READY! (Take)');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#2e7d32' });
      this.cookedPlateSprite.setVisible(true);
    }
  }

  public onPlayerEnter() {
    this.checkLoadOrCollect();
  }

  public onPlayerStay(_delta: number) {
    this.checkLoadOrCollect();
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
  }

  private checkLoadOrCollect() {
    const steamer = this.gameState.steamers.find(s => s.id === this.steamerId);
    if (!steamer || !steamer.unlocked) return;

    // If steamer is idle and player carries bundle, load it
    if (steamer.state === 'idle' && this.gameState.carried.type === 'bundle') {
      if (this.gameState.loadSteamer(this.steamerId)) {
        this.scene.tweens.add({
          targets: this.mainSprite,
          scaleY: 1.15,
          duration: 150,
          yoyo: true
        });
      }
    } else if (steamer.state === 'ready') {
      // If steamer is ready, try to collect
      if (this.gameState.collectBatchFromSteamer(this.steamerId)) {
        this.scene.tweens.add({
          targets: this.cookedPlateSprite,
          y: -30,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            this.cookedPlateSprite.y = -18;
            this.cookedPlateSprite.alpha = 1;
            this.cookedPlateSprite.setVisible(false);
          }
        });
      }
    }
  }
}
