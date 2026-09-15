import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

export class IngredientStation extends BaseStation {
  private stockText: Phaser.GameObjects.Text;
  private buyButtonContainer: Phaser.GameObjects.Container;
  private buyButtonBg: Phaser.GameObjects.Graphics;
  private buyButtonText: Phaser.GameObjects.Text;
  private returnButtonContainer: Phaser.GameObjects.Container;
  private returnButtonBg: Phaser.GameObjects.Graphics;
  private returnButtonText: Phaser.GameObjects.Text;
  private transferCooldown = 0;
  private suppressAutoPickupUntilExit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'station_ingredient', 'Ingredient Shelf', gameState, 58);

    // Stock count indicator
    this.stockText = scene.add.text(0, 32, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 6, y: 2 }
    });
    this.stockText.setOrigin(0.5);
    this.add(this.stockText);

    // Buy Button (explicit click/key to buy as per brief)
    this.buyButtonContainer = scene.add.container(0, -60);
    this.buyButtonBg = scene.add.graphics();
    this.buyButtonText = scene.add.text(0, 0, 'Buy (₹12)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.buyButtonText.setOrigin(0.5);

    this.buyButtonContainer.add([this.buyButtonBg, this.buyButtonText]);
    this.buyButtonContainer.setSize(90, 28);
    this.buyButtonContainer.setInteractive({ useHandCursor: true });

    this.buyButtonContainer.on('pointerdown', () => {
      this.attemptBuy();
    });

    this.add(this.buyButtonContainer);
    this.buyButtonContainer.setVisible(false);

    // Explicit escape hatch for the upgraded carry-capacity flow. A player
    // holding an extra bundle must be able to free their hands before taking a
    // cooked batch from a ready steamer.
    this.returnButtonContainer = scene.add.container(0, 64);
    this.returnButtonBg = scene.add.graphics();
    this.returnButtonText = scene.add.text(0, 0, 'Return Ingredients [R]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.returnButtonText.setOrigin(0.5);
    this.returnButtonContainer.add([this.returnButtonBg, this.returnButtonText]);
    this.returnButtonContainer.setSize(132, 28);
    this.returnButtonContainer.setInteractive({ useHandCursor: true });
    this.returnButtonContainer.on('pointerdown', () => this.attemptReturn());
    this.add(this.returnButtonContainer);
    this.returnButtonContainer.setVisible(false);

    // Keyboard shortcut (Space / E / Enter)
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isPlayerInside && event.code === 'KeyR') {
        this.attemptReturn();
        return;
      }
      if (this.isPlayerInside && (event.code === 'Space' || event.code === 'KeyE' || event.code === 'Enter')) {
        this.attemptBuy();
      }
    });

    this.updateStockDisplay();
    this.gameState.subscribe(() => this.updateStockDisplay());
  }

  public updateStockDisplay() {
    this.stockText.setText(`Stock: ${this.gameState.ingredientStorageBundles}`);

    // Update buy button visual affordability
    const canAfford = this.gameState.coins >= this.gameState.config.bundleCost;
    this.buyButtonBg.clear();
    this.buyButtonBg.fillStyle(canAfford ? 0x2e7d32 : 0x757575, 0.95);
    this.buyButtonBg.fillRoundedRect(-45, -14, 90, 28, 6);
    this.buyButtonBg.lineStyle(2, canAfford ? 0xa5d6a7 : 0xbdbdbd, 1);
    this.buyButtonBg.strokeRoundedRect(-45, -14, 90, 28, 6);
    this.buyButtonText.setText(`Buy ₹${this.gameState.config.bundleCost} [E]`);

    const canReturn = this.isPlayerInside && this.gameState.carried.type === 'bundle';
    this.returnButtonContainer.setVisible(canReturn);
    this.returnButtonBg.clear();
    this.returnButtonBg.fillStyle(0x1565c0, 0.95);
    this.returnButtonBg.fillRoundedRect(-66, -14, 132, 28, 6);
    this.returnButtonBg.lineStyle(2, 0x90caf9, 1);
    this.returnButtonBg.strokeRoundedRect(-66, -14, 132, 28, 6);
  }

  public onPlayerEnter() {
    this.suppressAutoPickupUntilExit = false;
    this.drawRing(true, 0);
    this.buyButtonContainer.setVisible(true);
    this.attemptPickup();
    this.updateStockDisplay();
  }

  public onPlayerStay(delta: number) {
    this.transferCooldown -= delta;
    if (this.transferCooldown <= 0) {
      if (!this.suppressAutoPickupUntilExit) {
        this.attemptPickup();
      }
      this.transferCooldown = 400; // 0.4s cooldown between pickups
    }
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
    this.buyButtonContainer.setVisible(false);
    this.returnButtonContainer.setVisible(false);
    this.suppressAutoPickupUntilExit = false;
  }

  private attemptBuy() {
    if (this.gameState.buyBundle()) {
      // Small bounce feedback
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: 1.15,
        duration: 120,
        yoyo: true
      });
      this.updateStockDisplay();
    }
  }

  private attemptPickup() {
    if (this.suppressAutoPickupUntilExit) return;

    // If player has empty hands or holds bundles and shelf has stock, pick up
    if (this.gameState.ingredientStorageBundles > 0) {
      if (this.gameState.pickupBundle()) {
        this.scene.tweens.add({
          targets: this.mainSprite,
          y: -4,
          duration: 100,
          yoyo: true
        });
      }
    }
  }

  private attemptReturn() {
    if (this.gameState.returnBundleToStorage()) {
      // The state notification fires during the return. Set this guard after
      // the mutation so the next proximity update cannot reclaim the bundle.
      this.suppressAutoPickupUntilExit = true;
      this.returnButtonContainer.setVisible(false);
      this.transferCooldown = 400;
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: 1.12,
        duration: 120,
        yoyo: true
      });
    }
  }
}
