import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';
import { Customer } from '../entities/Customer.ts';

export class CounterStation extends BaseStation {
  private stockText: Phaser.GameObjects.Text;
  private serveCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'station_counter', 'Counter & Prasad Delivery', gameState, 65);

    this.stockText = scene.add.text(0, 36, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 6, y: 2 }
    });
    this.stockText.setOrigin(0.5);
    this.add(this.stockText);

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public updateDisplay() {
    this.stockText.setText(`Stock: ${this.gameState.counterBoxesStock} boxes`);
  }

  public onPlayerEnter() {
    this.drawRing(true, 0);
  }

  public onPlayerStay(delta: number) {
    this.serveCooldown -= delta;
    if (this.serveCooldown <= 0) {
      // Automatic deposit of extra boxes or serving directly handled in ShopScene
      this.serveCooldown = 350;
    }
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
  }

  public attemptServeFrontCustomer(customer: Customer): boolean {
    if (!customer || customer.state !== 'waiting') return false;

    const result = this.gameState.serveCustomer(customer.requestedBoxes);
    if (result.success) {
      customer.markServed();

      // Show floating coin gain
      this.showCoinPop(this.x, this.y - 20, result.coinsEarned);
      return true;
    }
    return false;
  }

  private showCoinPop(x: number, y: number, amount: number) {
    const coinContainer = this.scene.add.container(x, y);
    const coinSprite = this.scene.add.sprite(-16, 0, 'coin');
    coinSprite.setScale(0.9);

    const txt = this.scene.add.text(4, 0, `+${amount}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '16px',
      color: '#ffd54f',
      stroke: '#3e2723',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    txt.setOrigin(0, 0.5);

    coinContainer.add([coinSprite, txt]);
    coinContainer.setDepth(1000);

    this.scene.tweens.add({
      targets: coinContainer,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => coinContainer.destroy()
    });
  }
}
