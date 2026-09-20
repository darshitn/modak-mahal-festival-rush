import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { CampaignState } from '../state/CampaignState.ts';
import { ShopScene } from './ShopScene.ts';
import { COLORS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/layout.ts';

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
  public gameState!: GameState;
  public campaignState!: CampaignState;

  private coinText!: Phaser.GameObjects.Text;
  private carriedText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private objectiveBg!: Phaser.GameObjects.Graphics;
  private controlsText!: Phaser.GameObjects.Text;
  private mobileHudBg!: Phaser.GameObjects.Graphics;
  private mobileTitleText!: Phaser.GameObjects.Text;
  private mobileSummaryText!: Phaser.GameObjects.Text;
  private desktopHudContainer!: Phaser.GameObjects.Container;

  // Top Bar elements
  private topBarGraphics!: Phaser.GameObjects.Graphics;
  private coinBgGraphics!: Phaser.GameObjects.Graphics;
  private coinIconSprite!: Phaser.GameObjects.Sprite;
  private ratingBgGraphics!: Phaser.GameObjects.Graphics;
  private ratingText!: Phaser.GameObjects.Text;
  private timerBgGraphics!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private pauseBtnContainer!: Phaser.GameObjects.Container;

  // Contextual and announcement cards
  private actionCardContainer!: Phaser.GameObjects.Container;
  private actionCardBg!: Phaser.GameObjects.Graphics;
  private actionCardText!: Phaser.GameObjects.Text;
  private announcementContainer!: Phaser.GameObjects.Container;
  private announcementBg!: Phaser.GameObjects.Graphics;
  private announcementText!: Phaser.GameObjects.Text;

  // Upgrade Modal
  // Modals & Keyboard listener
  private onKeyDownHandler: ((event: KeyboardEvent) => void) | null = null;
  public isUpgradeModalOpen = false;
  private modalContainer!: Phaser.GameObjects.Container;
  private modalDimmer!: Phaser.GameObjects.Graphics;
  private dialogContainer!: Phaser.GameObjects.Container;
  private dialogBg!: Phaser.GameObjects.Graphics;
  private modalRows: Phaser.GameObjects.Container[] = [];
  public upgradeItems: UpgradeModalItem[] = [];

  // Pause Modal
  public isPauseModalOpen = false;
  private pauseModalContainer!: Phaser.GameObjects.Container;

  // Results Modal
  public isResultsModalOpen = false;
  private resultsModalContainer!: Phaser.GameObjects.Container;

  // Guide Modal
  public isGuideModalOpen = false;
  private guideModalContainer!: Phaser.GameObjects.Container;
  public hasShownOpeningGuide = false;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(data: { gameState: GameState; campaignState?: CampaignState }) {
    this.gameState = data?.gameState || (this.scene.get('ShopScene') as any)?.gameState;
    this.campaignState = data?.campaignState || (this.scene.get('ShopScene') as any)?.campaignState;
    (window as any).__uiScene = this;

    const screenW = this.scale.gameSize.width;
    const screenH = this.scale.gameSize.height;
    this.desktopHudContainer = this.add.container(0, 0);

    // --- Top Bar Background ---
    this.topBarGraphics = this.add.graphics();
    this.topBarGraphics.fillStyle(COLORS.paper, 1.0);
    this.topBarGraphics.fillRect(0, 0, Math.max(screenW, 1920), 58);
    this.topBarGraphics.lineStyle(2, COLORS.brass, 0.85);
    this.topBarGraphics.lineBetween(0, 58, Math.max(screenW, 1920), 58);

    // Logo
    const titleText = this.add.text(18, 10, 'MODAK MAHAL', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '18px',
      color: '#45362e'
    }).setResolution(2);

    const subtitleText = this.add.text(16, 34, 'Festival Rush', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#b84e3b'
    }).setResolution(2);

    // --- Coin Display ---
    this.coinBgGraphics = this.add.graphics();
    this.coinBgGraphics.fillStyle(COLORS.paper, 1);
    this.coinBgGraphics.fillRoundedRect(screenW - 150, 10, 134, 36, 8);
    this.coinBgGraphics.lineStyle(2, COLORS.brass, 0.9);
    this.coinBgGraphics.strokeRoundedRect(screenW - 150, 10, 134, 36, 8);

    this.coinIconSprite = this.add.sprite(screenW - 132, 28, 'coin');
    this.coinIconSprite.setScale(0.45);

    this.coinText = this.add.text(screenW - 115, 18, `${this.gameState.coins}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '18px',
      color: '#45362e',
      fontStyle: 'bold'
    }).setResolution(2);

    // --- Carried Inventory Status ---
    const carriedBg = this.add.graphics();
    carriedBg.fillStyle(0xfffdf7, 1);
    carriedBg.fillRoundedRect(175, 10, 155, 36, 8);
    carriedBg.lineStyle(1, COLORS.walnut, 0.25);
    carriedBg.strokeRoundedRect(175, 10, 155, 36, 8);

    this.carriedText = this.add.text(183, 19, 'Carrying: (Empty)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#45362e'
    }).setResolution(2);

    // --- Business Rating Display ---
    this.ratingBgGraphics = this.add.graphics();
    this.ratingBgGraphics.fillStyle(0xfffdf7, 1);
    this.ratingBgGraphics.fillRoundedRect(338, 10, 140, 36, 8);
    this.ratingBgGraphics.lineStyle(1, COLORS.walnut, 0.25);
    this.ratingBgGraphics.strokeRoundedRect(338, 10, 140, 36, 8);

    this.ratingText = this.add.text(348, 19, 'Mahal ★ 4.0', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#45362e',
      fontStyle: 'bold'
    }).setResolution(2);

    // --- Campaign Timer Display ---
    this.timerBgGraphics = this.add.graphics();
    this.timerBgGraphics.fillStyle(0xfffdf7, 1);
    this.timerBgGraphics.fillRoundedRect(486, 10, 150, 36, 8);
    this.timerBgGraphics.lineStyle(1.5, 0xd97706, 0.85);
    this.timerBgGraphics.strokeRoundedRect(486, 10, 150, 36, 8);

    this.timerText = this.add.text(496, 19, 'Festival Setup', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#b45309',
      fontStyle: 'bold'
    }).setResolution(2);

    // --- Pause Button ---
    this.pauseBtnContainer = this.add.container(644, 10);
    const pauseBg = this.add.graphics();
    pauseBg.fillStyle(0xfffdf7, 1);
    pauseBg.fillRoundedRect(0, 0, 42, 36, 8);
    pauseBg.lineStyle(1.5, 0x45362e, 0.6);
    pauseBg.strokeRoundedRect(0, 0, 42, 36, 8);

    const pauseLabel = this.add.text(21, 18, '❚❚', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#45362e',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);

    this.pauseBtnContainer.add([pauseBg, pauseLabel]);
    this.pauseBtnContainer.setSize(42, 36);
    this.pauseBtnContainer.setInteractive({ useHandCursor: true });
    this.pauseBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.togglePause();
    });

    // --- Dynamic Objective Banner ---
    this.objectiveBg = this.add.graphics();
    this.objectiveText = this.add.text(screenW / 2, 76, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#45362e',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);

    // --- Non-blocking Announcement Banner ---
    this.announcementContainer = this.add.container(screenW / 2, 106);
    this.announcementBg = this.add.graphics();
    this.announcementText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#78350f',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);
    this.announcementContainer.add([this.announcementBg, this.announcementText]);
    this.announcementContainer.setVisible(false);

    this.desktopHudContainer.add([
      this.topBarGraphics,
      titleText,
      subtitleText,
      this.coinBgGraphics,
      this.coinIconSprite,
      this.coinText,
      carriedBg,
      this.carriedText,
      this.ratingBgGraphics,
      this.ratingText,
      this.timerBgGraphics,
      this.timerText,
      this.pauseBtnContainer,
      this.objectiveBg,
      this.objectiveText,
      this.announcementContainer
    ]);

    // Mobile Portrait HUD
    this.mobileHudBg = this.add.graphics();
    this.mobileHudBg.fillStyle(COLORS.paper, 1.0);
    this.mobileHudBg.fillRect(0, 0, 400, 54);
    this.mobileHudBg.lineStyle(2, COLORS.brass, 0.85);
    this.mobileHudBg.lineBetween(0, 54, 400, 54);
    this.mobileHudBg.setDepth(100);
    this.mobileHudBg.setVisible(false);

    this.mobileTitleText = this.add.text(14, 8, 'MODAK MAHAL', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '15px',
      color: '#45362e'
    }).setResolution(2).setDepth(101).setVisible(false);

    this.mobileSummaryText = this.add.text(14, 29, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#45362e',
      wordWrap: { width: 360 }
    }).setResolution(2).setDepth(101).setVisible(false);

    // Screen-Anchored Action Prompt Card
    this.actionCardContainer = this.add.container(screenW / 2, screenH - 52);
    this.actionCardContainer.setDepth(150);
    this.actionCardBg = this.add.graphics();
    this.actionCardText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);
    this.actionCardContainer.add([this.actionCardBg, this.actionCardText]);
    this.actionCardContainer.setVisible(false);

    // Controls text
    this.controlsText = this.add.text(
      screenW / 2,
      screenH - 20,
      'Move: WASD/Arrows • Interact: Walk close/E • Pause: P/Esc',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#45362e',
        backgroundColor: '#fffdf7',
        padding: { x: 12, y: 4 }
      }
    ).setOrigin(0.5).setResolution(2);

    // Build modal overlays
    this.buildUpgradeModal();
    this.buildPauseModal();
    this.buildResultsModal();
    this.buildGuideModal();

    // Ensure HUD depth
    this.desktopHudContainer.setDepth(5000);
    this.controlsText.setDepth(5000);

    // Subscriptions
    if (this.gameState) {
      this.gameState.subscribe(() => {
        this.updateHUD();
        if (this.isUpgradeModalOpen) {
          this.updateUpgradeModal();
        }
      });
    }

    if (this.campaignState) {
      this.campaignState.subscribe(() => {
        this.updateHUD();
        if (
          (this.campaignState.stage === 'VICTORY' || this.campaignState.stage === 'TIME_EXPIRED') &&
          !this.campaignState.isContinueGrowing &&
          !this.isResultsModalOpen
        ) {
          this.openResultsModal();
        }
      });
    }

    this.updateHUD();
    this.updateResponsiveHud(this.scale.gameSize);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateResponsiveHud, this);

    // Show opening guide on new campaign onboarding
    if (!this.hasShownOpeningGuide && (!this.campaignState || this.campaignState.stage === 'ONBOARDING')) {
      this.hasShownOpeningGuide = true;
      this.openGuideModal();
    }
    // Single authoritative keyboard listener with shutdown/destroy cleanup
    this.cleanupKeyboard();
    this.onKeyDownHandler = (event: KeyboardEvent) => {
      this.handleModalKeyDown(event);
    };
    this.input.keyboard?.on('keydown', this.onKeyDownHandler);

    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  private cleanupKeyboard() {
    if (this.onKeyDownHandler && this.input.keyboard) {
      this.input.keyboard.off('keydown', this.onKeyDownHandler);
      this.onKeyDownHandler = null;
    }
  }

  private cleanup() {
    this.cleanupKeyboard();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.updateResponsiveHud, this);
  }

  update() {
    this.updateContextualActionCard();
    // Continuously update timer display to stay in sync with simulation delta
    this.updateTimerText();
  }

  private updateTimerText() {
    if (!this.campaignState || !this.timerText) return;

    if (this.campaignState.stage === 'ONBOARDING') {
      this.timerText.setText('Festival Setup');
      this.timerText.setColor('#45362e');
    } else if (this.campaignState.isContinueGrowing) {
      this.timerText.setText('Free Play Mode 🌟');
      this.timerText.setColor('#2e7d32');
    } else if (this.campaignState.stage === 'VICTORY') {
      this.timerText.setText('Festival Won! 🎉');
      this.timerText.setColor('#2e7d32');
    } else if (this.campaignState.stage === 'TIME_EXPIRED') {
      this.timerText.setText('Festival Closed ⌛');
      this.timerText.setColor('#d32f2f');
    } else {
      const secs = Math.ceil(this.campaignState.timeRemaining);
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      const timeStr = `Closing in ${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
      this.timerText.setText(timeStr);
      this.timerText.setColor(secs <= 60 ? '#c62828' : '#b45309');
    }
  }

  private updateContextualActionCard() {
    const shopScene = this.scene.get('ShopScene') as any;
    if (!shopScene) return;

    const isInsideShelf = shopScene.ingredientStation?.isPlayerInside;
    const isInsideSteamer1 = shopScene.steamer1?.isPlayerInside;
    const isInsideSteamer2 = shopScene.steamer2?.isPlayerInside;
    const isInsidePacking = shopScene.packingStation?.isPlayerInside;
    const isInsideCounter = shopScene.counterStation?.isPlayerInside;
    const isInsideOffice = shopScene.upgradeStation?.isPlayerInside;
    const isInsideDispatch = shopScene.dispatchStation?.isPlayerInside;

    let prompt = '';
    let bgColor = 0x37474f;

    if (isInsideShelf) {
      const hasBundle = this.gameState.carried.type === 'bundle';
      prompt = hasBundle
        ? 'Supply Shelf • R: Return carried ingredients'
        : `Supply Shelf • E: Buy ingredients ₹${this.gameState.config.bundleCost}`;
      bgColor = hasBundle ? 0x1565c0 : 0x2e7d32;
    } else if (isInsideSteamer1) {
      const steamer = this.gameState.steamers.find(s => s.id === 0);
      if (steamer?.state === 'ready') {
        prompt = 'Steamer 1 • Collect cooked modaks';
        bgColor = 0x2e7d32;
      } else if (steamer?.state === 'steaming') {
        prompt = 'Steamer 1 • Steaming modaks...';
        bgColor = 0xe65100;
      } else {
        prompt = 'Steamer 1 • Load ingredient bundle';
        bgColor = 0x37474f;
      }
    } else if (isInsideSteamer2) {
      const steamer = this.gameState.steamers.find(s => s.id === 1);
      if (!steamer?.unlocked) {
        prompt = 'Steamer 2 (Locked) • Upgrade at Desk ₹90';
        bgColor = 0x00838f;
      } else if (steamer?.state === 'ready') {
        prompt = 'Steamer 2 • Collect cooked modaks';
        bgColor = 0x2e7d32;
      } else if (steamer?.state === 'steaming') {
        prompt = 'Steamer 2 • Steaming modaks...';
        bgColor = 0xe65100;
      } else {
        prompt = 'Steamer 2 • Load ingredient bundle';
        bgColor = 0x37474f;
      }
    } else if (isInsidePacking) {
      prompt = 'Packing • Deposit batch / Collect boxes';
      bgColor = 0x4527a0;
    } else if (isInsideCounter) {
      prompt = 'Counter • Deposit boxes / Serve devotees';
      bgColor = 0xb84e3b;
    } else if (isInsideDispatch && shopScene?.isDispatchUnlocked?.()) {
      const stage = this.campaignState?.stage;
      if (stage === 'PANDAL_ORDER' || stage === 'DISPATCHING') {
        prompt = `Dispatch • Deposit boxes (${this.campaignState.pandalBoxesReserved}/12)`;
        bgColor = 0xd97706;
      }
    } else if (isInsideOffice) {
      prompt = 'Upgrade Desk • E: Open';
      bgColor = 0x4e342e;
    }

    if (prompt) {
      this.actionCardContainer.setVisible(true);
      const gameSize = this.scale.gameSize;
      const isPortrait = gameSize.height > gameSize.width;
      const maxCardWidth = isPortrait ? Math.max(260, gameSize.width - 24) : 420;

      this.actionCardText.setWordWrapWidth(maxCardWidth - 24);
      this.actionCardText.setText(prompt);

      const textW = this.actionCardText.width;
      const textH = this.actionCardText.height;
      const cardW = Math.min(maxCardWidth, Math.max(160, textW + 24));
      const cardH = Math.max(28, textH + 10);

      this.actionCardBg.clear();
      this.actionCardBg.fillStyle(bgColor, 0.95);
      this.actionCardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      this.actionCardBg.lineStyle(1.5, 0xffd54f, 0.85);
      this.actionCardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
    } else {
      this.actionCardContainer.setVisible(false);
    }
  }

  public updateHUD() {
    if (!this.gameState) return;

    // Coins
    this.coinText.setText(`${this.gameState.coins}`);

    // Carried items
    const carried = this.gameState.carried;
    if (!carried.type || carried.count === 0) {
      this.carriedText.setText('Carrying: (Empty)');
      this.carriedText.setColor('#75665e');
    } else {
      const typeLabel =
        carried.type === 'bundle'
          ? 'Bundle'
          : carried.type === 'batch'
          ? 'Modaks'
          : 'Boxes';
      const cap = this.gameState.getCarryCapacity(carried.type);
      this.carriedText.setText(`Carry: ${carried.count}/${cap} ${typeLabel}`);
      this.carriedText.setColor('#35765a');
    }

    // Business rating
    if (this.ratingText) {
      this.ratingText.setText(`Mahal ★ ${this.gameState.businessRating.toFixed(1)}`);
    }

    // Timer
    this.updateTimerText();

    // Objective text with campaign stage awareness
    let objectiveString = '';
    if (this.campaignState) {
      const stage = this.campaignState.stage;
      if (stage === 'ONBOARDING') {
        objectiveString = this.gameState.getCurrentObjective().text;
      } else if (stage === 'FESTIVAL_OPEN' || stage === 'GROW_BUSINESS') {
        const upCount = this.campaignState.getUpgradeCount(this.gameState);
        objectiveString = `Upgrade the Mahal: ${upCount}/4 (Carry, Packer, Cashier, Steamer 2)`;
      } else if (stage === 'FESTIVAL_RUSH') {
        const upCount = this.campaignState.getUpgradeCount(this.gameState);
        const rushSecs = Math.ceil(this.campaignState.rushState.timer);
        objectiveString = `Festival Rush! Fast Service (${rushSecs}s) • Upgrades: ${upCount}/4`;
      } else if (stage === 'PANDAL_ORDER') {
        objectiveString = `Grand Pandal Order: ${this.campaignState.pandalBoxesReserved}/${this.campaignState.config.pandalOrderTargetBoxes} packed boxes`;
      } else if (stage === 'DISPATCHING') {
        const dispatchSecs = Math.max(
          0,
          Math.ceil(this.campaignState.config.courierDispatchDurationSeconds - this.campaignState.courierDispatchTimer)
        );
        objectiveString = `Courier Dispatching Grand Pandal Order! (${dispatchSecs}s)`;
      } else if (stage === 'VICTORY') {
        objectiveString = 'Victory! Grand Pandal Order Delivered!';
      } else if (stage === 'TIME_EXPIRED') {
        objectiveString = 'The Festival Has Closed.';
      }
    } else {
      objectiveString = this.gameState.getCurrentObjective().text;
    }

    this.objectiveText.setText(objectiveString);

    const screenW = this.scale.gameSize.width;
    const centerX = screenW / 2;
    this.objectiveText.setX(centerX);
    const textWidth = Math.max(300, this.objectiveText.width + 40);
    this.objectiveBg.clear();
    this.objectiveBg.fillStyle(COLORS.paper, 1.0);
    this.objectiveBg.fillRoundedRect(centerX - textWidth / 2, 62, textWidth, 28, 8);
    this.objectiveBg.lineStyle(1.5, COLORS.saffron, 0.85);
    this.objectiveBg.strokeRoundedRect(centerX - textWidth / 2, 62, textWidth, 28, 8);

    // Announcement banner
    if (this.campaignState?.announcement) {
      this.announcementContainer.setVisible(true);
      this.announcementContainer.setX(centerX);
      this.announcementText.setText(this.campaignState.announcement.text);
      const annW = this.announcementText.width + 36;
      this.announcementBg.clear();
      this.announcementBg.fillStyle(0x000000, 0.25);
      this.announcementBg.fillRoundedRect(-annW / 2 + 1, -13, annW, 28, 6);
      this.announcementBg.fillStyle(0xfff8e1, 0.98);
      this.announcementBg.fillRoundedRect(-annW / 2, -14, annW, 28, 6);
      this.announcementBg.lineStyle(2, 0xd97706, 1);
      this.announcementBg.strokeRoundedRect(-annW / 2, -14, annW, 28, 6);
    } else {
      this.announcementContainer.setVisible(false);
    }

    // Mobile summary
    this.mobileSummaryText.setText(
      `₹${this.gameState.coins} • ★ ${this.gameState.businessRating.toFixed(1)} • ${this.carriedText.text} • ${objectiveString}`
    );
  }

  private updateResponsiveHud(gameSize: Phaser.Structs.Size) {
    const screenWidth = gameSize.width;
    const screenHeight = gameSize.height;
    const isPortrait = screenHeight > screenWidth;

    this.desktopHudContainer?.setVisible(!isPortrait);
    this.mobileHudBg?.setVisible(isPortrait);
    this.mobileTitleText?.setVisible(isPortrait);
    this.mobileSummaryText?.setVisible(isPortrait);
    this.controlsText?.setVisible(!isPortrait);

    if (!isPortrait) {
      if (this.topBarGraphics) {
        this.topBarGraphics.clear();
        this.topBarGraphics.fillStyle(COLORS.paper, 1.0);
        this.topBarGraphics.fillRect(0, 0, Math.max(screenWidth, 1920), 58);
        this.topBarGraphics.lineStyle(2, COLORS.brass, 0.85);
        this.topBarGraphics.lineBetween(0, 58, Math.max(screenWidth, 1920), 58);
      }

      // Coin display right aligned
      if (this.coinBgGraphics && this.coinIconSprite && this.coinText) {
        const coinX = screenWidth - 150;
        this.coinBgGraphics.clear();
        this.coinBgGraphics.fillStyle(COLORS.paper, 1);
        this.coinBgGraphics.fillRoundedRect(coinX, 10, 134, 36, 8);
        this.coinBgGraphics.lineStyle(2, COLORS.brass, 0.9);
        this.coinBgGraphics.strokeRoundedRect(coinX, 10, 134, 36, 8);
        this.coinIconSprite.setPosition(coinX + 18, 28);
        this.coinText.setPosition(coinX + 35, 18);
      }

      // Objective and announcement banners
      const centerX = screenWidth / 2;
      if (this.objectiveText && this.objectiveBg) {
        this.objectiveText.setX(centerX);
        const textWidth = Math.max(300, this.objectiveText.width + 40);
        this.objectiveBg.clear();
        this.objectiveBg.fillStyle(COLORS.paper, 1.0);
        this.objectiveBg.fillRoundedRect(centerX - textWidth / 2, 62, textWidth, 28, 8);
        this.objectiveBg.lineStyle(1.5, COLORS.saffron, 0.85);
        this.objectiveBg.strokeRoundedRect(centerX - textWidth / 2, 62, textWidth, 28, 8);
      }
      if (this.announcementContainer) {
        this.announcementContainer.setX(centerX);
      }

      if (this.controlsText) {
        this.controlsText.setPosition(screenWidth / 2, screenHeight - 20);
      }
      if (this.actionCardContainer) {
        this.actionCardContainer.setPosition(screenWidth / 2, screenHeight - 52);
      }
    } else {
      if (this.mobileHudBg) {
        this.mobileHudBg.clear();
        this.mobileHudBg.fillStyle(COLORS.paper, 1.0);
        this.mobileHudBg.fillRect(0, 0, screenWidth, 54);
        this.mobileHudBg.lineStyle(2, COLORS.brass, 0.85);
        this.mobileHudBg.lineBetween(0, 54, screenWidth, 54);
      }
      if (this.mobileSummaryText) {
        this.mobileSummaryText.setWordWrapWidth(screenWidth - 28);
      }
      if (this.actionCardContainer) {
        this.actionCardContainer.setPosition(screenWidth / 2, screenHeight - 44);
      }
    }

    // Modal dialog responsiveness
    if (this.dialogContainer && this.modalDimmer) {
      const modalScale = isPortrait ? Math.min(1, (screenWidth - 24) / 560) : 1.0;
      this.dialogContainer.setScale(modalScale);
      this.dialogContainer.setPosition(screenWidth / 2, screenHeight / 2);
      this.modalDimmer.clear();
      this.modalDimmer.fillStyle(0x000000, 0.7);
      this.modalDimmer.fillRect(0, 0, screenWidth, screenHeight);
    }

    if (this.pauseModalContainer) {
      const pDialog = (this.pauseModalContainer as any).__dialog;
      const pDimmer = (this.pauseModalContainer as any).__dimmer;
      if (pDialog) pDialog.setPosition(screenWidth / 2, screenHeight / 2);
      if (pDimmer) {
        pDimmer.clear();
        pDimmer.fillStyle(0x000000, 0.7);
        pDimmer.fillRect(0, 0, screenWidth, screenHeight);
      }
    }

    if (this.resultsModalContainer) {
      const rDialog = (this.resultsModalContainer as any).__dialog;
      const rDimmer = (this.resultsModalContainer as any).__dimmer;
      if (rDialog) rDialog.setPosition(screenWidth / 2, screenHeight / 2);
      if (rDimmer) {
        rDimmer.clear();
        rDimmer.fillStyle(0x000000, 0.78);
        rDimmer.fillRect(0, 0, screenWidth, screenHeight);
      }
    }

    if (this.guideModalContainer) {
      const gDialog = (this.guideModalContainer as any).__dialog;
      const gDimmer = (this.guideModalContainer as any).__dimmer;
      if (gDialog) {
        const guideScale = isPortrait ? Math.min(1, (screenWidth - 24) / 560) : 1.0;
        gDialog.setScale(guideScale);
        gDialog.setPosition(screenWidth / 2, screenHeight / 2);
      }
      if (gDimmer) {
        gDimmer.clear();
        gDimmer.fillStyle(0x000000, 0.82);
        gDimmer.fillRect(0, 0, screenWidth, screenHeight);
      }
    }
  }

  // ==========================================
  // PAUSE MODAL & HANDLERS
  // ==========================================

  public togglePause() {
    if (this.isUpgradeModalOpen || this.isResultsModalOpen) return;
    if (this.isPauseModalOpen) {
      this.closePauseModal();
    } else {
      this.openPauseModal();
    }
  }

  public openPauseModal() {
    if (this.isUpgradeModalOpen || this.isResultsModalOpen || this.isPauseModalOpen) return;
    this.isPauseModalOpen = true;
    if (this.campaignState) {
      this.campaignState.isPaused = true;
    }

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
      shop.player.clearMovementInput();
    }

    this.pauseModalContainer?.setVisible(true);
  }

  public closePauseModal() {
    if (!this.isPauseModalOpen) return;
    this.isPauseModalOpen = false;
    if (this.campaignState) {
      this.campaignState.isPaused = false;
    }
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = false;
      shop.player.clearMovementInput();
    }
    this.pauseModalContainer?.setVisible(false);
  }

  private buildPauseModal() {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    this.pauseModalContainer = this.add.container(0, 0);
    this.pauseModalContainer.setDepth(14000);

    const dimmer = this.add.graphics();
    dimmer.fillStyle(0x000000, 0.7);
    dimmer.fillRect(0, 0, Math.max(width, 1920), Math.max(height, 1080));
    dimmer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, Math.max(width, 1920), Math.max(height, 1080)),
      Phaser.Geom.Rectangle.Contains
    );
    dimmer.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.togglePause();
    });
    this.pauseModalContainer.add(dimmer);

    const dialog = this.add.container(width / 2, height / 2);
    (this.pauseModalContainer as any).__dialog = dialog;
    (this.pauseModalContainer as any).__dimmer = dimmer;

    const bg = this.add.graphics();
    bg.fillStyle(0x180d07, 0.98);
    bg.fillRoundedRect(-200, -135, 400, 270, 10);
    bg.lineStyle(2, 0xffb300, 1);
    bg.strokeRoundedRect(-200, -135, 400, 270, 10);

    const title = this.add.text(0, -98, '⏸️ FESTIVAL PAUSED', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '18px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -68, 'Simulation frozen (timers, cooking, packing, customers)', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#b0bec5'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.add.container(0, -20);
    const resumeBg = this.add.graphics();
    resumeBg.fillStyle(0x2e7d32, 0.95);
    resumeBg.fillRoundedRect(-120, -18, 240, 36, 6);
    resumeBg.lineStyle(1.5, 0x81c784, 1);
    resumeBg.strokeRoundedRect(-120, -18, 240, 36, 6);

    const resumeTxt = this.add.text(0, 0, '▶ Resume Service [P / Esc]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    resumeBtn.add([resumeBg, resumeTxt]);
    resumeBtn.setSize(240, 36);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.togglePause();
    });

    // How to Play button
    const howToPlayBtn = this.add.container(0, 26);
    const howToPlayBg = this.add.graphics();
    howToPlayBg.fillStyle(0xd97706, 0.95);
    howToPlayBg.fillRoundedRect(-120, -18, 240, 36, 6);
    howToPlayBg.lineStyle(1.5, 0xfcd34d, 1);
    howToPlayBg.strokeRoundedRect(-120, -18, 240, 36, 6);

    const howToPlayTxt = this.add.text(0, 0, '📖 How to Play', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    howToPlayBtn.add([howToPlayBg, howToPlayTxt]);
    howToPlayBtn.setSize(240, 36);
    howToPlayBtn.setInteractive({ useHandCursor: true });
    howToPlayBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closePauseModal();
      this.openGuideModal();
    });

    // Restart button
    const restartBtn = this.add.container(0, 72);
    const restartBg = this.add.graphics();
    restartBg.fillStyle(0xb71c1c, 0.95);
    restartBg.fillRoundedRect(-120, -18, 240, 36, 6);
    restartBg.lineStyle(1.5, 0xff8a80, 1);
    restartBg.strokeRoundedRect(-120, -18, 240, 36, 6);

    const restartTxt = this.add.text(0, 0, '↺ Restart Festival', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    restartBtn.add([restartBg, restartTxt]);
    restartBtn.setSize(240, 36);
    restartBtn.setInteractive({ useHandCursor: true });
    restartBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      (this.scene.get('ShopScene') as ShopScene).restartGame();
    });

    dialog.add([bg, title, subtitle, resumeBtn, howToPlayBtn, restartBtn]);
    this.pauseModalContainer.add(dialog);
    this.pauseModalContainer.setVisible(false);
  }

  // ==========================================
  // GUIDE MODAL & HANDLERS
  // ==========================================

  public openGuideModal() {
    if (this.isResultsModalOpen) return;
    this.isGuideModalOpen = true;
    this.hasShownOpeningGuide = true;

    if (this.campaignState) {
      this.campaignState.isPaused = true;
    }

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
      shop.player.clearMovementInput();
    }

    this.guideModalContainer?.setVisible(true);
  }

  public closeGuideModal() {
    if (!this.isGuideModalOpen) return;
    this.isGuideModalOpen = false;

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      if (!this.isPauseModalOpen && !this.isUpgradeModalOpen && !this.isResultsModalOpen) {
        shop.player.isInputBlocked = false;
      }
      shop.player.clearMovementInput();
    }

    if (this.campaignState && !this.isPauseModalOpen && !this.isUpgradeModalOpen && !this.isResultsModalOpen) {
      this.campaignState.isPaused = false;
    }

    this.guideModalContainer?.setVisible(false);
  }

  private buildGuideModal() {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    this.guideModalContainer = this.add.container(0, 0);
    this.guideModalContainer.setDepth(15000);

    const dimmer = this.add.graphics();
    dimmer.fillStyle(0x000000, 0.82);
    dimmer.fillRect(0, 0, Math.max(width, 1920), Math.max(height, 1080));
    dimmer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, Math.max(width, 1920), Math.max(height, 1080)),
      Phaser.Geom.Rectangle.Contains
    );
    dimmer.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closeGuideModal();
    });
    this.guideModalContainer.add(dimmer);

    const dialog = this.add.container(width / 2, height / 2);
    (this.guideModalContainer as any).__dialog = dialog;
    (this.guideModalContainer as any).__dimmer = dimmer;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a0f07, 0.98);
    bg.fillRoundedRect(-270, -225, 540, 450, 12);
    bg.lineStyle(2.5, 0xffb300, 1);
    bg.strokeRoundedRect(-270, -225, 540, 450, 12);

    bg.lineStyle(1, 0x5d4037, 0.6);
    bg.strokeRoundedRect(-264, -219, 528, 438, 8);

    const title = this.add.text(0, -196, 'WELCOME TO MODAK MAHAL', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '20px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -172, 'Ganesh Chaturthi Special Service', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#d7ccc8'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(244, -200, '✕', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      color: '#b0bec5',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closeGuideModal();
    });

    const platterScale = 170 / 1525;
    const platterArt = this.add.image(0, -96, 'raster_modak_platter');
    platterArt.setOrigin(0.49609, 0.50684);
    platterArt.setScale(platterScale);

    const processBg = this.add.graphics();
    processBg.fillStyle(0x28160c, 0.9);
    processBg.fillRoundedRect(-245, -28, 490, 26, 6);
    processBg.lineStyle(1, 0x6d4c41, 0.7);
    processBg.strokeRoundedRect(-245, -28, 490, 26, 6);

    const processText = this.add.text(
      0,
      -15,
      'Buy Ingredients  ➔  Steam Modaks  ➔  Pack Boxes  ➔  Serve Devotees',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffe082',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const finaleBox = this.add.graphics();
    finaleBox.fillStyle(0x20120a, 0.95);
    finaleBox.fillRoundedRect(-245, 8, 490, 74, 8);
    finaleBox.lineStyle(1.5, 0xd97706, 0.9);
    finaleBox.strokeRoundedRect(-245, 8, 490, 74, 8);

    const finaleTitle = this.add.text(0, 22, '⭐ GRAND PANDAL FINALE ⭐', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#f59e0b',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const finaleDesc = this.add.text(
      0,
      44,
      'Own all 4 Mahal upgrades, then deliver 12 packed modak boxes before closing time.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffffff'
      }
    ).setOrigin(0.5);

    const finaleHighlight = this.add.text(
      0,
      64,
      'Important: The target is 12 PACKED BOXES, not 12 individual modaks.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#81c784',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const controlsBg = this.add.graphics();
    controlsBg.fillStyle(0x28160c, 0.85);
    controlsBg.fillRoundedRect(-245, 92, 490, 26, 6);
    controlsBg.lineStyle(1, 0x4e342e, 0.6);
    controlsBg.strokeRoundedRect(-245, 92, 490, 26, 6);

    const controlsText = this.add.text(
      0,
      105,
      'Move: WASD / Arrow Keys   •   Interact: Walk close / [E]   •   Pause: [P] / [Esc]',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#cfd8dc'
      }
    ).setOrigin(0.5);

    const startBtn = this.add.container(0, 150);
    const startBtnBg = this.add.graphics();
    startBtnBg.fillStyle(0x2e7d32, 0.95);
    startBtnBg.fillRoundedRect(-120, -20, 240, 40, 8);
    startBtnBg.lineStyle(1.5, 0x81c784, 1);
    startBtnBg.strokeRoundedRect(-120, -20, 240, 40, 8);

    const startBtnTxt = this.add.text(0, 0, '▶ START FESTIVAL', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    startBtn.add([startBtnBg, startBtnTxt]);
    startBtn.setSize(240, 40);
    startBtn.setInteractive({ useHandCursor: true });
    startBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closeGuideModal();
    });

    const startHint = this.add.text(0, 186, 'Press [Enter], [Space], or [Esc] to begin', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#9e9e9e'
    }).setOrigin(0.5);

    dialog.add([
      bg,
      title,
      subtitle,
      closeBtn,
      platterArt,
      processBg,
      processText,
      finaleBox,
      finaleTitle,
      finaleDesc,
      finaleHighlight,
      controlsBg,
      controlsText,
      startBtn,
      startHint
    ]);

    this.guideModalContainer.add(dialog);
    this.guideModalContainer.setVisible(false);
  }

  // ==========================================
  // RESULTS MODAL & HANDLERS
  // ==========================================

  public openResultsModal() {
    this.isResultsModalOpen = true;
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
      shop.player.clearMovementInput();
    }

    let snapshot = this.campaignState.finalSnapshot;
    if (!snapshot) {
      snapshot = this.campaignState.finishCampaign(
        this.campaignState.stage === 'VICTORY',
        this.gameState
      );
    }

    const content = (this.resultsModalContainer as any).__content as Phaser.GameObjects.Container;
    const bg = (this.resultsModalContainer as any).__bg as Phaser.GameObjects.Graphics;

    content.removeAll(true);

    const isVictory = snapshot.isVictory;

    // Draw dialog card background (580 x 430)
    bg.clear();
    bg.fillStyle(0x180d07, 0.98);
    bg.fillRoundedRect(-290, -215, 580, 430, 12);
    bg.lineStyle(2.5, isVictory ? 0xffd54f : 0xef5350, 1);
    bg.strokeRoundedRect(-290, -215, 580, 430, 12);

    // Title
    const header = this.add.text(
      0,
      -180,
      isVictory ? '🎉 GRAND PANDAL ORDER DELIVERED! 🎉' : '⏳ FESTIVAL ATTEMPT ENDED',
      {
        fontFamily: 'Yatra One, Outfit, sans-serif',
        fontSize: '17px',
        color: isVictory ? '#ffd54f' : '#ef5350',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // Award badge: only shown on victory; on timeout show the neutral stat title
    const awardBox = this.add.graphics();
    awardBox.fillStyle(isVictory ? 0x1b5e20 : 0x37474f, 0.95);
    awardBox.fillRoundedRect(-180, -155, 360, 26, 6);
    awardBox.lineStyle(1.5, isVictory ? 0x81c784 : 0x90a4ae, 1);
    awardBox.strokeRoundedRect(-180, -155, 360, 26, 6);

    const awardTxt = this.add.text(0, -142, isVictory ? snapshot.awardTitle : 'Festival Attempt Ended — Performance Recorded', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: isVictory ? '#ffffff' : '#b0bec5',
      fontStyle: isVictory ? 'bold' : 'normal'
    }).setOrigin(0.5);

    // Two-column Statistics Panel
    const statsBox = this.add.graphics();
    statsBox.fillStyle(0x24140b, 0.9);
    statsBox.fillRoundedRect(-260, -118, 520, 132, 8);
    statsBox.lineStyle(1, 0x4e342e, 0.8);
    statsBox.strokeRoundedRect(-260, -118, 520, 132, 8);

    const mins = Math.floor(snapshot.completionTimeSeconds / 60);
    const secs = snapshot.completionTimeSeconds % 60;
    const timeStr = `${mins}m ${secs.toString().padStart(2, '0')}s`;

    // Left Column Stats
    const leftText = this.add.text(
      -240,
      -108,
      `⏱️ Time Taken: ${timeStr}\n📦 Boxes Sold: ${snapshot.totalBoxesSold}\n🙏 Devotees Served: ${snapshot.customersServed}\n🚶 Left Unserved: ${snapshot.customersDeparted}`,
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#ffecb3',
        lineSpacing: 8
      }
    );

    // Right Column Stats
    const rightText = this.add.text(
      20,
      -108,
      `💰 Tips Earned: ₹${snapshot.totalTipsEarned}\n★ Final Rating: ${snapshot.finalRating.toFixed(2)}\n⭐ Reviews: 5★ (${snapshot.fiveStarCount})  4★ (${snapshot.fourStarCount})\n🚚 Pandal Delivered: ${snapshot.pandalBoxesDelivered}/12 boxes`,
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#ffecb3',
        lineSpacing: 8
      }
    );

    // Final Festival Score Banner
    const scoreBox = this.add.graphics();
    scoreBox.fillStyle(0x3e2723, 0.95);
    scoreBox.fillRoundedRect(-240, 24, 480, 46, 8);
    scoreBox.lineStyle(2, 0xffd54f, 1);
    scoreBox.strokeRoundedRect(-240, 24, 480, 46, 8);

    const scoreTxt = this.add.text(0, 47, `🏆 FESTIVAL SCORE: ${snapshot.finalScore} PTS`, {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '19px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Subtext message
    const desc = isVictory
      ? 'Lord Ganesha and the town celebrate your exceptional festival service!'
      : 'Closing time arrived before the 12 boxes could be delivered. Upgrade staff earlier to handle the rush and retry!';
    const descTxt = this.add.text(0, 95, desc, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#b0bec5',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    // Action Buttons
    const btnRestart = this.add.container(isVictory ? -110 : 0, 155);
    const btnRestartBg = this.add.graphics();
    btnRestartBg.fillStyle(0xd97706, 0.95);
    btnRestartBg.fillRoundedRect(-95, -19, 190, 38, 6);
    btnRestartBg.lineStyle(1.5, 0xfcd34d, 1);
    btnRestartBg.strokeRoundedRect(-95, -19, 190, 38, 6);

    const btnRestartTxt = this.add.text(0, 0, '↺ Restart Festival', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    btnRestart.add([btnRestartBg, btnRestartTxt]);
    btnRestart.setSize(190, 38);
    btnRestart.setInteractive({ useHandCursor: true });
    btnRestart.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      (this.scene.get('ShopScene') as ShopScene).restartGame();
    });

    content.add([
      header,
      awardBox,
      awardTxt,
      statsBox,
      leftText,
      rightText,
      scoreBox,
      scoreTxt,
      descTxt,
      btnRestart
    ]);

    if (isVictory) {
      const btnContinue = this.add.container(110, 155);
      const btnContinueBg = this.add.graphics();
      btnContinueBg.fillStyle(0x2e7d32, 0.95);
      btnContinueBg.fillRoundedRect(-95, -19, 190, 38, 6);
      btnContinueBg.lineStyle(1.5, 0x81c784, 1);
      btnContinueBg.strokeRoundedRect(-95, -19, 190, 38, 6);

      const btnContinueTxt = this.add.text(0, 0, '🌟 Continue Growing', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      btnContinue.add([btnContinueBg, btnContinueTxt]);
      btnContinue.setSize(190, 38);
      btnContinue.setInteractive({ useHandCursor: true });
      btnContinue.on('pointerdown', (p: Phaser.Input.Pointer) => {
        p.event?.stopPropagation();
        this.closeResultsModal();
        this.campaignState.continueGrowing();
        if (shop?.player) {
          shop.player.isInputBlocked = false;
          shop.player.clearMovementInput();
        }
      });
      content.add(btnContinue);
    }

    this.resultsModalContainer.setVisible(true);
  }

  public closeResultsModal() {
    this.isResultsModalOpen = false;
    this.resultsModalContainer?.setVisible(false);
  }

  private buildResultsModal() {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    this.resultsModalContainer = this.add.container(0, 0);
    this.resultsModalContainer.setDepth(15000);

    const dimmer = this.add.graphics();
    dimmer.fillStyle(0x000000, 0.78);
    dimmer.fillRect(0, 0, Math.max(width, 1920), Math.max(height, 1080));
    dimmer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, Math.max(width, 1920), Math.max(height, 1080)),
      Phaser.Geom.Rectangle.Contains
    );
    dimmer.on('pointerdown', (p: Phaser.Input.Pointer) => p.event?.stopPropagation());
    this.resultsModalContainer.add(dimmer);

    const dialog = this.add.container(width / 2, height / 2);
    (this.resultsModalContainer as any).__dialog = dialog;
    (this.resultsModalContainer as any).__dimmer = dimmer;

    const bg = this.add.graphics();
    dialog.add(bg);
    (this.resultsModalContainer as any).__bg = bg;

    const content = this.add.container(0, 0);
    dialog.add(content);
    (this.resultsModalContainer as any).__content = content;

    this.resultsModalContainer.add(dialog);
    this.resultsModalContainer.setVisible(false);
  }

  // ==========================================
  // UPGRADE MODAL & KEYBOARD
  // ==========================================

  private buildUpgradeModal() {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;
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
    this.modalContainer.setDepth(10000);

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

    this.dialogContainer = this.add.container(centerX, centerY);
    this.dialogBg = this.add.graphics();
    this.dialogContainer.add(this.dialogBg);

    const dialogHitArea = this.add.zone(0, 0, 560, 370);
    dialogHitArea.setInteractive();
    dialogHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
    });
    this.dialogContainer.add(dialogHitArea);

    const titleText = this.add.text(0, -150, '✨ FESTIVAL UPGRADES & STAFF ✨', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '17px',
      color: '#ffd54f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.dialogContainer.add(titleText);

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
    }).setOrigin(0.5);

    closeBtnContainer.add([closeBtnBg, closeBtnText]);
    closeBtnContainer.setSize(64, 28);
    closeBtnContainer.setInteractive({ useHandCursor: true });
    closeBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.closeUpgradeModal();
    });
    this.dialogContainer.add(closeBtnContainer);

    const subtitle = this.add.text(
      0,
      -120,
      '🛡️ Working-Capital Reserve: Must keep at least ₹12 to restock ingredients.',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffcc80'
      }
    ).setOrigin(0.5);
    this.dialogContainer.add(subtitle);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0xff8f00, 0.5);
    divider.lineBetween(-260, -104, 260, -104);
    this.dialogContainer.add(divider);

    const rowYPositions = [-68, -13, 42, 97];
    for (let i = 0; i < this.upgradeItems.length; i++) {
      const item = this.upgradeItems[i];
      const rowY = rowYPositions[i];
      const rowContainer = this.add.container(0, rowY);

      const rowBg = this.add.graphics();
      rowContainer.add(rowBg);

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
      }).setOrigin(0.5);
      rowContainer.add([badgeBg, badgeText]);

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

      const btnContainer = this.add.container(185, 0);
      const btnBg = this.add.graphics();
      const btnText = this.add.text(0, 0, `₹${item.cost}`, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

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

    const pandalGoalLine = this.add.text(
      0,
      126,
      'Own all 4 upgrades to unlock the Grand Pandal order • 12 packed boxes',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#f59e0b',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    this.dialogContainer.add(pandalGoalLine);

    const footer = this.add.text(
      0,
      152,
      'Press [1] - [4] on keyboard to purchase  |  [Esc] or [✕] to close',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '11px',
        color: '#9e9e9e'
      }
    ).setOrigin(0.5);
    this.dialogContainer.add(footer);

    this.modalContainer.add(this.dialogContainer);
    this.modalContainer.setVisible(false);

    this.updateUpgradeModal();
  }

  public openUpgradeModal() {
    if (this.isResultsModalOpen || this.isPauseModalOpen || this.isUpgradeModalOpen) return;
    this.isUpgradeModalOpen = true;
    this.modalContainer.setVisible(true);

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
      shop.player.clearMovementInput();
    }
    shop?.upgradeStation?.syncPrompt(true);

    if (this.campaignState) {
      this.campaignState.isPaused = true;
    }

    this.updateUpgradeModal();
  }

  public closeUpgradeModal() {
    if (!this.isUpgradeModalOpen) return;
    this.isUpgradeModalOpen = false;
    this.modalContainer.setVisible(false);

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      if (!this.isPauseModalOpen && !this.isResultsModalOpen) {
        shop.player.isInputBlocked = false;
      }
      shop.player.clearMovementInput();
    }
    shop?.upgradeStation?.syncPrompt(false);

    if (this.campaignState && !this.isPauseModalOpen && !this.isResultsModalOpen) {
      this.campaignState.isPaused = false;
    }
  }

  public handleModalKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;

    const isP = event.code === 'KeyP' || event.key === 'p' || event.key === 'P';
    const isEsc = event.code === 'Escape' || event.key === 'Escape';

    // A. Results modal open:
    // Ignore P and Escape unless an explicitly supported results action exists.
    if (this.isResultsModalOpen) {
      return;
    }

    // B. Guide modal open:
    // - Enter, Space, or Escape closes the guide without opening Pause.
    // - P does nothing.
    if (this.isGuideModalOpen) {
      if (
        event.code === 'Enter' ||
        event.code === 'NumpadEnter' ||
        event.code === 'Space' ||
        event.key === ' ' ||
        isEsc
      ) {
        this.closeGuideModal();
        return;
      }
      if (isP) {
        return;
      }
      return;
    }

    // C. Upgrade modal open:
    // - Escape closes only the Upgrade modal.
    // - P does nothing.
    // - Number keys continue purchasing upgrades.
    // - The same Escape press must never open Pause.
    if (this.isUpgradeModalOpen) {
      if (isEsc) {
        this.closeUpgradeModal();
        return;
      }
      if (isP) {
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
      return;
    }

    // D. Pause modal open:
    // - P or Escape resumes the game.
    // - Upgrade keys do nothing.
    if (this.isPauseModalOpen) {
      if (isP || isEsc) {
        this.closePauseModal();
      }
      return;
    }

    // E. No modal open:
    // - P or Escape opens Pause.
    if (isP || isEsc) {
      this.openPauseModal();
      return;
    }
  }

  public updateUpgradeModal() {
    if (!this.dialogBg) return;

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

      rowBg.clear();
      rowBg.fillStyle(isUnlocked ? 0x1b5e20 : 0x241208, isUnlocked ? 0.35 : 0.85);
      rowBg.fillRoundedRect(-260, -22, 520, 44, 6);
      rowBg.lineStyle(1, isUnlocked ? 0x81c784 : 0x4e342e, isUnlocked ? 0.8 : 0.5);
      rowBg.strokeRoundedRect(-260, -22, 520, 44, 6);

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
      const shop = this.scene.get('ShopScene') as ShopScene;
      if (shop?.upgradeStation) {
        shop.upgradeStation.playPurchaseBounce();
      }
      this.campaignState?.onUpgradePurchased(this.gameState);
      this.updateUpgradeModal();
      this.updateHUD();
    }
  }
}
