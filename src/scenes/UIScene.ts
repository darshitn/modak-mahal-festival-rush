import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { ShopScene } from './ShopScene.ts';

export interface UpgradeModalItem {
  id: 'carry' | 'packer' | 'cashier' | 'steamer2';
  title: string;
  cost: number;
  desc: string;
  keyNum: string;
  isUnlocked: () => boolean;
  buyAction: () => boolean;
}

export class UIScene extends Phaser.Scene {
  private gameState!: GameState;
  private coinText!: Phaser.GameObjects.Text;
  private carriedText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private objectiveBg!: Phaser.GameObjects.Graphics;

  // Upgrade Modal elements
  public isUpgradeModalOpen = false;
  private modalContainer!: Phaser.GameObjects.Container;
  private modalDimmer!: Phaser.GameObjects.Graphics;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogBg!: Phaser.GameObjects.Graphics;
  private modalRows: Phaser.GameObjects.Container[] = [];
  public upgradeItems: UpgradeModalItem[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(data: { gameState: GameState }) {
    // In Phaser multi-scene, data is passed or retrieved from the registry
    this.gameState = data?.gameState || (this.scene.get('ShopScene') as any)?.gameState;

    const width = this.scale.width;

    // --- Top Bar Background ---
    const topBar = this.add.graphics();
    topBar.fillStyle(0x1a0f0b, 0.85);
    topBar.fillRect(0, 0, width, 56);
    topBar.lineStyle(2, 0xff8f00, 0.8);
    topBar.lineBetween(0, 56, width, 56);

    // Title / Logo text
    this.add.text(16, 12, 'MODAK MAHAL 🪔', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '18px',
      color: '#ffb300'
    });

    this.add.text(16, 34, 'Festival Rush', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffcc80'
    });

    // --- Coin Display ---
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x3e2723, 0.9);
    coinBg.fillRoundedRect(width - 150, 10, 134, 36, 8);
    coinBg.lineStyle(2, 0xffd54f, 0.8);
    coinBg.strokeRoundedRect(width - 150, 10, 134, 36, 8);

    const coinIcon = this.add.sprite(width - 132, 28, 'coin');
    coinIcon.setScale(0.9);

    this.coinText = this.add.text(width - 115, 18, '30', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#ffd54f',
      fontStyle: 'bold'
    });

    // --- Carried Inventory Status ---
    const carriedBg = this.add.graphics();
    carriedBg.fillStyle(0x271406, 0.85);
    carriedBg.fillRoundedRect(200, 10, 200, 36, 8);
    carriedBg.lineStyle(1, 0xbcaaa4, 0.5);
    carriedBg.strokeRoundedRect(200, 10, 200, 36, 8);

    this.carriedText = this.add.text(210, 19, 'Carrying: Empty', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff'
    });

    // --- Dynamic Objective Hint Banner ---
    this.objectiveBg = this.add.graphics();
    this.add.existing(this.objectiveBg);

    this.objectiveText = this.add.text(width / 2, 74, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center'
    });
    this.objectiveText.setOrigin(0.5);

    // --- Bottom Controls Reminder ---
    const controlsText = this.add.text(
      width / 2,
      this.scale.height - 16,
      '⌨️ Walk: WASD / Arrow Keys  |  Stand inside circles to work  |  [E] or [Space]: Buy ingredients',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#ffcc80',
        backgroundColor: '#1a0f0b',
        padding: { x: 12, y: 4 }
      }
    );
    controlsText.setOrigin(0.5);

    // Build the centered upgrade overlay
    this.buildUpgradeModal();

    if (this.gameState) {
      this.gameState.subscribe(() => {
        this.updateHUD();
        if (this.isUpgradeModalOpen) {
          this.updateUpgradeModal();
        }
      });
      this.updateHUD();
    }

    // Keyboard handlers for modal
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleModalKeyDown(event);
    });
  }

  public updateHUD() {
    if (!this.gameState) return;

    // Update coins
    this.coinText.setText(`${this.gameState.coins}`);

    // Update carried items
    const carried = this.gameState.carried;
    if (!carried.type || carried.count === 0) {
      this.carriedText.setText('Carrying: (Empty)');
      this.carriedText.setColor('#b0bec5');
    } else {
      const typeLabel =
        carried.type === 'bundle'
          ? 'Recipe Bundle'
          : carried.type === 'batch'
          ? 'Steamed Modaks'
          : 'Modak Boxes';
      const cap = this.gameState.getCarryCapacity(carried.type);
      this.carriedText.setText(`Carrying: ${carried.count}/${cap} ${typeLabel}`);
      this.carriedText.setColor('#ffe082');
    }

    // Update objective
    const obj = this.gameState.getCurrentObjective();
    this.objectiveText.setText(obj.text);

    // Redraw objective banner
    const width = this.scale.width;
    const textWidth = Math.max(300, this.objectiveText.width + 40);
    this.objectiveBg.clear();
    this.objectiveBg.fillStyle(0xd84315, 0.9);
    this.objectiveBg.fillRoundedRect(width / 2 - textWidth / 2, 60, textWidth, 28, 6);
    this.objectiveBg.lineStyle(1.5, 0xffab91, 1);
    this.objectiveBg.strokeRoundedRect(width / 2 - textWidth / 2, 60, textWidth, 28, 6);
  }

  /**
   * Build centered, screen-bounded upgrade overlay rendered directly above the HUD
   */
  private buildUpgradeModal() {
    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    this.upgradeItems = [
      {
        id: 'carry',
        title: 'Carry Capacity',
        cost: this.gameState.config.carryUpgradeCost,
        desc: 'Carry 2 bundles, 2 batches, or 6 boxes',
        keyNum: '1',
        isUnlocked: () => this.gameState.upgrades.hasCarryUpgrade,
        buyAction: () => this.gameState.buyCarryUpgrade()
      },
      {
        id: 'packer',
        title: 'Hire Packer',
        cost: this.gameState.config.packerCost,
        desc: 'Auto-packs cooked batches at 1.5x speed',
        keyNum: '2',
        isUnlocked: () => this.gameState.upgrades.hasPacker,
        buyAction: () => this.gameState.buyPacker()
      },
      {
        id: 'cashier',
        title: 'Hire Cashier',
        cost: this.gameState.config.cashierCost,
        desc: 'Auto-serves waiting devotees from counter shelf',
        keyNum: '3',
        isUnlocked: () => this.gameState.upgrades.hasCashier,
        buyAction: () => this.gameState.buyCashier()
      },
      {
        id: 'steamer2',
        title: 'Brass Steamer 2',
        cost: this.gameState.config.secondSteamerCost,
        desc: 'Parallel cooking: double kitchen output',
        keyNum: '4',
        isUnlocked: () => this.gameState.upgrades.hasSecondSteamer,
        buyAction: () => this.gameState.buySecondSteamer()
      }
    ];

    this.modalContainer = this.add.container(0, 0);
    this.modalContainer.setDepth(10000); // Higher than any HUD element

    // 1. Fullscreen Backdrop Dimmer (absorbs clicks to prevent click-through)
    this.modalDimmer = this.add.graphics();
    this.modalDimmer.fillStyle(0x000000, 0.7);
    this.modalDimmer.fillRect(0, 0, width, height);
    this.modalDimmer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.modalDimmer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.closeUpgradeModal();
    });
    this.modalContainer.add(this.modalDimmer);

    // 2. Centered Dialog Window (560px wide, 370px tall)
    this.dialogContainer = this.add.container(centerX, centerY);

    this.dialogBg = this.add.graphics();
    this.dialogContainer.add(this.dialogBg);

    // Interactive blocker on dialog area
    const dialogHitArea = this.add.zone(0, 0, 560, 370);
    dialogHitArea.setInteractive();
    dialogHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });
    this.dialogContainer.add(dialogHitArea);

    // Dialog Title
    const titleText = this.add.text(0, -150, '✨ FESTIVAL UPGRADES & STAFF ✨', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '17px',
      color: '#ffd54f',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    this.dialogContainer.add(titleText);

    // Close Button [✕ Esc]
    const closeBtnContainer = this.add.container(236, -150);
    const closeBtnBg = this.add.graphics();
    closeBtnBg.fillStyle(0x424242, 0.9);
    closeBtnBg.fillRoundedRect(-32, -14, 64, 28, 6);
    closeBtnBg.lineStyle(1.5, 0xbdbdbd, 1);
    closeBtnBg.strokeRoundedRect(-32, -14, 64, 28, 6);

    const closeBtnText = this.add.text(0, 0, '✕ Esc', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    closeBtnText.setOrigin(0.5);

    closeBtnContainer.add([closeBtnBg, closeBtnText]);
    closeBtnContainer.setSize(64, 28);
    closeBtnContainer.setInteractive({ useHandCursor: true });
    closeBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.closeUpgradeModal();
    });
    this.dialogContainer.add(closeBtnContainer);

    // Subtitle / Reserve requirement notice
    const subtitle = this.add.text(
      0,
      -120,
      '🛡️ Working-Capital Reserve: Must keep at least ₹12 to restock ingredients.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffcc80'
      }
    );
    subtitle.setOrigin(0.5);
    this.dialogContainer.add(subtitle);

    // Divider line
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xff8f00, 0.5);
    divider.lineBetween(-260, -104, 260, -104);
    this.dialogContainer.add(divider);

    // 4 Upgrade Rows
    const rowYPositions = [-68, -13, 42, 97];
    for (let i = 0; i < this.upgradeItems.length; i++) {
      const item = this.upgradeItems[i];
      const rowY = rowYPositions[i];
      const rowContainer = this.add.container(0, rowY);

      // Row background
      const rowBg = this.add.graphics();
      rowContainer.add(rowBg);

      // Key shortcut badge [1]
      const badgeBg = this.add.graphics();
      badgeBg.fillStyle(0x3e2723, 0.9);
      badgeBg.fillRoundedRect(-252, -14, 28, 28, 6);
      badgeBg.lineStyle(1, 0xffd54f, 0.8);
      badgeBg.strokeRoundedRect(-252, -14, 28, 28, 6);

      const badgeText = this.add.text(-238, 0, item.keyNum, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#ffd54f',
        fontStyle: 'bold'
      });
      badgeText.setOrigin(0.5);
      rowContainer.add([badgeBg, badgeText]);

      // Title & Description
      const title = this.add.text(-214, -11, item.title, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      const desc = this.add.text(-214, 5, item.desc, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#b0bec5'
      });
      rowContainer.add([title, desc]);

      // Action / Purchase Button
      const btnContainer = this.add.container(185, 0);
      const btnBg = this.add.graphics();
      const btnText = this.add.text(0, 0, `₹${item.cost}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      btnText.setOrigin(0.5);

      btnContainer.add([btnBg, btnText]);
      btnContainer.setSize(124, 32);
      btnContainer.setInteractive({ useHandCursor: true });
      btnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event?.stopPropagation();
        this.attemptPurchase(item);
      });

      rowContainer.add(btnContainer);

      (rowContainer as any).__rowBg = rowBg;
      (rowContainer as any).__btnBg = btnBg;
      (rowContainer as any).__btnText = btnText;
      (rowContainer as any).__btnContainer = btnContainer;

      this.dialogContainer.add(rowContainer);
      this.modalRows.push(rowContainer);
    }

    // Footer instructions
    const footer = this.add.text(
      0,
      152,
      'Press [1] - [4] on keyboard to purchase  |  [Esc] or [✕] to close',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#9e9e9e'
      }
    );
    footer.setOrigin(0.5);
    this.dialogContainer.add(footer);

    this.modalContainer.add(this.dialogContainer);
    this.modalContainer.setVisible(false);

    this.updateUpgradeModal();
  }

  public openUpgradeModal() {
    this.isUpgradeModalOpen = true;
    this.modalContainer.setVisible(true);

    // Prevent background player movement
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
    }

    this.updateUpgradeModal();
  }

  public closeUpgradeModal() {
    this.isUpgradeModalOpen = false;
    this.modalContainer.setVisible(false);

    // Restore background player movement
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = false;
    }
  }

  public handleModalKeyDown(event: KeyboardEvent) {
    if (this.isUpgradeModalOpen) {
      if (event.code === 'Escape') {
        this.closeUpgradeModal();
        return;
      }
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
        const item = this.upgradeItems[keyMap[event.code]];
        if (item) {
          this.attemptPurchase(item);
        }
      }
    }
  }

  public updateUpgradeModal() {
    if (!this.dialogBg) return;

    // Draw dialog background (560 x 370)
    this.dialogBg.clear();
    this.dialogBg.fillStyle(0x180d07, 0.98);
    this.dialogBg.fillRoundedRect(-280, -185, 560, 370, 12);
    this.dialogBg.lineStyle(2.5, 0xffb300, 1);
    this.dialogBg.strokeRoundedRect(-280, -185, 560, 370, 12);

    for (let i = 0; i < this.upgradeItems.length; i++) {
      const item = this.upgradeItems[i];
      const row = this.modalRows[i] as any;
      if (!row) continue;

      const rowBg = row.__rowBg as Phaser.GameObjects.Graphics;
      const btnBg = row.__btnBg as Phaser.GameObjects.Graphics;
      const btnText = row.__btnText as Phaser.GameObjects.Text;
      const btnContainer = row.__btnContainer as Phaser.GameObjects.Container;

      const isUnlocked = item.isUnlocked();
      const canAfford = this.gameState.canAffordUpgrade(item.cost);

      // Row background
      rowBg.clear();
      rowBg.fillStyle(isUnlocked ? 0x1b5e20 : 0x241208, isUnlocked ? 0.35 : 0.85);
      rowBg.fillRoundedRect(-260, -22, 520, 44, 6);
      rowBg.lineStyle(1, isUnlocked ? 0x81c784 : 0x4e342e, isUnlocked ? 0.8 : 0.5);
      rowBg.strokeRoundedRect(-260, -22, 520, 44, 6);

      // Action button styling
      btnBg.clear();
      if (isUnlocked) {
        btnBg.fillStyle(0x2e7d32, 0.95);
        btnBg.fillRoundedRect(-62, -16, 124, 32, 6);
        btnText.setText('OWNED ✓');
        btnText.setColor('#ffffff');
        btnContainer.disableInteractive();
      } else if (canAfford) {
        btnBg.fillStyle(0xe65100, 0.95);
        btnBg.fillRoundedRect(-62, -16, 124, 32, 6);
        btnBg.lineStyle(1.5, 0xffd54f, 1);
        btnBg.strokeRoundedRect(-62, -16, 124, 32, 6);
        btnText.setText(`BUY ₹${item.cost} [${item.keyNum}]`);
        btnText.setColor('#fff8e1');
        btnContainer.setInteractive({ useHandCursor: true });
      } else {
        btnBg.fillStyle(0x37474f, 0.85);
        btnBg.fillRoundedRect(-62, -16, 124, 32, 6);
        const needTotal = item.cost + this.gameState.config.minWorkingCapitalReserve;
        btnText.setText(`₹${item.cost} (Need ₹${needTotal})`);
        btnText.setColor('#b0bec5');
        btnContainer.setInteractive({ useHandCursor: false });
      }
    }
  }

  private attemptPurchase(item: UpgradeModalItem) {
    if (item.isUnlocked()) return;

    if (item.buyAction()) {
      // Visual feedback
      const shop = this.scene.get('ShopScene') as ShopScene;
      if (shop?.upgradeStation) {
        shop.upgradeStation.playPurchaseBounce();
      }
      this.updateUpgradeModal();
    }
  }
}
