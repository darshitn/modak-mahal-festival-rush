import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';

interface UpgradeItem {
  id: 'carry' | 'packer' | 'cashier' | 'steamer2';
  title: string;
  cost: number;
  desc: string;
  isUnlocked: () => boolean;
  buyAction: () => boolean;
  keyNum: string;
}

export class UpgradeStation extends BaseStation {
  private panelContainer: Phaser.GameObjects.Container;
  private panelBg: Phaser.GameObjects.Graphics;
  private upgradeRows: Phaser.GameObjects.Container[] = [];
  private items: UpgradeItem[];

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'station_upgrade', 'Mahal Upgrades ⚙️', gameState, 65);

    this.items = [
      {
        id: 'carry',
        title: 'Carry Capacity',
        cost: gameState.config.carryUpgradeCost, // 30
        desc: 'Carry 2 batches / 6 boxes',
        isUnlocked: () => this.gameState.upgrades.hasCarryUpgrade,
        buyAction: () => this.gameState.buyCarryUpgrade(),
        keyNum: '1'
      },
      {
        id: 'packer',
        title: 'Hire Packer',
        cost: gameState.config.packerCost, // 45
        desc: 'Auto-packs cooked batches',
        isUnlocked: () => this.gameState.upgrades.hasPacker,
        buyAction: () => this.gameState.buyPacker(),
        keyNum: '2'
      },
      {
        id: 'cashier',
        title: 'Hire Cashier',
        cost: gameState.config.cashierCost, // 60
        desc: 'Auto-serves counter customers',
        isUnlocked: () => this.gameState.upgrades.hasCashier,
        buyAction: () => this.gameState.buyCashier(),
        keyNum: '3'
      },
      {
        id: 'steamer2',
        title: 'Brass Steamer 2',
        cost: gameState.config.secondSteamerCost, // 90
        desc: 'Double cooking throughput',
        isUnlocked: () => this.gameState.upgrades.hasSecondSteamer,
        buyAction: () => this.gameState.buySecondSteamer(),
        keyNum: '4'
      }
    ];

    // Floating Upgrade Kiosk Board
    this.panelContainer = scene.add.container(0, -115);
    this.panelBg = scene.add.graphics();
    this.panelContainer.add(this.panelBg);

    const titleText = scene.add.text(0, -78, '✨ FESTIVAL UPGRADES ✨', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffd54f'
    });
    titleText.setOrigin(0.5);
    this.panelContainer.add(titleText);

    // Build interactive rows for each upgrade
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const rowY = -52 + i * 36;
      const rowContainer = scene.add.container(0, rowY);

      // Row background
      const rowBg = scene.add.graphics();
      rowContainer.add(rowBg);

      // Upgrade info text
      const infoText = scene.add.text(-120, -10, `[${item.keyNum}] ${item.title}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      const subText = scene.add.text(-120, 3, item.desc, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        color: '#b0bec5'
      });
      rowContainer.add([infoText, subText]);

      // Action button
      const btnBg = scene.add.graphics();
      const btnText = scene.add.text(85, 0, '', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      btnText.setOrigin(0.5);

      const btnHitArea = scene.add.zone(85, 0, 80, 24).setRectangleDropZone(80, 24);
      btnHitArea.setInteractive({ useHandCursor: true });
      btnHitArea.on('pointerdown', () => {
        this.attemptPurchase(item);
      });

      rowContainer.add([btnBg, btnText, btnHitArea]);
      (rowContainer as any).__btnBg = btnBg;
      (rowContainer as any).__btnText = btnText;
      (rowContainer as any).__rowBg = rowBg;

      this.panelContainer.add(rowContainer);
      this.upgradeRows.push(rowContainer);
    }

    this.panelContainer.setVisible(false);
    this.add(this.panelContainer);

    // Keyboard shortcuts [1], [2], [3], [4] when standing inside zone
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.isPlayerInside) return;
      const keyMap: Record<string, number> = {
        Digit1: 0,
        Numpad1: 0,
        Digit2: 1,
        Numpad2: 1,
        Digit3: 2,
        Numpad3: 2,
        Digit4: 3,
        Numpad4: 3
      };
      if (event.code in keyMap) {
        const item = this.items[keyMap[event.code]];
        this.attemptPurchase(item);
      }
    });

    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public onPlayerEnter() {
    this.drawRing(true, 0);
    this.panelContainer.setVisible(true);
    this.updateDisplay();
  }

  public onPlayerStay(_delta: number) {
    // Keep updated
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
    this.panelContainer.setVisible(false);
  }

  public updateDisplay() {
    // Redraw panel background
    this.panelBg.clear();
    this.panelBg.fillStyle(0x1a0f0b, 0.95);
    this.panelBg.fillRoundedRect(-140, -96, 280, 185, 8);
    this.panelBg.lineStyle(2, 0xffb300, 0.9);
    this.panelBg.strokeRoundedRect(-140, -96, 280, 185, 8);

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const row = this.upgradeRows[i] as any;
      const btnBg = row.__btnBg as Phaser.GameObjects.Graphics;
      const btnText = row.__btnText as Phaser.GameObjects.Text;
      const rowBg = row.__rowBg as Phaser.GameObjects.Graphics;

      const isUnlocked = item.isUnlocked();
      const canAfford = this.gameState.canAffordUpgrade(item.cost);

      rowBg.clear();
      rowBg.fillStyle(isUnlocked ? 0x2e7d32 : 0x271406, isUnlocked ? 0.2 : 0.6);
      rowBg.fillRoundedRect(-130, -14, 260, 32, 4);

      btnBg.clear();
      if (isUnlocked) {
        btnBg.fillStyle(0x2e7d32, 0.9);
        btnBg.fillRoundedRect(45, -12, 80, 24, 4);
        btnText.setText('OWNED ✓');
        btnText.setColor('#ffffff');
      } else if (canAfford) {
        btnBg.fillStyle(0xe65100, 0.95);
        btnBg.fillRoundedRect(45, -12, 80, 24, 4);
        btnBg.lineStyle(1.5, 0xffb74d, 1);
        btnBg.strokeRoundedRect(45, -12, 80, 24, 4);
        btnText.setText(`₹${item.cost} [${item.keyNum}]`);
        btnText.setColor('#fff8e1');
      } else {
        btnBg.fillStyle(0x424242, 0.85);
        btnBg.fillRoundedRect(45, -12, 80, 24, 4);
        const needTotal = item.cost + this.gameState.config.minWorkingCapitalReserve;
        btnText.setText(`₹${item.cost} (Need ₹${needTotal})`);
        btnText.setFontSize('9px');
        btnText.setColor('#9e9e9e');
      }
    }
  }

  private attemptPurchase(item: UpgradeItem) {
    if (item.isUnlocked()) return;

    if (item.buyAction()) {
      // Audio or visual burst
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: 1.15,
        duration: 120,
        yoyo: true
      });
      this.updateDisplay();
    }
  }
}
