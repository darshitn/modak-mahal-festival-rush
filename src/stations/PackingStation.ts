import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

// Visual scale and alignment constants for illustrated packing bench:
// Asset 1568x1003, visible bounds [145, 112, 1446, 917] (visible w=1302, h=806)
const BENCH_SCALE = 106 / 1302; // ~0.08141321 -> visible width ~106px, visible height ~65.6px
const BENCH_ORIGIN_X = 796.0 / 1568;
const BENCH_ORIGIN_Y = 917 / 1003;
const FLOOR_BASE_Y = 15;

// Illustrated Modak Platter: asset 1536x1024, visible bounds [0, 31, 1524, 1007] (w=1525, h=977)
const PLATTER_PACKING_SCALE = 50 / 1525; // ~0.0327869 -> visible width ~50px, visible height ~32px
const PLATTER_ORIGIN_X = 762 / 1536; // ~0.49609
const PLATTER_ORIGIN_Y = 519 / 1024; // ~0.50684

export class PackingStation extends BaseStation {
  private statusText: Phaser.GameObjects.Text;
  private receivingTraySprite: Phaser.GameObjects.Sprite;
  private outputBoxesSprite: Phaser.GameObjects.Sprite;
  private outputBadgeText: Phaser.GameObjects.Text;
  private progressBarGraphics: Phaser.GameObjects.Graphics;
  private collectCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'raster_packing_bench', 'Packing Table', gameState, 65);
    this.labelText.setVisible(false);

    this.mainSprite.setOrigin(BENCH_ORIGIN_X, BENCH_ORIGIN_Y);
    this.mainSprite.setScale(BENCH_SCALE);
    this.mainSprite.setPosition(0, FLOOR_BASE_Y);

    // 1. Cooked batch receiving tray on banana leaf tray (-36, -22)
    this.receivingTraySprite = scene.add.sprite(-36, -22, 'raster_modak_platter');
    this.receivingTraySprite.setOrigin(PLATTER_ORIGIN_X, PLATTER_ORIGIN_Y);
    this.receivingTraySprite.setScale(PLATTER_PACKING_SCALE);
    this.receivingTraySprite.setVisible(false);
    this.add(this.receivingTraySprite);

    // 2. Output finished boxes stack on clear central workspace (2, -18)
    this.outputBoxesSprite = scene.add.sprite(2, -18, 'item_box');
    this.outputBoxesSprite.setScale(0.45);
    this.outputBoxesSprite.setVisible(false);
    this.add(this.outputBoxesSprite);

    // Output quantity badge beneath output stack
    this.outputBadgeText = scene.add.text(2, 2, '0/6', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#37474f',
      padding: { x: 4, y: 1 }
    });
    this.outputBadgeText.setOrigin(0.5).setResolution(2);
    this.add(this.outputBadgeText);

    // 3. Compact progress bar beneath the bench
    this.progressBarGraphics = scene.add.graphics();
    this.add(this.progressBarGraphics);

    // 4. Short status pill centered below the bench
    this.statusText = scene.add.text(0, 28, 'LOAD', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#37474f',
      padding: { x: 6, y: 2 }
    });
    this.statusText.setOrigin(0.5).setResolution(2);
    this.add(this.statusText);

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public update(_delta: number) {
    const pt = this.gameState.packingTable;
    if (pt.isPacking) {
      this.drawCompactProgressBar(pt.progress, 0xab47bc);
    } else {
      this.drawCompactProgressBar(pt.outputBoxes > 0 ? 1 : 0, 0x4caf50);
    }
    this.drawSubtleRing(this.isPlayerInside);
  }

  private drawSubtleRing(active: boolean) {
    this.ringGraphics.clear();
    if (!active) return;
    this.ringGraphics.lineStyle(1.5, 0xab47bc, 0.5);
    this.ringGraphics.strokeEllipse(0, 12, 64, 26);
    this.ringGraphics.fillStyle(0xab47bc, 0.08);
    this.ringGraphics.fillEllipse(0, 12, 64, 26);
  }

  private drawCompactProgressBar(progress: number, color = 0xab47bc) {
    this.progressBarGraphics.clear();
    if (progress <= 0) return;

    const barW = 40;
    const barH = 5;
    const barX = -barW / 2;
    const barY = 16;

    // Track
    this.progressBarGraphics.fillStyle(0x263238, 0.85);
    this.progressBarGraphics.fillRoundedRect(barX, barY, barW, barH, 2.5);
    this.progressBarGraphics.lineStyle(1, 0x455a64, 0.9);
    this.progressBarGraphics.strokeRoundedRect(barX, barY, barW, barH, 2.5);

    // Fill
    const fillW = Math.max(2, Math.min(barW, barW * progress));
    this.progressBarGraphics.fillStyle(color, 1);
    this.progressBarGraphics.fillRoundedRect(barX, barY, fillW, barH, 2);
  }

  public updateDisplay() {
    const pt = this.gameState.packingTable;

    // Visual equipment states:
    // Left tray shows modaks when batch is waiting or being packed
    this.receivingTraySprite.setVisible(pt.inputBatches > 0 || pt.isPacking);

    // Right stack shows boxes when output is ready
    this.outputBoxesSprite.setVisible(pt.outputBoxes > 0);
    this.outputBadgeText.setText(`${pt.outputBoxes}/6`);
    this.outputBadgeText.setStyle({
      backgroundColor: pt.outputBoxes >= 6 ? '#c62828' : pt.outputBoxes > 0 ? '#1b5e20' : '#37474f',
      color: '#ffffff'
    });

    // Concise state wording (LOAD, PACKING Xs, READY, OUTPUT FULL)
    if (pt.isPacking) {
      const remaining = Math.max(0, this.gameState.config.packingTimeSeconds - pt.timer);
      this.statusText.setText(`PACKING ${remaining.toFixed(0)}s`);
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#7b1fa2' });
    } else if (pt.outputBoxes >= this.gameState.config.packingOutputCapacityBoxes) {
      this.statusText.setText('OUTPUT FULL');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#c62828' });
    } else if (pt.outputBoxes > 0) {
      this.statusText.setText('READY');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#2e7d32' });
    } else if (pt.inputBatches > 0) {
      this.statusText.setText('WAITING');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#e65100' });
    } else {
      this.statusText.setText('LOAD');
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#37474f' });
      this.progressBarGraphics.clear();
    }
  }

  public onPlayerEnter() {
    this.checkDepositOrCollect();
  }

  public onPlayerStay(delta: number) {
    this.collectCooldown -= delta;
    if (this.collectCooldown <= 0) {
      this.checkDepositOrCollect();
      this.collectCooldown = 300;
    }
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
  }

  private checkDepositOrCollect() {
    // 1. Deposit cooked batch into receiving tray
    if (this.gameState.carried.type === 'batch') {
      if (this.gameState.loadPackingTable()) {
        this.scene.tweens.add({
          targets: this.mainSprite,
          scaleY: BENCH_SCALE * 1.08,
          duration: 120,
          yoyo: true
        });
        this.scene.tweens.add({
          targets: this.receivingTraySprite,
          scaleY: PLATTER_PACKING_SCALE * 1.15,
          duration: 120,
          yoyo: true
        });
      }
    }

    // 2. Collect ready boxes into player hands
    if (this.gameState.packingTable.outputBoxes > 0) {
      if (this.gameState.carried.type === null || this.gameState.carried.type === 'box') {
        if (this.gameState.collectBoxesFromPackingTable()) {
          this.scene.tweens.add({
            targets: this.outputBoxesSprite,
            scaleY: 0.50,
            duration: 120,
            yoyo: true
          });
        }
      }
    }
  }
}
