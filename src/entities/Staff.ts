import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { Customer } from './Customer.ts';

export class PackerNPC extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private gameState: GameState;
  private animTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y);
    this.gameState = gameState;

    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.25);
    this.shadow.fillEllipse(0, 16, 26, 10);
    this.add(this.shadow);

    this.sprite = scene.add.sprite(0, 0, 'staff_packer');
    this.sprite.setScale(0.5);
    this.add(this.sprite);

    this.statusText = scene.add.text(0, -28, 'Packer', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#fff8e1',
      backgroundColor: '#1b5e20',
      fontStyle: 'bold',
      padding: { x: 5, y: 2 }
    });
    this.statusText.setOrigin(0.5).setResolution(2);
    this.add(this.statusText);

    scene.add.existing(this);
    this.setDepth(y);
    this.updateVisibility();
    this.gameState.subscribe(() => this.updateVisibility());
  }

  public update(_time: number, delta: number) {
    if (!this.visible) return;

    const dt = delta / 1000;
    if (this.gameState.packingTable.isPacking) {
      this.animTimer += dt * 12;
      this.sprite.y = Math.sin(this.animTimer) * 3;
    } else {
      this.sprite.y = 0;
    }
  }

  private updateVisibility() {
    this.setVisible(this.gameState.upgrades.hasPacker);
  }
}

export class CashierNPC extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Sprite;
  private shadow: Phaser.GameObjects.Graphics;
  private statusText: Phaser.GameObjects.Text;
  private gameState: GameState;
  private autoServeCooldown = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y);
    this.gameState = gameState;

    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.25);
    this.shadow.fillEllipse(0, 16, 26, 10);
    this.add(this.shadow);

    this.sprite = scene.add.sprite(0, 0, 'staff_cashier');
    this.sprite.setScale(0.5);
    this.add(this.sprite);

    this.statusText = scene.add.text(0, -28, 'Cashier', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#fff8e1',
      backgroundColor: '#4a148c',
      fontStyle: 'bold',
      padding: { x: 5, y: 2 }
    });
    this.statusText.setOrigin(0.5).setResolution(2);
    this.add(this.statusText);

    scene.add.existing(this);
    this.setDepth(y);
    this.updateVisibility();
    this.gameState.subscribe(() => this.updateVisibility());
  }

  public update(_time: number, delta: number, frontCustomer: Customer | null) {
    if (!this.visible) return;

    this.autoServeCooldown -= delta;
    if (this.autoServeCooldown <= 0 && frontCustomer && frontCustomer.state === 'waiting' && !frontCustomer.isServing) {
      if (this.gameState.counterBoxesStock >= frontCustomer.requestedBoxes) {
        frontCustomer.isServing = true;
        const res = this.gameState.autoServeWithCashier(
          frontCustomer.requestedBoxes,
          frontCustomer.getPatienceFraction()
        );
        if (res.success) {
          frontCustomer.markServed(res.feedbackText, res.stars, res.coinsEarned, res.tipEarned);
          this.scene.events.emit('customer-sale-completed', res);

          // Namaste bow animation using the legacy character's base scale.
          this.scene.tweens.add({
            targets: this.sprite,
            scaleY: 0.42,
            duration: 180,
            yoyo: true
          });
          this.autoServeCooldown = 500;
        } else {
          frontCustomer.isServing = false;
        }
      }
    }
  }

  private updateVisibility() {
    this.setVisible(this.gameState.upgrades.hasCashier);
  }
}
