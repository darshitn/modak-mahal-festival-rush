import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

// Visual scale and alignment constants for illustrated steamer assembly:
// Brass Steamer: asset 1177x1336, visible rows [111, 1213] (h=1103), cols [203, 980] (w=778)
const POT_SCALE = 64 / 1103; // ~0.05802357 -> visible height 64px, visible width 45.1px
const POT_ORIGIN_X = 591.5 / 1177;
const POT_ORIGIN_Y = 1213 / 1336;

// Tables: assets 1313x1198, visible width ~906px, visible height ~815px
const IN_TBL_SCALE = 40 / 905; // ~0.0441989 -> visible width 40px, visible height 36px
const IN_TBL_ORIGIN_X = 655 / 1313;
const IN_TBL_ORIGIN_Y = 1024 / 1198;

const OUT_TBL_SCALE = 40 / 908; // ~0.04405286 -> visible width 40px, visible height 36px
const OUT_TBL_ORIGIN_X = 655.5 / 1313;
const OUT_TBL_ORIGIN_Y = 1026 / 1198;

const TABLE_OFFSET_X = 36;
const FLOOR_BASE_Y = 25; // Local Y for floor contact of stove and table feet

// Illustrated Modak Platter: asset 1536x1024, visible bounds [0, 31, 1524, 1007] (w=1525, h=977)
const PLATTER_STEAMER_SCALE = 48 / 1525; // ~0.0314754 -> visible width ~48px, visible height ~30.8px
const PLATTER_ORIGIN_X = 762 / 1536; // ~0.49609
const PLATTER_ORIGIN_Y = 519 / 1024; // ~0.50684

export class SteamerStation extends BaseStation {
  public steamerId: number;
  private statusText: Phaser.GameObjects.Text;
  private steamEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Left input shelf and queued bundle sprites
  private inputTableSprite: Phaser.GameObjects.Sprite;
  private inputBundle1Sprite: Phaser.GameObjects.Sprite;
  private inputBundle2Sprite: Phaser.GameObjects.Sprite;
  private inputBadgeText: Phaser.GameObjects.Text;

  // Right output shelf and cooked modaks tray sprite
  private outputTableSprite: Phaser.GameObjects.Sprite;
  private cookedModaksSprite: Phaser.GameObjects.Sprite;
  private outputBadgeText: Phaser.GameObjects.Text;

  // Compact progress bar beneath brass pot
  private progressBarGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, steamerId: number, gameState: GameState) {
    super(
      scene,
      x,
      y,
      'raster_steamer_brass',
      steamerId === 0 ? 'Brass Steamer 1' : 'Brass Steamer 2',
      gameState,
      54
    );
    this.steamerId = steamerId;
    this.labelText.setVisible(false);

    // 1. Left Input Prep Table (-36, 25)
    this.inputTableSprite = scene.add.sprite(-TABLE_OFFSET_X, FLOOR_BASE_Y, 'raster_steamer_input_table');
    this.inputTableSprite.setOrigin(IN_TBL_ORIGIN_X, IN_TBL_ORIGIN_Y);
    this.inputTableSprite.setScale(IN_TBL_SCALE);
    this.add(this.inputTableSprite);

    // 2. Right Output Serving Table (+36, 25)
    this.outputTableSprite = scene.add.sprite(TABLE_OFFSET_X, FLOOR_BASE_Y, 'raster_steamer_output_table');
    this.outputTableSprite.setOrigin(OUT_TBL_ORIGIN_X, OUT_TBL_ORIGIN_Y);
    this.outputTableSprite.setScale(OUT_TBL_SCALE);
    this.add(this.outputTableSprite);

    // Ensure central pot sprite sits in front of the tables
    this.bringToTop(this.mainSprite);

    // Queued bundle slots on the input table surface
    this.inputBundle1Sprite = scene.add.sprite(-TABLE_OFFSET_X, -4, 'tray_wrapped_bundle');
    this.inputBundle1Sprite.setScale(0.5);
    this.inputBundle1Sprite.setVisible(false);
    this.add(this.inputBundle1Sprite);

    this.inputBundle2Sprite = scene.add.sprite(-TABLE_OFFSET_X, -12, 'tray_wrapped_bundle');
    this.inputBundle2Sprite.setScale(0.5);
    this.inputBundle2Sprite.setVisible(false);
    this.add(this.inputBundle2Sprite);

    // Input quantity badge beneath input table legs
    this.inputBadgeText = scene.add.text(-TABLE_OFFSET_X, 18, '0/2', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#37474f',
      padding: { x: 4, y: 1 }
    });
    this.inputBadgeText.setOrigin(0.5).setResolution(2);
    this.add(this.inputBadgeText);

    // Cooked modaks on illustrated brass platter
    this.cookedModaksSprite = scene.add.sprite(TABLE_OFFSET_X, -5, 'raster_modak_platter');
    this.cookedModaksSprite.setOrigin(PLATTER_ORIGIN_X, PLATTER_ORIGIN_Y);
    this.cookedModaksSprite.setScale(PLATTER_STEAMER_SCALE);
    this.cookedModaksSprite.setVisible(false);
    this.add(this.cookedModaksSprite);

    // Output status badge beneath output table legs
    this.outputBadgeText = scene.add.text(TABLE_OFFSET_X, 18, 'EMPTY', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#37474f',
      padding: { x: 4, y: 1 }
    });
    this.outputBadgeText.setOrigin(0.5).setResolution(2);
    this.add(this.outputBadgeText);

    // 3. Compact progress bar on stove plinth front face
    this.progressBarGraphics = scene.add.graphics();
    this.add(this.progressBarGraphics);

    // 4. Short status pill centered below the pot plinth
    this.statusText = scene.add.text(0, 27, 'LOAD', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#263238',
      padding: { x: 6, y: 2 }
    });
    this.statusText.setOrigin(0.5).setResolution(2);
    this.add(this.statusText);

    // 5. Steam particle emitter centered above the brass pot lid
    if (scene.textures.exists('particle_steam')) {
      this.steamEmitter = scene.add.particles(x, y - 32, 'particle_steam', {
        speedY: { min: -35, max: -65 },
        speedX: { min: -10, max: 10 },
        scale: { start: 0.35, end: 0.85 },
        alpha: { start: 0.65, end: 0 },
        lifespan: 900,
        frequency: 180,
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
      this.drawCompactProgressBar(steamer.progress, 0xff7043);
      if (this.steamEmitter && !this.steamEmitter.emitting) {
        this.steamEmitter.start();
      }
    } else {
      if (this.steamEmitter && this.steamEmitter.emitting) {
        this.steamEmitter.stop();
      }
      this.drawCompactProgressBar(steamer.state === 'ready' ? 1 : 0, 0x4caf50);
    }

    // Draw subtle, restrained proximity indicator
    this.drawSubtleRing(this.isPlayerInside);
  }

  private drawSubtleRing(active: boolean) {
    this.ringGraphics.clear();
    if (!active) return;
    // Soft, non-intrusive floor highlight
    this.ringGraphics.lineStyle(1.5, 0xe0a93b, 0.45);
    this.ringGraphics.strokeEllipse(0, 12, 60, 24);
    this.ringGraphics.fillStyle(0xffd54f, 0.08);
    this.ringGraphics.fillEllipse(0, 12, 60, 24);
  }

  private drawCompactProgressBar(progress: number, color = 0xff7043) {
    this.progressBarGraphics.clear();
    if (progress <= 0) return;

    const barW = 36;
    const barH = 5;
    const barX = -barW / 2;
    const barY = 15;

    // Background track
    this.progressBarGraphics.fillStyle(0x263238, 0.85);
    this.progressBarGraphics.fillRoundedRect(barX, barY, barW, barH, 2.5);
    this.progressBarGraphics.lineStyle(1, 0x455a64, 0.9);
    this.progressBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 2.5);

    // Progress fill
    const fillW = Math.max(2, Math.min(barW, barW * progress));
    this.progressBarGraphics.fillStyle(color, 1);
    this.progressBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 2);
  }

  public updateDisplay() {
    const steamer = this.gameState.steamers.find(s => s.id === this.steamerId);
    if (!steamer || !steamer.unlocked) {
      // Locked state: show ONLY single clean blueprint card, hide all station text and tables
      this.mainSprite.setTexture('station_steamer_blueprint');
      this.mainSprite.setOrigin(0.5, 0.5);
      this.mainSprite.setPosition(0, 0);
      this.mainSprite.setScale(0.5);
      this.labelText.setVisible(false);
      this.statusText.setVisible(false);
      this.progressBarGraphics.clear();
      this.inputTableSprite.setVisible(false);
      this.inputBundle1Sprite.setVisible(false);
      this.inputBundle2Sprite.setVisible(false);
      this.inputBadgeText.setVisible(false);
      this.outputTableSprite.setVisible(false);
      this.cookedModaksSprite.setVisible(false);
      this.outputBadgeText.setVisible(false);
      if (this.steamEmitter && this.steamEmitter.emitting) {
        this.steamEmitter.stop();
      }
      return;
    }

    // Unlocked operating state: brass pot & stove base mounted at floor contact
    this.mainSprite.setTexture('raster_steamer_brass');
    this.mainSprite.setOrigin(POT_ORIGIN_X, POT_ORIGIN_Y);
    this.mainSprite.setPosition(0, FLOOR_BASE_Y);
    this.mainSprite.setScale(POT_SCALE);

    this.labelText.setVisible(false);
    this.statusText.setVisible(true);
    this.inputTableSprite.setVisible(true);
    this.outputTableSprite.setVisible(true);
    this.inputBadgeText.setVisible(true);
    this.outputBadgeText.setVisible(true);

    // Dynamic state-backed visual queued bundles on input table
    this.inputBundle1Sprite.setVisible(steamer.inputBundles >= 1);
    this.inputBundle2Sprite.setVisible(steamer.inputBundles >= 2);
    this.inputBadgeText.setText(`${steamer.inputBundles}/2`);
    this.inputBadgeText.setStyle({
      backgroundColor: steamer.inputBundles > 0 ? '#1b5e20' : '#37474f'
    });

    // Dynamic state-backed visual cooked modaks on output table
    this.cookedModaksSprite.setVisible(steamer.hasOutput);
    if (steamer.hasOutput) {
      this.outputBadgeText.setText('READY');
      this.outputBadgeText.setStyle({ backgroundColor: '#2e7d32', color: '#ffffff' });
    } else {
      this.outputBadgeText.setText('EMPTY');
      this.outputBadgeText.setStyle({ backgroundColor: '#37474f', color: '#b0bec5' });
    }

    // Short status wording (LOAD, STEAMING Xs, READY, OUTPUT FULL)
    if (steamer.state === 'idle') {
      this.statusText.setText('LOAD');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#37474f' });
      this.progressBarGraphics.clear();
    } else if (steamer.state === 'steaming') {
      const remaining = Math.max(0, this.gameState.config.steamTimeSeconds - steamer.timer);
      this.statusText.setText(`STEAMING ${remaining.toFixed(0)}s`);
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#e65100' });
    } else if (steamer.state === 'ready') {
      const inputIsFull = steamer.inputBundles >= this.gameState.config.steamerInputCapacity;
      if (this.gameState.carried.type === 'bundle' && inputIsFull) {
        this.statusText.setText('OUTPUT FULL');
        this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#c62828' });
      } else {
        this.statusText.setText('READY');
        this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#2e7d32' });
      }
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

    // 1. Deposit compatible input before collecting output.
    if (this.gameState.carried.type === 'bundle') {
      if (this.gameState.loadSteamer(this.steamerId)) {
        this.scene.tweens.add({
          targets: this.inputTableSprite,
          scaleY: IN_TBL_SCALE * 1.1,
          duration: 120,
          yoyo: true
        });
        this.scene.tweens.add({
          targets: [this.inputBundle1Sprite, this.inputBundle2Sprite],
          scaleY: 0.55,
          duration: 120,
          yoyo: true
        });
      }
    }

    // 2. Collect cooked output when hands are free.
    if (steamer.state === 'ready' && this.gameState.carried.type === null) {
      if (this.gameState.collectBatchFromSteamer(this.steamerId)) {
        this.scene.tweens.add({
          targets: this.cookedModaksSprite,
          y: -20,
          alpha: 0,
          duration: 180,
          onComplete: () => {
            this.cookedModaksSprite.y = -5;
            this.cookedModaksSprite.alpha = 1;
            this.cookedModaksSprite.setVisible(false);
          }
        });
      }
    }
  }
}
