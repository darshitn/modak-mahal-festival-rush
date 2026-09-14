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
    this.add(this.sprite);

    this.statusText = scene.add.text(0, -28, 'Packer (Helper)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#a5d6a7',
      backgroundColor: '#1b5e20',
      padding: { x: 4, y: 1 }
    });
    this.statusText.setOrigin(0.5);
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
    this.add(this.sprite);

    this.statusText = scene.add.text(0, -28, 'Cashier (Helper)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#e1bee7',
      backgroundColor: '#4a148c',
      padding: { x: 4, y: 1 }
    });
    this.statusText.setOrigin(0.5);
    this.add(this.statusText);

    scene.add.existing(this);
    this.setDepth(y);
    this.updateVisibility();
    this.gameState.subscribe(() => this.updateVisibility());
  }

  public update(_time: number, delta: number, frontCustomer: Customer | null) {
    if (!this.visible) return;

    this.autoServeCooldown -= delta;
    if (this.autoServeCooldown <= 0 && frontCustomer && frontCustomer.state === 'waiting') {
      if (this.gameState.counterBoxesStock >= frontCustomer.requestedBoxes) {
        const res = this.gameState.autoServeWithCashier(frontCustomer.requestedBoxes);
        if (res.success) {
          frontCustomer.markServed();
          this.showCoinPop(this.x + 30, this.y, res.coinsEarned);

          // Namaste bow animation
          this.scene.tweens.add({
            targets: this.sprite,
            scaleY: 0.85,
            duration: 180,
            yoyo: true
          });
          this.autoServeCooldown = 500;
        }
      }
    }
  }

  private updateVisibility() {
    this.setVisible(this.gameState.upgrades.hasCashier);
  }

  private showCoinPop(x: number, y: number, amount: number) {
    const coinContainer = this.scene.add.container(x, y);
    const coinSprite = this.scene.add.sprite(-16, 0, 'coin');
    coinSprite.setScale(0.9);

    const txt = this.scene.add.text(4, 0, `+${amount} (Cashier)`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
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
