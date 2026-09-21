import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

// Visual scale and alignment constants for illustrated supply shelf v2:
// Asset 1387x1134, visible bounds [100, 75, 1286, 1059] (visible w=1187, h=985)
const SHELF_VISIBLE_WIDTH = 1187;
const SHELF_TARGET_WIDTH = 88;
const SHELF_SCALE = SHELF_TARGET_WIDTH / SHELF_VISIBLE_WIDTH; // ~0.074136 -> visible width 88px, visible height ~73.0px
const SHELF_ORIGIN_X = (100 + SHELF_VISIBLE_WIDTH / 2) / 1387; // 0.5
const SHELF_ORIGIN_Y = 1059 / 1134; // ~0.933862
const FLOOR_BASE_Y = 10;

export class IngredientStation extends BaseStation {
  private stockText: Phaser.GameObjects.Text;
  private buyButtonContainer: Phaser.GameObjects.Container;
  private buyButtonBg: Phaser.GameObjects.Graphics;
  private buyButtonText: Phaser.GameObjects.Text;
  private returnButtonContainer: Phaser.GameObjects.Container;
  private returnButtonBg: Phaser.GameObjects.Graphics;
  private returnButtonText: Phaser.GameObjects.Text;
  private goodsInSprite: Phaser.GameObjects.Sprite;
  private transferCooldown = 0;
  private suppressAutoPickupUntilExit = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'raster_supply_shelf_v2', 'Supply Shelf', gameState, 66);
    this.labelText.setVisible(false);

    this.mainSprite.setOrigin(SHELF_ORIGIN_X, SHELF_ORIGIN_Y);
    this.mainSprite.setScale(SHELF_SCALE);
    this.mainSprite.setPosition(0, FLOOR_BASE_Y);

    // Dedicated "GOODS IN" raw ingredient sacks pallet along left intake wall (-54, 10)
    this.goodsInSprite = scene.add.sprite(-54, 10, 'goods_in_sacks');
    this.goodsInSprite.setScale(0.5);
    this.add(this.goodsInSprite);

    // Stock count indicator (clean compact badge at shelf base)
    this.stockText = scene.add.text(0, 20, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 7, y: 2 }
    });
    this.stockText.setOrigin(0.5).setResolution(2);
    this.add(this.stockText);

    // Buy Button (clean prompt below shelf when player is inside)
    this.buyButtonContainer = scene.add.container(0, 42);
    this.buyButtonBg = scene.add.graphics();
    this.buyButtonText = scene.add.text(0, 0, 'Buy (₹12)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.buyButtonText.setOrigin(0.5).setResolution(2);

    this.buyButtonContainer.add([this.buyButtonBg, this.buyButtonText]);
    this.buyButtonContainer.setSize(94, 24);
    this.buyButtonContainer.setInteractive({ useHandCursor: true });

    this.buyButtonContainer.on('pointerdown', () => {
      this.attemptBuy();
    });

    this.add(this.buyButtonContainer);
    this.buyButtonContainer.setVisible(false);

    // Explicit escape hatch for returning ingredients
    this.returnButtonContainer = scene.add.container(0, 66);
    this.returnButtonBg = scene.add.graphics();
    this.returnButtonText = scene.add.text(0, 0, 'Return Ingredients [R]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.returnButtonText.setOrigin(0.5).setResolution(2);
    this.returnButtonContainer.add([this.returnButtonBg, this.returnButtonText]);
    this.returnButtonContainer.setSize(136, 22);
    this.returnButtonContainer.setInteractive({ useHandCursor: true });
    this.returnButtonContainer.on('pointerdown', () => this.attemptReturn());
    this.add(this.returnButtonContainer);
    this.returnButtonContainer.setVisible(false);

    // Keyboard shortcut (Space / E / Enter / R)
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
    this.buyButtonBg.fillRoundedRect(-47, -12, 94, 24, 5);
    this.buyButtonBg.lineStyle(1.5, canAfford ? 0xa5d6a7 : 0xbdbdbd, 1);
    this.buyButtonBg.strokeRoundedRect(-47, -12, 94, 24, 5);
    this.buyButtonText.setText(`Buy ₹${this.gameState.config.bundleCost} [E]`);

    const canReturn = this.isPlayerInside && this.gameState.carried.type === 'bundle';
    this.returnButtonContainer.setVisible(canReturn);
    this.returnButtonBg.clear();
    this.returnButtonBg.fillStyle(0x1565c0, 0.95);
    this.returnButtonBg.fillRoundedRect(-68, -11, 136, 22, 5);
    this.returnButtonBg.lineStyle(1.5, 0x90caf9, 1);
    this.returnButtonBg.strokeRoundedRect(-68, -11, 136, 22, 5);
  }

  public onPlayerEnter() {
    this.suppressAutoPickupUntilExit = false;
    this.drawSubtleRing(true);
    this.buyButtonContainer.setVisible(true);
    this.attemptPickup();
    this.updateStockDisplay();
  }

  public onPlayerStay(delta: number) {
    this.drawSubtleRing(true);
    this.transferCooldown -= delta;
    if (this.transferCooldown <= 0) {
      if (!this.suppressAutoPickupUntilExit) {
        this.attemptPickup();
      }
      this.transferCooldown = 400;
    }
  }

  public onPlayerExit() {
    this.drawSubtleRing(false);
    this.buyButtonContainer.setVisible(false);
    this.returnButtonContainer.setVisible(false);
    this.suppressAutoPickupUntilExit = false;
  }

  private drawSubtleRing(active: boolean) {
    this.ringGraphics.clear();
    if (!active) return;
    this.ringGraphics.lineStyle(1.5, 0xe0a93b, 0.45);
    this.ringGraphics.strokeEllipse(0, 10, 68, 26);
    this.ringGraphics.fillStyle(0xffd54f, 0.08);
    this.ringGraphics.fillEllipse(0, 10, 68, 26);
  }

  public attemptBuy(): boolean {
    if (this.gameState.buyBundle()) {
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: SHELF_SCALE * 1.08,
        duration: 120,
        yoyo: true
      });
      this.scene.tweens.add({
        targets: this.goodsInSprite,
        scaleY: 0.55,
        duration: 120,
        yoyo: true
      });
      this.updateStockDisplay();
      return true;
    }
    return false;
  }

  private attemptPickup() {
    if (this.suppressAutoPickupUntilExit) return;

    if (this.gameState.ingredientStorageBundles > 0) {
      if (this.gameState.pickupBundle()) {
        this.scene.tweens.add({
          targets: this.mainSprite,
          y: FLOOR_BASE_Y - 4,
          duration: 100,
          yoyo: true
        });
      }
    }
  }

  public attemptReturn(): boolean {
    if (this.gameState.returnBundleToStorage()) {
      this.suppressAutoPickupUntilExit = true;
      this.returnButtonContainer.setVisible(false);
      this.transferCooldown = 400;
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: SHELF_SCALE * 1.08,
        duration: 120,
        yoyo: true
      });
      return true;
    }
    return false;
  }
}
