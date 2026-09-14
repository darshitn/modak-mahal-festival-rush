import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

export class PackingStation extends BaseStation {
  private statusText: Phaser.GameObjects.Text;
  private boxPreviewSprite: Phaser.GameObjects.Sprite;
  private collectCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'station_packing', 'Packing Table', gameState, 55);

    // Status / Inventory text
    this.statusText = scene.add.text(0, 34, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#4e342e',
      padding: { x: 6, y: 2 }
    });
    this.statusText.setOrigin(0.5);
    this.add(this.statusText);

    // Box output visual indicator
    this.boxPreviewSprite = scene.add.sprite(0, -18, 'item_box');
    this.boxPreviewSprite.setScale(0.85);
    this.boxPreviewSprite.setVisible(false);
    this.add(this.boxPreviewSprite);

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public update(_delta: number) {
    const pt = this.gameState.packingTable;
    if (pt.isPacking) {
      this.drawRing(this.isPlayerInside, pt.progress, 0xab47bc);
    } else {
      this.drawRing(this.isPlayerInside, pt.outputBoxes > 0 ? 1 : 0, 0x8e24aa);
    }
  }

  public updateDisplay() {
    const pt = this.gameState.packingTable;
    this.boxPreviewSprite.setVisible(pt.outputBoxes > 0);

    if (pt.isPacking) {
      const remaining = Math.max(0, this.gameState.config.packingTimeSeconds - pt.timer);
      this.statusText.setText(`Packing... ${remaining.toFixed(1)}s`);
      this.statusText.setStyle({ color: '#ffcc80', backgroundColor: '#6a1b9a' });
    } else if (pt.outputBoxes > 0) {
      this.statusText.setText(`Boxes: ${pt.outputBoxes} (Take)`);
      this.statusText.setStyle({ color: '#ffffff', backgroundColor: '#2e7d32' });
    } else if (pt.inputBatches > 0) {
      this.statusText.setText(`Ready to pack (${pt.inputBatches} batch)`);
      this.statusText.setStyle({ color: '#fff9c4', backgroundColor: '#e65100' });
    } else {
      this.statusText.setText('Deposit Cooked Modaks');
      this.statusText.setStyle({ color: '#b0bec5', backgroundColor: '#4e342e' });
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
    // 1. If player is carrying cooked batches, deposit them
    if (this.gameState.carried.type === 'batch') {
      if (this.gameState.loadPackingTable()) {
        this.scene.tweens.add({
          targets: this.mainSprite,
          scaleY: 1.1,
          duration: 120,
          yoyo: true
        });
      }
    }

    // 2. If table has output boxes and player can take them, collect
    if (this.gameState.packingTable.outputBoxes > 0) {
      if (this.gameState.carried.type === null || this.gameState.carried.type === 'box') {
        if (this.gameState.collectBoxesFromPackingTable()) {
          this.scene.tweens.add({
            targets: this.boxPreviewSprite,
            scaleY: 1.2,
            duration: 120,
            yoyo: true
          });
        }
      }
    }
  }
}
