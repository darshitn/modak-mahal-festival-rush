import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';
import { Customer } from '../entities/Customer.ts';

// Visual scale and alignment constants for illustrated service counter:
// Asset 1683x935, visible bounds [121, 241, 1581, 852] (visible w=1461, h=612)
const COUNTER_SCALE = 118 / 1461; // ~0.0807666 -> visible width ~118px, visible height ~49.4px
const COUNTER_ORIGIN_X = 851.5 / 1683;
const COUNTER_ORIGIN_Y = 852 / 935;
const FLOOR_BASE_Y = 15;

export class CounterStation extends BaseStation {
  private stockText: Phaser.GameObjects.Text;
  private counterBoxesSprite: Phaser.GameObjects.Sprite;
  private depositCooldown = 0;
  private customerServeCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'raster_service_counter', 'Modak Counter', gameState, 82);
    this.labelText.setVisible(false);

    this.mainSprite.setOrigin(COUNTER_ORIGIN_X, COUNTER_ORIGIN_Y);
    this.mainSprite.setScale(COUNTER_SCALE);
    this.mainSprite.setPosition(0, FLOOR_BASE_Y);

    // Visible counter box stock stack on the counter countertop (-15, -25)
    this.counterBoxesSprite = scene.add.sprite(-15, -25, 'item_box');
    this.counterBoxesSprite.setScale(0.42);
    this.counterBoxesSprite.setVisible(false);
    this.add(this.counterBoxesSprite);

    this.stockText = scene.add.text(0, 24, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 7, y: 2 }
    });
    this.stockText.setOrigin(0.5).setResolution(2);
    this.add(this.stockText);

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public updateDisplay() {
    const stock = this.gameState.counterBoxesStock;
    this.counterBoxesSprite.setVisible(stock > 0);
    this.stockText.setText(`Stock: ${stock} boxes`);
    this.stockText.setStyle({
      backgroundColor: stock > 0 ? '#1b5e20' : '#3e2723',
      color: '#ffffff'
    });
  }

  public onPlayerEnter() {
    this.drawSubtleRing(true);
    this.attemptDepositCarriedBoxes();
  }

  public onPlayerStay(delta: number) {
    this.drawSubtleRing(true);
    this.depositCooldown -= delta;
    this.customerServeCooldown -= delta;
    if (this.depositCooldown <= 0) {
      // Depositing even an incomplete order frees the player's hands so they
      // can continue producing the remaining boxes.
      this.attemptDepositCarriedBoxes();
      this.depositCooldown = 350;
    }
  }

  public onPlayerExit() {
    this.drawSubtleRing(false);
  }

  private drawSubtleRing(active: boolean) {
    this.ringGraphics.clear();
    if (!active) return;
    this.ringGraphics.lineStyle(1.5, 0xc9953d, 0.5);
    this.ringGraphics.strokeEllipse(0, 10, 80, 28);
    this.ringGraphics.fillStyle(0xffd54f, 0.08);
    this.ringGraphics.fillEllipse(0, 10, 80, 28);
  }

  public attemptServeFrontCustomer(customer: Customer): boolean {
    if (this.customerServeCooldown > 0) return false;
    if (!customer || customer.state !== 'waiting' || customer.isServing) return false;

    customer.isServing = true;
    const result = this.gameState.serveCustomer(
      customer.requestedBoxes,
      customer.getPatienceFraction()
    );
    if (result.success) {
      this.customerServeCooldown = 600;
      customer.markServed(result.feedbackText, result.stars, result.coinsEarned, result.tipEarned);
      this.scene.events.emit('customer-sale-completed', result);
      return true;
    }
    customer.isServing = false;
    return false;
  }

  public attemptDepositCarriedBoxes(): boolean {
    const deposited = this.gameState.depositBoxesToCounter();
    if (deposited) {
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: COUNTER_SCALE * 1.08,
        duration: 120,
        yoyo: true
      });
    }
    return deposited;
  }
}
