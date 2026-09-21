import Phaser from 'phaser';
import { topLeftButtonHitArea } from '../utils/buttonHitArea';
import { GameState } from '../state/GameState.ts';
import { CampaignState } from '../state/CampaignState.ts';
import { ShopScene } from './ShopScene.ts';
import { COLORS, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/layout.ts';
import {
  calculateJoystickVector,
  getMobileControlPositions,
  getTourCardLayout,
  isMobileLayout,
  isFullscreenActive,
  isFullscreenSupported,
  TOUR_STEPS,
  shouldShowLandscapeRecommendation,
  dismissLandscapeRecommendation
} from '../utils/mobileControls.ts';
import { audioManager } from '../utils/audioManager.ts';

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

  // Desktop Sound Toggle Button
  public desktopSoundBtnContainer!: Phaser.GameObjects.Container;
  private desktopSoundBg!: Phaser.GameObjects.Graphics;
  private desktopSoundIcon!: Phaser.GameObjects.Graphics;

  // Mobile Top Bar Pause, Fullscreen & Sound Buttons
  public mobilePauseBtnContainer!: Phaser.GameObjects.Container;
  private mobilePauseBg!: Phaser.GameObjects.Graphics;
  private mobilePauseLabel!: Phaser.GameObjects.Text;

  public mobileFullscreenBtnContainer!: Phaser.GameObjects.Container;
  private mobileFullscreenBg!: Phaser.GameObjects.Graphics;
  private mobileFullscreenIcon!: Phaser.GameObjects.Graphics;
  private onFullscreenChangeHandler: (() => void) | null = null;

  public mobileSoundBtnContainer!: Phaser.GameObjects.Container;
  private mobileSoundBg!: Phaser.GameObjects.Graphics;
  private mobileSoundIcon!: Phaser.GameObjects.Graphics;
  private unsubscribeAudio: (() => void) | null = null;

  // Non-blocking Toast Notification
  private toastContainer!: Phaser.GameObjects.Container;
  private toastBg!: Phaser.GameObjects.Graphics;
  private toastText!: Phaser.GameObjects.Text;
  private toastTimerEvent: Phaser.Time.TimerEvent | null = null;

  // Mobile Virtual Joystick
  public joystickContainer!: Phaser.GameObjects.Container;
  private joystickBase!: Phaser.GameObjects.Graphics;
  private joystickKnob!: Phaser.GameObjects.Graphics;
  private joystickPointerId: number | null = null;
  private joystickBaseX = 90;
  private joystickBaseY = 460;
  private readonly joystickRadius = 46;
  private readonly joystickKnobRadius = 23;
  private readonly joystickDeadZone = 8;

  // Mobile Contextual ACTION Button
  public mobileActionContainer!: Phaser.GameObjects.Container;
  private mobileActionBg!: Phaser.GameObjects.Graphics;
  private mobileActionText!: Phaser.GameObjects.Text;
  private mobileActionSubtext!: Phaser.GameObjects.Text;
  public isMobileActionActive = false;

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
  private onWindowBlurHandler: (() => void) | null = null;
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

  // Landscape recommendation toast
  private landscapeRecommendContainer: Phaser.GameObjects.Container | null = null;
  private landscapeRecommendShownOnce = false;

  // Station Tour / Guide Modal
  public isTourActive = false;
  public isGuideModalOpen = false;
  public currentTourStepIndex = 0;
  public hasShownOpeningGuide = false;
  public tourContainer!: Phaser.GameObjects.Container;
  public guideModalContainer!: Phaser.GameObjects.Container;
  private tourDimmer!: Phaser.GameObjects.Graphics;
  private tourCardContainer!: Phaser.GameObjects.Container;
  private tourCardBg!: Phaser.GameObjects.Graphics;
  private tourStepPillText!: Phaser.GameObjects.Text;
  private tourTitleText!: Phaser.GameObjects.Text;
  private tourDescText!: Phaser.GameObjects.Text;
  private tourTipText!: Phaser.GameObjects.Text;
  private tourBackBtn!: Phaser.GameObjects.Container;
  private tourBackBg!: Phaser.GameObjects.Graphics;
  private tourBackTxt!: Phaser.GameObjects.Text;
  private tourSkipBtn!: Phaser.GameObjects.Container;
  private tourSkipBg!: Phaser.GameObjects.Graphics;
  private tourSkipTxt!: Phaser.GameObjects.Text;
  private tourNextBtn!: Phaser.GameObjects.Container;
  private tourNextBg!: Phaser.GameObjects.Graphics;
  private tourNextTxt!: Phaser.GameObjects.Text;
  private tourCloseXBtn!: Phaser.GameObjects.Text;

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
    this.pauseBtnContainer.setInteractive({ useHandCursor: true, hitArea: topLeftButtonHitArea(42, 36), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.pauseBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.togglePause();
    });

    // --- Desktop Sound Toggle Button ---
    this.desktopSoundBtnContainer = this.add.container(692, 10);
    this.desktopSoundBg = this.add.graphics();
    this.desktopSoundBg.fillStyle(0xfffdf7, 1);
    this.desktopSoundBg.fillRoundedRect(0, 0, 42, 36, 8);
    this.desktopSoundBg.lineStyle(1.5, 0x45362e, 0.6);
    this.desktopSoundBg.strokeRoundedRect(0, 0, 42, 36, 8);

    this.desktopSoundIcon = this.add.graphics();
    this.drawSoundIcon(this.desktopSoundIcon, audioManager.isMuted);

    this.desktopSoundBtnContainer.add([this.desktopSoundBg, this.desktopSoundIcon]);
    this.desktopSoundBtnContainer.setSize(42, 36);
    this.desktopSoundBtnContainer.setInteractive({ useHandCursor: true, hitArea: topLeftButtonHitArea(42, 36), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.desktopSoundBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      audioManager.onFirstInteraction('desktop_sound_toggle');
      audioManager.toggleMute();
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
      this.desktopSoundBtnContainer,
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

    // Mobile Top Bar Pause Button (min 44x44 touch hit area)
    this.mobilePauseBtnContainer = this.add.container(screenW - 48, 7);
    this.mobilePauseBg = this.add.graphics();
    this.mobilePauseBg.fillStyle(0xfffdf7, 1);
    this.mobilePauseBg.fillRoundedRect(0, 0, 42, 38, 8);
    this.mobilePauseBg.lineStyle(1.5, 0x45362e, 0.65);
    this.mobilePauseBg.strokeRoundedRect(0, 0, 42, 38, 8);

    this.mobilePauseLabel = this.add.text(21, 19, '❚❚', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      color: '#45362e',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);

    this.mobilePauseBtnContainer.add([this.mobilePauseBg, this.mobilePauseLabel]);
    this.mobilePauseBtnContainer.setSize(44, 44);
    this.mobilePauseBtnContainer.setInteractive({ useHandCursor: true, hitArea: topLeftButtonHitArea(44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.mobilePauseBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.togglePause();
    });
    this.mobilePauseBtnContainer.setDepth(5500);
    this.mobilePauseBtnContainer.setVisible(false);

    // Mobile Top Bar Fullscreen Button (min 44x44 touch hit area)
    this.mobileFullscreenBtnContainer = this.add.container(screenW - 96, 7);
    this.mobileFullscreenBg = this.add.graphics();
    this.mobileFullscreenBg.fillStyle(0xfffdf7, 1);
    this.mobileFullscreenBg.fillRoundedRect(0, 0, 42, 38, 8);
    this.mobileFullscreenBg.lineStyle(1.5, 0x45362e, 0.65);
    this.mobileFullscreenBg.strokeRoundedRect(0, 0, 42, 38, 8);

    this.mobileFullscreenIcon = this.add.graphics();
    this.drawFullscreenIcon(this.isFullscreen());

    this.mobileFullscreenBtnContainer.add([this.mobileFullscreenBg, this.mobileFullscreenIcon]);
    this.mobileFullscreenBtnContainer.setSize(44, 44);
    this.mobileFullscreenBtnContainer.setInteractive({ useHandCursor: true, hitArea: topLeftButtonHitArea(44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.mobileFullscreenBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.toggleFullscreen();
    });
    this.mobileFullscreenBtnContainer.setDepth(5500);
    this.mobileFullscreenBtnContainer.setVisible(false);

    // Mobile Top Bar Sound Toggle Button (min 44x44 touch hit area)
    this.mobileSoundBtnContainer = this.add.container(screenW - 144, 7);
    this.mobileSoundBg = this.add.graphics();
    this.mobileSoundBg.fillStyle(0xfffdf7, 1);
    this.mobileSoundBg.fillRoundedRect(0, 0, 42, 38, 8);
    this.mobileSoundBg.lineStyle(1.5, 0x45362e, 0.65);
    this.mobileSoundBg.strokeRoundedRect(0, 0, 42, 38, 8);

    this.mobileSoundIcon = this.add.graphics();
    this.drawSoundIcon(this.mobileSoundIcon, audioManager.isMuted);

    this.mobileSoundBtnContainer.add([this.mobileSoundBg, this.mobileSoundIcon]);
    this.mobileSoundBtnContainer.setSize(44, 44);
    this.mobileSoundBtnContainer.setInteractive({ useHandCursor: true, hitArea: topLeftButtonHitArea(44, 44), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    this.mobileSoundBtnContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      audioManager.onFirstInteraction('mobile_sound_toggle');
      audioManager.toggleMute();
    });
    this.mobileSoundBtnContainer.setDepth(5500);
    this.mobileSoundBtnContainer.setVisible(false);

    // Non-blocking toast notification container
    this.toastContainer = this.add.container(screenW / 2, 76);
    this.toastBg = this.add.graphics();
    this.toastText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);
    this.toastContainer.add([this.toastBg, this.toastText]);
    this.toastContainer.setDepth(20000);
    this.toastContainer.setVisible(false);

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

    // Controls text (desktop only)
    this.controlsText = this.add.text(
      screenW / 2,
      screenH - 20,
      'Move: WASD/Arrows • Interact: Walk close/E • Pause: P/Esc • Sound: M',
      {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '12px',
        color: '#45362e',
        backgroundColor: '#fffdf7',
        padding: { x: 12, y: 4 }
      }
    ).setOrigin(0.5).setResolution(2);

    // Build mobile virtual joystick & contextual action controls
    // Enable multi-pointer tracking so joystick + action button can be used simultaneously
    this.input.addPointer(2);
    this.buildMobileControls();

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

    // Subscribe to AudioManager mute changes to keep icons synchronized
    this.unsubscribeAudio = audioManager.subscribe((muted: boolean) => {
      if (this.desktopSoundIcon) this.drawSoundIcon(this.desktopSoundIcon, muted);
      if (this.mobileSoundIcon) this.drawSoundIcon(this.mobileSoundIcon, muted);
    });

    // Show opening station tour on initial onboarding, but do not force returning players
    const tourSeen = typeof localStorage !== 'undefined' && localStorage.getItem('modak_mahal_tour_seen') === 'true';
    if (!tourSeen && !this.hasShownOpeningGuide && (!this.campaignState || this.campaignState.stage === 'ONBOARDING')) {
      this.hasShownOpeningGuide = true;
      this.startStationTour(0);
    }
    // Single authoritative keyboard listener with shutdown/destroy cleanup
    this.cleanupKeyboard();
    this.onKeyDownHandler = (event: KeyboardEvent) => {
      this.handleModalKeyDown(event);
    };
    this.input.keyboard?.on('keydown', this.onKeyDownHandler);

    // Fullscreen change listener to sync button state, reset joystick, and resize HUD
    this.onFullscreenChangeHandler = () => {
      this.updateFullscreenButtonState();
      this.resetJoystick();
      this.updateResponsiveHud(this.scale.gameSize);
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChangeHandler);
      document.addEventListener('webkitfullscreenchange', this.onFullscreenChangeHandler);
      document.addEventListener('mozfullscreenchange', this.onFullscreenChangeHandler);
      document.addEventListener('MSFullscreenChange', this.onFullscreenChangeHandler);
    }

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
    if (this.onWindowBlurHandler) {
      window.removeEventListener('blur', this.onWindowBlurHandler);
      this.onWindowBlurHandler = null;
    }
    if (this.onFullscreenChangeHandler && typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.onFullscreenChangeHandler);
      document.removeEventListener('webkitfullscreenchange', this.onFullscreenChangeHandler);
      document.removeEventListener('mozfullscreenchange', this.onFullscreenChangeHandler);
      document.removeEventListener('MSFullscreenChange', this.onFullscreenChangeHandler);
      this.onFullscreenChangeHandler = null;
    }
    if (this.toastTimerEvent) {
      this.toastTimerEvent.remove();
      this.toastTimerEvent = null;
    }
    if (this.unsubscribeAudio) {
      this.unsubscribeAudio();
      this.unsubscribeAudio = null;
    }
    this.resetJoystick();
    this.scale.off(Phaser.Scale.Events.RESIZE, this.updateResponsiveHud, this);
  }

  public get hasCoarseOrTouch(): boolean {
    return typeof window !== 'undefined' && (
      window.matchMedia?.('(pointer: coarse)').matches ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)
    );
  }

  public isMobileActive(): boolean {
    return isMobileLayout(this.scale.gameSize.width, this.scale.gameSize.height, this.hasCoarseOrTouch);
  }

  public areModalsOpen(): boolean {
    return (
      this.isTourActive ||
      this.isGuideModalOpen ||
      this.isUpgradeModalOpen ||
      this.isPauseModalOpen ||
      this.isResultsModalOpen
    );
  }

  public updateControlsVisibility() {
    const isMobile = this.isMobileActive();
    const modalsOpen = this.areModalsOpen();
    const isPlayable = !modalsOpen && !(this.campaignState?.stage === 'VICTORY' || this.campaignState?.stage === 'TIME_EXPIRED');

    if (this.joystickContainer) {
      this.joystickContainer.setVisible(isMobile && isPlayable);
    }
    if (this.mobileActionContainer) {
      this.mobileActionContainer.setVisible(isMobile && isPlayable && this.isMobileActionActive);
    }
    if (this.mobilePauseBtnContainer) {
      this.mobilePauseBtnContainer.setVisible(
        isMobile && !this.isResultsModalOpen && !this.isTourActive && !this.isGuideModalOpen && !this.isUpgradeModalOpen
      );
    }
    if (this.mobileFullscreenBtnContainer) {
      this.mobileFullscreenBtnContainer.setVisible(
        isMobile && !this.isResultsModalOpen && !this.isTourActive && !this.isGuideModalOpen && !this.isUpgradeModalOpen
      );
    }
    if (this.mobileSoundBtnContainer) {
      this.mobileSoundBtnContainer.setVisible(
        isMobile && !this.isResultsModalOpen && !this.isTourActive && !this.isGuideModalOpen && !this.isUpgradeModalOpen
      );
    }
  }

  private buildMobileControls() {
    // Virtual Joystick container
    this.joystickContainer = this.add.container(this.joystickBaseX, this.joystickBaseY);
    this.joystickContainer.setDepth(6000);

    this.joystickBase = this.add.graphics();
    this.joystickBase.fillStyle(0x2b1d16, 0.55);
    this.joystickBase.fillCircle(0, 0, this.joystickRadius);
    this.joystickBase.lineStyle(2, 0xd4a359, 0.85);
    this.joystickBase.strokeCircle(0, 0, this.joystickRadius);
    this.joystickBase.lineStyle(1, 0xffd54f, 0.25);
    this.joystickBase.strokeCircle(0, 0, 16);

    this.joystickKnob = this.add.graphics();
    this.joystickKnob.fillStyle(0xe99527, 0.9);
    this.joystickKnob.fillCircle(0, 0, this.joystickKnobRadius);
    this.joystickKnob.lineStyle(2, 0xffe082, 1);
    this.joystickKnob.strokeCircle(0, 0, this.joystickKnobRadius);
    this.joystickKnob.fillStyle(0xfff9c4, 0.7);
    this.joystickKnob.fillCircle(-4, -4, 6);

    this.joystickContainer.add([this.joystickBase, this.joystickKnob]);
    this.joystickContainer.setVisible(false);

    // Mobile Contextual ACTION Button
    this.mobileActionContainer = this.add.container(0, 0);
    this.mobileActionContainer.setDepth(6000);

    this.mobileActionBg = this.add.graphics();
    this.mobileActionBg.fillStyle(0x2e7d32, 0.95);
    this.mobileActionBg.fillCircle(0, 0, 36);
    this.mobileActionBg.lineStyle(2.5, 0xffd54f, 1);
    this.mobileActionBg.strokeCircle(0, 0, 36);

    this.mobileActionText = this.add.text(0, -6, 'BUY', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);

    this.mobileActionSubtext = this.add.text(0, 10, '₹12', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '9.5px',
      color: '#ffd54f',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setResolution(2);

    this.mobileActionContainer.add([
      this.mobileActionBg,
      this.mobileActionText,
      this.mobileActionSubtext
    ]);
    this.mobileActionContainer.setSize(72, 72);
    this.mobileActionContainer.setInteractive({ useHandCursor: true });
    this.mobileActionContainer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.handleMobileAction();
    });
    this.mobileActionContainer.setVisible(false);

    // Pointer event listeners for joystick tracking
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isMobileActive() || this.areModalsOpen()) return;
      const dist = Math.hypot(pointer.x - this.joystickBaseX, pointer.y - this.joystickBaseY);
      if (dist <= 70 && this.joystickPointerId === null) {
        this.joystickPointerId = pointer.id;
        this.updateJoystickPosition(pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId === pointer.id) {
        this.updateJoystickPosition(pointer.x, pointer.y);
      }
    });

    const resetIfJoystick = (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointerId === pointer.id) {
        this.resetJoystick();
      }
    };

    this.input.on('pointerup', resetIfJoystick);
    this.input.on('pointerupoutside', resetIfJoystick);
    this.input.on('gameout', () => this.resetJoystick());

    this.onWindowBlurHandler = () => this.resetJoystick();
    window.addEventListener('blur', this.onWindowBlurHandler);
  }

  private updateJoystickPosition(px: number, py: number) {
    const dx = px - this.joystickBaseX;
    const dy = py - this.joystickBaseY;
    const vec = calculateJoystickVector(dx, dy, this.joystickRadius, this.joystickDeadZone);

    this.joystickKnob.setPosition(vec.knobX, vec.knobY);

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player && !shop.player.isInputBlocked && !this.areModalsOpen()) {
      shop.player.setVirtualMovement(vec.x, vec.y);
    }
  }

  public resetJoystick() {
    this.joystickPointerId = null;
    if (this.joystickKnob) {
      this.joystickKnob.setPosition(0, 0);
    }
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.clearVirtualMovement();
    }
  }

  public handleMobileAction() {
    if (!this.isMobileActive() || this.areModalsOpen()) return;
    const shop = this.scene.get('ShopScene') as ShopScene;
    if (!shop) return;

    if (shop.ingredientStation?.isPlayerInside) {
      if (this.gameState.carried.type === 'bundle') {
        shop.ingredientStation.attemptReturn();
      } else {
        shop.ingredientStation.attemptBuy();
      }
      this.pulseActionButton();
      return;
    }

    if (shop.upgradeStation?.isPlayerInside) {
      shop.upgradeStation.openModal();
      this.pulseActionButton();
      return;
    }
  }

  private pulseActionButton() {
    this.tweens.add({
      targets: this.mobileActionContainer,
      scale: 0.9,
      duration: 60,
      yoyo: true
    });
  }

  private updateMobileActionState() {
    if (!this.mobileActionContainer) return;
    const isMobile = this.isMobileActive();
    const modalsOpen = this.areModalsOpen();
    const isPlayable = !modalsOpen && !(this.campaignState?.stage === 'VICTORY' || this.campaignState?.stage === 'TIME_EXPIRED');

    if (!isMobile || !isPlayable) {
      this.isMobileActionActive = false;
      this.mobileActionContainer.setVisible(false);
      return;
    }

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (!shop) {
      this.isMobileActionActive = false;
      this.mobileActionContainer.setVisible(false);
      return;
    }

    let label = '';
    let sublabel = '';
    let bgColor = 0x2e7d32;
    let enabled = true;

    if (shop.ingredientStation?.isPlayerInside) {
      const hasBundle = this.gameState.carried.type === 'bundle';
      if (hasBundle) {
        label = 'RETURN';
        sublabel = 'SHELF';
        bgColor = 0x1565c0;
      } else {
        const canAfford = this.gameState.coins >= this.gameState.config.bundleCost;
        label = 'BUY';
        sublabel = `₹${this.gameState.config.bundleCost}`;
        bgColor = canAfford ? 0x2e7d32 : 0x616161;
        enabled = canAfford;
      }
    } else if (shop.upgradeStation?.isPlayerInside) {
      label = 'UPGRADES';
      sublabel = 'DESK';
      bgColor = 0x5d4037;
    }

    if (label) {
      this.isMobileActionActive = true;
      this.mobileActionContainer.setVisible(true);
      this.mobileActionText.setText(label);
      this.mobileActionSubtext.setText(sublabel);

      this.mobileActionBg.clear();
      this.mobileActionBg.fillStyle(bgColor, enabled ? 0.95 : 0.6);
      this.mobileActionBg.fillCircle(0, 0, 36);
      this.mobileActionBg.lineStyle(2.5, enabled ? 0xffd54f : 0x9e9e9e, 1.0);
      this.mobileActionBg.strokeCircle(0, 0, 36);
    } else {
      this.isMobileActionActive = false;
      this.mobileActionContainer.setVisible(false);
    }
  }

  update() {
    this.updateContextualActionCard();
    this.updateMobileActionState();
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

    const isMobile = this.isMobileActive();
    let prompt = '';
    let bgColor = 0x37474f;

    if (isInsideShelf) {
      const hasBundle = this.gameState.carried.type === 'bundle';
      if (isMobile) {
        prompt = hasBundle
          ? 'Supply Shelf • Tap ACTION to return ingredients'
          : `Supply Shelf • Tap ACTION to buy ingredients ₹${this.gameState.config.bundleCost}`;
      } else {
        prompt = hasBundle
          ? 'Supply Shelf • R: Return carried ingredients'
          : `Supply Shelf • E: Buy ingredients ₹${this.gameState.config.bundleCost}`;
      }
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
        prompt = isMobile
          ? 'Steamer 2 (Locked) • Tap ACTION at Upgrade Desk'
          : 'Steamer 2 (Locked) • Upgrade at Desk ₹90';
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
      prompt = isMobile
        ? 'Upgrade Desk • Tap ACTION to open'
        : 'Upgrade Desk • E: Open';
      bgColor = 0x4e342e;
    }

    if (prompt) {
      this.actionCardContainer.setVisible(true);
      const gameSize = this.scale.gameSize;
      const isPortrait = gameSize.height > gameSize.width;
      const maxCardWidth = isMobile
        ? Math.min(gameSize.width - 24, 380)
        : 420;

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

      let cardY = gameSize.height - 52;
      if (isMobile) {
        const pos = getMobileControlPositions(gameSize.width, gameSize.height, isPortrait);
        cardY = pos.actionCard.y;
      }
      this.actionCardContainer.setPosition(gameSize.width / 2, cardY);
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
    let compactObjective = '';
    let timerSnippet = 'Festival Setup';

    if (this.campaignState) {
      const stage = this.campaignState.stage;
      if (stage === 'ONBOARDING') {
        objectiveString = this.gameState.getCurrentObjective().text;
        compactObjective = objectiveString;
        timerSnippet = 'Setup';
      } else if (stage === 'FESTIVAL_OPEN' || stage === 'GROW_BUSINESS') {
        const upCount = this.campaignState.getUpgradeCount(this.gameState);
        objectiveString = `Upgrade the Mahal: ${upCount}/4 (Carry, Packer, Cashier, Steamer 2)`;
        compactObjective = `Upgrades: ${upCount}/4`;
      } else if (stage === 'FESTIVAL_RUSH') {
        const upCount = this.campaignState.getUpgradeCount(this.gameState);
        const rushSecs = Math.ceil(this.campaignState.rushState.timer);
        objectiveString = `Festival Rush! Fast Service (${rushSecs}s) • Upgrades: ${upCount}/4`;
        compactObjective = `Rush (${rushSecs}s) • ${upCount}/4`;
      } else if (stage === 'PANDAL_ORDER') {
        objectiveString = `Grand Pandal Order: ${this.campaignState.pandalBoxesReserved}/${this.campaignState.config.pandalOrderTargetBoxes} packed boxes`;
        compactObjective = `Pandal: ${this.campaignState.pandalBoxesReserved}/12 boxes`;
      } else if (stage === 'DISPATCHING') {
        const dispatchSecs = Math.max(
          0,
          Math.ceil(this.campaignState.config.courierDispatchDurationSeconds - this.campaignState.courierDispatchTimer)
        );
        objectiveString = `Courier Dispatching Grand Pandal Order! (${dispatchSecs}s)`;
        compactObjective = `Dispatching (${dispatchSecs}s)`;
      } else if (stage === 'VICTORY') {
        objectiveString = 'Victory! Grand Pandal Order Delivered!';
        compactObjective = 'Victory!';
        timerSnippet = 'Victory 🎉';
      } else if (stage === 'TIME_EXPIRED') {
        objectiveString = 'The Festival Has Closed.';
        compactObjective = 'Closed';
        timerSnippet = 'Closed ⌛';
      }

      if (stage !== 'ONBOARDING' && stage !== 'VICTORY' && stage !== 'TIME_EXPIRED') {
        const secs = Math.ceil(this.campaignState.timeRemaining);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        timerSnippet = `⏱ ${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
      }
    } else {
      objectiveString = this.gameState.getCurrentObjective().text;
      compactObjective = objectiveString;
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

    // Mobile Top Bar texts
    if (this.mobileTitleText) {
      this.mobileTitleText.setText(`MODAK MAHAL  •  ${timerSnippet}`);
    }

    if (this.mobileSummaryText) {
      const carriedSummary = carried.count > 0 ? `${carried.count} ${carried.type}` : 'Empty';
      this.mobileSummaryText.setText(
        `₹${this.gameState.coins} • ★ ${this.gameState.businessRating.toFixed(1)} • ${carriedSummary} • ${compactObjective}`
      );
    }
  }

  public updateResponsiveHud(gameSize?: Phaser.Structs.Size) {
    const size = gameSize || this.scale.gameSize;
    const screenWidth = size.width;
    const screenHeight = size.height;
    const isMobile = this.isMobileActive();
    const isPortrait = screenHeight > screenWidth;

    this.desktopHudContainer?.setVisible(!isMobile);
    this.mobileHudBg?.setVisible(isMobile);
    this.mobileTitleText?.setVisible(isMobile);
    this.mobileSummaryText?.setVisible(isMobile);
    this.controlsText?.setVisible(!isMobile);

    if (!isMobile) {
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
        this.mobileHudBg.fillRect(0, 0, Math.max(screenWidth, 1920), 54);
        this.mobileHudBg.lineStyle(2, COLORS.brass, 0.85);
        this.mobileHudBg.lineBetween(0, 54, Math.max(screenWidth, 1920), 54);
      }
      if (this.mobileTitleText) {
        this.mobileTitleText.setPosition(12, 8);
      }
      if (this.mobileSummaryText) {
        this.mobileSummaryText.setPosition(12, 30);
        this.mobileSummaryText.setWordWrapWidth(screenWidth - 155);
      }
      const pos = getMobileControlPositions(screenWidth, screenHeight, isPortrait);
      if (this.mobilePauseBtnContainer) {
        this.mobilePauseBtnContainer.setPosition(pos.pauseButton.x, pos.pauseButton.y);
      }
      if (this.mobileFullscreenBtnContainer) {
        this.mobileFullscreenBtnContainer.setPosition(pos.fullscreenButton.x, pos.fullscreenButton.y);
      }
      if (this.mobileSoundBtnContainer) {
        this.mobileSoundBtnContainer.setPosition(pos.soundButton.x, pos.soundButton.y);
      }
      if (this.toastContainer) {
        this.toastContainer.setPosition(screenWidth / 2, isPortrait ? 76 : 108);
      }
    }

    // Position Mobile Virtual Joystick: ergonomic elevated position with downward drag clearance
    const mobilePos = getMobileControlPositions(screenWidth, screenHeight, isPortrait);
    if (this.joystickContainer) {
      this.joystickBaseX = mobilePos.joystick.x;
      this.joystickBaseY = mobilePos.joystick.y;
      this.joystickContainer.setPosition(mobilePos.joystick.x, mobilePos.joystick.y);
    }

    // Position Mobile Action Button: ergonomic pairing with joystick height
    if (this.mobileActionContainer) {
      this.mobileActionContainer.setPosition(mobilePos.actionButton.x, mobilePos.actionButton.y);
    }


    // Modal dialog responsiveness (scaled to fit both width and height)
    if (this.dialogContainer && this.modalDimmer) {
      const modalScale = Math.min(1.0, (screenWidth - 20) / 560, (screenHeight - 20) / 400);
      this.dialogContainer.setScale(modalScale);
      this.dialogContainer.setPosition(screenWidth / 2, screenHeight / 2);
      this.modalDimmer.clear();
      this.modalDimmer.fillStyle(0x000000, 0.7);
      this.modalDimmer.fillRect(0, 0, screenWidth, screenHeight);
    }

    if (this.pauseModalContainer) {
      const pDialog = (this.pauseModalContainer as any).__dialog;
      const pDimmer = (this.pauseModalContainer as any).__dimmer;
      if (pDialog) {
        const pauseScale = Math.min(1.0, (screenWidth - 20) / 420, (screenHeight - 20) / 290);
        pDialog.setScale(pauseScale);
        pDialog.setPosition(screenWidth / 2, screenHeight / 2);
      }
      if (pDimmer) {
        pDimmer.clear();
        pDimmer.fillStyle(0x000000, 0.7);
        pDimmer.fillRect(0, 0, screenWidth, screenHeight);
      }
    }

    if (this.resultsModalContainer) {
      const rDialog = (this.resultsModalContainer as any).__dialog;
      const rDimmer = (this.resultsModalContainer as any).__dimmer;
      if (rDialog) {
        const resultsScale = Math.min(1.0, (screenWidth - 20) / 600, (screenHeight - 20) / 450);
        rDialog.setScale(resultsScale);
        rDialog.setPosition(screenWidth / 2, screenHeight / 2);
      }
      if (rDimmer) {
        rDimmer.clear();
        rDimmer.fillStyle(0x000000, 0.78);
        rDimmer.fillRect(0, 0, screenWidth, screenHeight);
      }
    }

    if (this.isTourActive) {
      this.renderTourStep(this.currentTourStepIndex);
    }

    this.resetJoystick();
    this.updateControlsVisibility();
    this.updateHUD();

    // Show landscape recommendation on first portrait mobile visit
    this._updateLandscapeRecommendation(screenWidth, screenHeight, isMobile, isPortrait);
  }

  /** Shows or hides the landscape recommendation toast based on current orientation. */
  private _updateLandscapeRecommendation(
    screenWidth: number,
    screenHeight: number,
    isMobile: boolean,
    isPortrait: boolean
  ) {
    const shouldShow = isMobile && isPortrait && !this.areModalsOpen() &&
      shouldShowLandscapeRecommendation(screenWidth, screenHeight, this.hasCoarseOrTouch);

    if (shouldShow && !this.landscapeRecommendShownOnce) {
      this.landscapeRecommendShownOnce = true;
      this._showLandscapeRecommendToast(screenWidth, screenHeight);
    } else if (!shouldShow && this.landscapeRecommendContainer) {
      // Hide if orientation switched to landscape or desktop
      this.landscapeRecommendContainer.setVisible(false);
    }
  }

  /**
   * Builds and shows a dismissible, non-blocking landscape recommendation toast.
   * Safe to call multiple times; re-uses the existing container if present.
   */
  private _showLandscapeRecommendToast(screenWidth: number, screenHeight: number) {
    // Destroy any previous instance
    if (this.landscapeRecommendContainer) {
      this.landscapeRecommendContainer.destroy();
      this.landscapeRecommendContainer = null;
    }

    const toastW = Math.min(320, screenWidth - 24);
    const toastH = 70;
    const cx = screenWidth / 2;
    const cy = screenHeight - 220; // above thumb controls

    const container = this.add.container(cx, cy);
    container.setDepth(18000);
    this.landscapeRecommendContainer = container;

    // Background card
    const bg = this.add.graphics();
    bg.fillStyle(0x180d07, 0.93);
    bg.fillRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 10);
    bg.lineStyle(2, 0xc9953d, 0.9);
    bg.strokeRoundedRect(-toastW / 2, -toastH / 2, toastW, toastH, 10);
    container.add(bg);

    // Rotate icon
    const icon = this.add.text(-toastW / 2 + 24, 0, '📱', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '20px'
    }).setOrigin(0.5);
    container.add(icon);

    // Message
    const msg = this.add.text(-toastW / 2 + 52, -10,
      'Landscape recommended for the\nbest Modak Mahal experience.', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffd54f',
      fontStyle: 'bold',
      wordWrap: { width: toastW - 80 }
    }).setResolution(2);
    container.add(msg);

    // Dismiss ✕ button (44×44 touch target)
    const dismissZone = this.add.zone(toastW / 2 - 16, -toastH / 2 + 8, 44, 44)
      .setInteractive({ useHandCursor: true });
    dismissZone.on('pointerup', () => {
      dismissLandscapeRecommendation();
      container.setVisible(false);
    });
    container.add(dismissZone);

    const xLabel = this.add.text(toastW / 2 - 16, -toastH / 2 + 8, '✕', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '14px',
      color: '#c9953d'
    }).setOrigin(0.5).setResolution(2);
    container.add(xLabel);

    // Fade in
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Quad.easeOut'
    });

    // Auto-dismiss after 8 seconds
    this.time.delayedCall(8000, () => {
      if (container.scene) {
        this.tweens.add({
          targets: container,
          alpha: 0,
          duration: 400,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (container.scene) container.setVisible(false);
          }
        });
        dismissLandscapeRecommendation();
      }
    });
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
      this.campaignState.notify();
    }
    audioManager.onPause();

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = true;
      shop.player.clearMovementInput();
    }

    this.resetJoystick();
    this.updateControlsVisibility();
    this.pauseModalContainer?.setVisible(true);
  }

  public closePauseModal() {
    if (!this.isPauseModalOpen) return;
    this.isPauseModalOpen = false;
    if (this.campaignState) {
      this.campaignState.isPaused = false;
      this.campaignState.notify();
    }
    audioManager.onResume();

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop?.player) {
      shop.player.isInputBlocked = false;
      shop.player.clearMovementInput();
    }
    this.pauseModalContainer?.setVisible(false);
    this.updateControlsVisibility();
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
  // STATION TOUR / GUIDE MODAL & HANDLERS
  // ==========================================

  public openGuideModal() {
    this.startStationTour(0);
  }

  public closeGuideModal() {
    this.closeTour();
  }

  public startStationTour(stepIndex = 0) {
    if (this.isResultsModalOpen) return;
    if (this.isPauseModalOpen) {
      this.closePauseModal();
    }
    if (this.isUpgradeModalOpen) {
      this.closeUpgradeModal();
    }
    this.isTourActive = true;
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

    this.resetJoystick();
    this.updateControlsVisibility();
    if (this.tourContainer) {
      this.tourContainer.setVisible(true);
    }
    this.renderTourStep(stepIndex);
  }

  public nextTourStep() {
    audioManager.onFirstInteraction('tour_next');
    if (!this.isTourActive) return;
    if (this.currentTourStepIndex < TOUR_STEPS.length - 1) {
      this.renderTourStep(this.currentTourStepIndex + 1);
    } else {
      this.closeTour();
    }
  }

  public prevTourStep() {
    audioManager.onFirstInteraction('tour_prev');
    if (!this.isTourActive) return;
    if (this.currentTourStepIndex > 0) {
      this.renderTourStep(this.currentTourStepIndex - 1);
    }
  }

  public closeTour() {
    audioManager.onFirstInteraction('tour_close');
    if (!this.isTourActive && !this.isGuideModalOpen) return;
    this.isTourActive = false;
    this.isGuideModalOpen = false;

    // Record that the player intentionally finished or dismissed the tour
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('modak_mahal_tour_seen', 'true');
      } catch {
        // Storage might be restricted in private browsing
      }
    }

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop) {
      shop.clearTourStationHighlight();
      shop.restoreCameraFollow();
      if (shop.player) {
        if (!this.isPauseModalOpen && !this.isUpgradeModalOpen && !this.isResultsModalOpen) {
          shop.player.isInputBlocked = false;
        }
        shop.player.clearMovementInput();
      }
    }

    if (this.campaignState && !this.isPauseModalOpen && !this.isUpgradeModalOpen && !this.isResultsModalOpen) {
      this.campaignState.isPaused = false;
    }

    if (this.tourContainer) {
      this.tourContainer.setVisible(false);
    }
    this.updateControlsVisibility();
  }

  public renderTourStep(stepIndex: number) {
    if (!TOUR_STEPS || TOUR_STEPS.length === 0) return;
    const clampedIndex = Math.max(0, Math.min(TOUR_STEPS.length - 1, stepIndex));
    this.currentTourStepIndex = clampedIndex;
    const step = TOUR_STEPS[clampedIndex];

    const shop = this.scene.get('ShopScene') as ShopScene;
    if (shop) {
      shop.focusCameraOnStation(step.worldPos.x, step.worldPos.y);
      shop.showTourStationHighlight(step.worldPos.x, step.worldPos.y, step.badge);
    }

    if (!this.tourCardContainer) return;

    const screenW = this.scale.gameSize.width;
    const screenH = this.scale.gameSize.height;
    const isPortrait = screenH > screenW;
    const layout = getTourCardLayout(screenW, screenH, isPortrait);

    // Reposition container
    this.tourCardContainer.setPosition(layout.x, layout.y);

    // Redraw card background
    const halfW = layout.width / 2;
    const halfH = layout.height / 2;
    this.tourCardBg.clear();
    this.tourCardBg.fillStyle(0x1a0f07, 0.96);
    this.tourCardBg.fillRoundedRect(-halfW, -halfH, layout.width, layout.height, 10);
    this.tourCardBg.lineStyle(2, 0xffb300, 0.95);
    this.tourCardBg.strokeRoundedRect(-halfW, -halfH, layout.width, layout.height, 10);
    this.tourCardBg.lineStyle(1, 0x5d4037, 0.5);
    this.tourCardBg.strokeRoundedRect(-halfW + 3, -halfH + 3, layout.width - 6, layout.height - 6, 8);

    // Redraw dimmer to match active screen size
    if (this.tourDimmer) {
      this.tourDimmer.clear();
      this.tourDimmer.fillStyle(0x000000, 0.38);
      this.tourDimmer.fillRect(0, 0, Math.max(screenW, 1920), Math.max(screenH, 1080));
    }

    // Step Badge Pill
    this.tourStepPillText.setText(`STEP ${clampedIndex + 1} OF ${TOUR_STEPS.length} • ${step.badge.split(' • ')[1] || step.badge}`);
    this.tourStepPillText.setPosition(-halfW + 14, -halfH + 14);

    // Close button (X)
    this.tourCloseXBtn.setPosition(halfW - 16, -halfH + 14);

    // Station Title
    this.tourTitleText.setText(step.title);
    this.tourTitleText.setPosition(-halfW + 14, -halfH + 30);

    // Description text
    const textAvailableW = layout.width - 28;
    this.tourDescText.setWordWrapWidth(textAvailableW);
    this.tourDescText.setText(step.desc);
    this.tourDescText.setPosition(-halfW + 14, -halfH + 50);

    // Tip / Alert callout
    const descHeight = this.tourDescText.height;
    const tipY = -halfH + 52 + descHeight;
    this.tourTipText.setWordWrapWidth(textAvailableW);
    this.tourTipText.setText(step.tip);
    this.tourTipText.setPosition(-halfW + 14, tipY);

    // Buttons at bottom row: Back, Skip, Next / Play
    const btnY = halfH - 20;
    const isFirstStep = clampedIndex === 0;
    const isLastStep = clampedIndex === TOUR_STEPS.length - 1;

    // Back button
    this.tourBackBtn.setVisible(!isFirstStep);
    this.tourBackBtn.setPosition(-halfW + 46, btnY);

    // Skip button
    this.tourSkipBtn.setVisible(!isLastStep);
    this.tourSkipBtn.setPosition(-halfW + (isFirstStep ? 46 : 126), btnY);

    // Next / Play button
    this.tourNextBtn.setPosition(halfW - 54, btnY);
    if (isLastStep) {
      this.tourNextTxt.setText('▶ Play');
      this.tourNextTxt.setColor('#ffffff');
      this.tourNextBg.clear();
      this.tourNextBg.fillStyle(0x2e7d32, 0.95);
      this.tourNextBg.fillRoundedRect(-44, -14, 88, 28, 6);
      this.tourNextBg.lineStyle(1.5, 0x81c784, 1);
      this.tourNextBg.strokeRoundedRect(-44, -14, 88, 28, 6);
    } else {
      this.tourNextTxt.setText('Next ▶');
      this.tourNextTxt.setColor('#1a0f07');
      this.tourNextBg.clear();
      this.tourNextBg.fillStyle(0xffb300, 0.95);
      this.tourNextBg.fillRoundedRect(-40, -14, 80, 28, 6);
      this.tourNextBg.lineStyle(1.5, 0xffe082, 1);
      this.tourNextBg.strokeRoundedRect(-40, -14, 80, 28, 6);
    }
  }

  private buildGuideModal() {
    const width = LOGICAL_WIDTH;
    const height = LOGICAL_HEIGHT;

    this.tourContainer = this.add.container(0, 0);
    this.tourContainer.setDepth(15000);
    this.guideModalContainer = this.tourContainer;

    // Semi-transparent non-blocking dimmer so world and stations remain visible
    this.tourDimmer = this.add.graphics();
    this.tourDimmer.fillStyle(0x000000, 0.38);
    this.tourDimmer.fillRect(0, 0, Math.max(width, 1920), Math.max(height, 1080));
    this.tourDimmer.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, Math.max(width, 1920), Math.max(height, 1080)),
      Phaser.Geom.Rectangle.Contains
    );
    this.tourDimmer.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
    });
    this.tourContainer.add(this.tourDimmer);

    // Tour Card Container
    this.tourCardContainer = this.add.container(width / 2, height - 90);
    this.tourCardBg = this.add.graphics();
    this.tourCardContainer.add(this.tourCardBg);

    // Pill Step Text
    this.tourStepPillText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffd54f',
      fontStyle: 'bold',
      backgroundColor: '#3e2723',
      padding: { x: 6, y: 2 }
    }).setOrigin(0, 0.5).setResolution(2);

    // Close X Button
    this.tourCloseXBtn = this.add.text(0, 0, '✕', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '15px',
      color: '#b0bec5',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);
    this.tourCloseXBtn.setSize(32, 32);
    this.tourCloseXBtn.setInteractive({ useHandCursor: true });
    this.tourCloseXBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closeTour();
    });

    // Title Text
    this.tourTitleText = this.add.text(0, 0, '', {
      fontFamily: 'Yatra One, Outfit, sans-serif',
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setResolution(2);

    // Description Text
    this.tourDescText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#f5eedc',
      lineSpacing: 2
    }).setOrigin(0, 0).setResolution(2);

    // Tip Callout Text
    this.tourTipText = this.add.text(0, 0, '', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10.5px',
      color: '#81c784',
      fontStyle: 'bold',
      lineSpacing: 2
    }).setOrigin(0, 0).setResolution(2);

    // Back Button Container
    this.tourBackBtn = this.add.container(0, 0);
    this.tourBackBg = this.add.graphics();
    this.tourBackBg.fillStyle(0x3e2723, 0.95);
    this.tourBackBg.fillRoundedRect(-34, -13, 68, 26, 6);
    this.tourBackBg.lineStyle(1.2, 0x8d6e63, 1);
    this.tourBackBg.strokeRoundedRect(-34, -13, 68, 26, 6);
    this.tourBackTxt = this.add.text(0, 0, '◀ Back', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#d7ccc8',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);
    this.tourBackBtn.add([this.tourBackBg, this.tourBackTxt]);
    this.tourBackBtn.setSize(72, 30);
    this.tourBackBtn.setInteractive({ useHandCursor: true });
    this.tourBackBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.prevTourStep();
    });

    // Skip Button Container
    this.tourSkipBtn = this.add.container(0, 0);
    this.tourSkipBg = this.add.graphics();
    this.tourSkipBg.fillStyle(0x271911, 0.9);
    this.tourSkipBg.fillRoundedRect(-36, -13, 72, 26, 6);
    this.tourSkipBg.lineStyle(1.2, 0x6d4c41, 0.8);
    this.tourSkipBg.strokeRoundedRect(-36, -13, 72, 26, 6);
    this.tourSkipTxt = this.add.text(0, 0, 'Skip Tour', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#bcaaa4'
    }).setOrigin(0.5).setResolution(2);
    this.tourSkipBtn.add([this.tourSkipBg, this.tourSkipTxt]);
    this.tourSkipBtn.setSize(76, 30);
    this.tourSkipBtn.setInteractive({ useHandCursor: true });
    this.tourSkipBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.closeTour();
    });

    // Next / Play Button Container
    this.tourNextBtn = this.add.container(0, 0);
    this.tourNextBg = this.add.graphics();
    this.tourNextTxt = this.add.text(0, 0, 'Next ▶', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '12px',
      color: '#1a0f07',
      fontStyle: 'bold'
    }).setOrigin(0.5).setResolution(2);
    this.tourNextBtn.add([this.tourNextBg, this.tourNextTxt]);
    this.tourNextBtn.setSize(88, 30);
    this.tourNextBtn.setInteractive({ useHandCursor: true });
    this.tourNextBtn.on('pointerdown', (p: Phaser.Input.Pointer) => {
      p.event?.stopPropagation();
      this.nextTourStep();
    });

    this.tourCardContainer.add([
      this.tourStepPillText,
      this.tourCloseXBtn,
      this.tourTitleText,
      this.tourDescText,
      this.tourTipText,
      this.tourBackBtn,
      this.tourSkipBtn,
      this.tourNextBtn
    ]);

    this.tourContainer.add(this.tourCardContainer);
    this.tourContainer.setVisible(false);
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
    this.resetJoystick();
    this.updateControlsVisibility();

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

    this.resetJoystick();
    this.updateControlsVisibility();

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

    this.updateControlsVisibility();
  }

  public handleModalKeyDown(event: KeyboardEvent) {
    if (event.repeat) return;

    const isP = event.code === 'KeyP' || event.key === 'p' || event.key === 'P';
    const isEsc = event.code === 'Escape' || event.key === 'Escape';
    const isM = event.code === 'KeyM' || event.key === 'm' || event.key === 'M';

    // First user key interaction triggers lazy audio load
    audioManager.onFirstInteraction('keydown');

    // A. Results modal open:
    // Ignore P and Escape unless an explicitly supported results action exists.
    if (this.isResultsModalOpen) {
      return;
    }

    // Sound toggle key 'M': accessible anytime during tour, upgrade, pause, or normal gameplay
    if (isM) {
      audioManager.toggleMute();
      return;
    }

    // B. Guide / Station Tour modal open:
    // - ArrowRight / Enter / Space advances to next step or begins game
    // - ArrowLeft goes back to previous step
    // - Escape closes/skips tour without opening Pause
    // - P does nothing
    if (this.isTourActive || this.isGuideModalOpen) {
      if (
        event.code === 'ArrowRight' ||
        event.key === 'ArrowRight' ||
        event.code === 'Enter' ||
        event.code === 'NumpadEnter' ||
        event.code === 'Space' ||
        event.key === ' '
      ) {
        this.nextTourStep();
        return;
      }
      if (event.code === 'ArrowLeft' || event.key === 'ArrowLeft') {
        this.prevTourStep();
        return;
      }
      if (isEsc) {
        this.closeTour();
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
      audioManager.playEffect('upgrade');
      const shop = this.scene.get('ShopScene') as ShopScene;
      if (shop?.upgradeStation) {
        shop.upgradeStation.playPurchaseBounce();
      }
      this.campaignState?.onUpgradePurchased(this.gameState);
      this.updateUpgradeModal();
      this.updateHUD();
    }
  }

  // ==========================================
  // FULLSCREEN & TOAST NOTIFICATION HELPERS
  // ==========================================

  public isFullscreen(): boolean {
    return isFullscreenActive();
  }

  public drawFullscreenIcon(isFullscreen: boolean) {
    if (!this.mobileFullscreenIcon) return;
    this.mobileFullscreenIcon.clear();
    this.mobileFullscreenIcon.lineStyle(2, 0x45362e, 0.9);

    if (!isFullscreen) {
      // Enter Fullscreen: 4 outward-pointing corner brackets
      // Center of 42x38 button is (21, 19). Icon box 14x14
      // Top-left
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(14, 16);
      this.mobileFullscreenIcon.lineTo(14, 12);
      this.mobileFullscreenIcon.lineTo(18, 12);
      this.mobileFullscreenIcon.strokePath();

      // Top-right
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(24, 12);
      this.mobileFullscreenIcon.lineTo(28, 12);
      this.mobileFullscreenIcon.lineTo(28, 16);
      this.mobileFullscreenIcon.strokePath();

      // Bottom-left
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(14, 22);
      this.mobileFullscreenIcon.lineTo(14, 26);
      this.mobileFullscreenIcon.lineTo(18, 26);
      this.mobileFullscreenIcon.strokePath();

      // Bottom-right
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(24, 26);
      this.mobileFullscreenIcon.lineTo(28, 26);
      this.mobileFullscreenIcon.lineTo(28, 22);
      this.mobileFullscreenIcon.strokePath();
    } else {
      // Exit Fullscreen: 4 inward-pointing corner brackets
      // Top-left pointing inward
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(15, 14);
      this.mobileFullscreenIcon.lineTo(19, 14);
      this.mobileFullscreenIcon.lineTo(19, 18);
      this.mobileFullscreenIcon.strokePath();

      // Top-right pointing inward
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(27, 14);
      this.mobileFullscreenIcon.lineTo(23, 14);
      this.mobileFullscreenIcon.lineTo(23, 18);
      this.mobileFullscreenIcon.strokePath();

      // Bottom-left pointing inward
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(15, 24);
      this.mobileFullscreenIcon.lineTo(19, 24);
      this.mobileFullscreenIcon.lineTo(19, 20);
      this.mobileFullscreenIcon.strokePath();

      // Bottom-right pointing inward
      this.mobileFullscreenIcon.beginPath();
      this.mobileFullscreenIcon.moveTo(27, 24);
      this.mobileFullscreenIcon.lineTo(23, 24);
      this.mobileFullscreenIcon.lineTo(23, 20);
      this.mobileFullscreenIcon.strokePath();
    }
  }

  public drawSoundIcon(graphics: Phaser.GameObjects.Graphics, isMuted: boolean) {
    if (!graphics) return;
    graphics.clear();

    const cx = 21;
    const cy = 19;

    if (!isMuted) {
      // Speaker base rectangle
      graphics.fillStyle(0x45362e, 0.95);
      graphics.fillRect(cx - 8, cy - 4, 4, 8);

      // Speaker horn polygon
      graphics.beginPath();
      graphics.moveTo(cx - 4, cy - 4);
      graphics.lineTo(cx + 1, cy - 8);
      graphics.lineTo(cx + 1, cy + 8);
      graphics.lineTo(cx - 4, cy + 4);
      graphics.closePath();
      graphics.fillPath();

      // Sound waves (2 concentric arcs)
      graphics.lineStyle(1.8, 0xd97706, 0.95);
      graphics.beginPath();
      graphics.arc(cx + 1, cy, 5, -Phaser.Math.DEG_TO_RAD * 42, Phaser.Math.DEG_TO_RAD * 42, false);
      graphics.strokePath();

      graphics.beginPath();
      graphics.arc(cx + 1, cy, 9, -Phaser.Math.DEG_TO_RAD * 42, Phaser.Math.DEG_TO_RAD * 42, false);
      graphics.strokePath();
    } else {
      // Muted speaker (subdued color)
      graphics.fillStyle(0x795548, 0.75);
      graphics.fillRect(cx - 8, cy - 4, 4, 8);

      graphics.beginPath();
      graphics.moveTo(cx - 4, cy - 4);
      graphics.lineTo(cx + 1, cy - 8);
      graphics.lineTo(cx + 1, cy + 8);
      graphics.lineTo(cx - 4, cy + 4);
      graphics.closePath();
      graphics.fillPath();

      // Crisp red diagonal slash
      graphics.lineStyle(2.2, 0xd32f2f, 1);
      graphics.beginPath();
      graphics.moveTo(cx - 8, cy - 8);
      graphics.lineTo(cx + 9, cy + 9);
      graphics.strokePath();
    }
  }

  public updateFullscreenButtonState() {
    this.drawFullscreenIcon(this.isFullscreen());
  }

  public toggleFullscreen() {
    if (typeof document === 'undefined') return;
    const doc = document as any;
    const isFs = isFullscreenActive(doc);

    if (isFs) {
      const exitFn =
        doc.exitFullscreen ||
        doc.webkitExitFullscreen ||
        doc.mozCancelFullScreen ||
        doc.msExitFullscreen;
      if (exitFn) {
        try {
          const res = exitFn.call(doc);
          if (res && typeof res.catch === 'function') {
            res.catch((err: any) => {
              console.warn('Exit fullscreen rejected', err);
            });
          }
        } catch (err) {
          console.warn('Exit fullscreen error', err);
        }
      }
    } else {
      if (!isFullscreenSupported(doc)) {
        this.showToast('Fullscreen not supported on this browser');
        return;
      }

      const elem = (document.documentElement || document.body) as any;
      const reqFn =
        elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.mozRequestFullScreen ||
        elem.msRequestFullscreen;

      if (!reqFn) {
        this.showToast('Fullscreen not supported on this browser');
        return;
      }

      try {
        const promise = reqFn.call(elem);
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err: any) => {
            console.warn('Fullscreen request rejected', err);
            this.showToast('Fullscreen unavailable');
          });
        }
      } catch (err) {
        console.warn('Fullscreen error', err);
        this.showToast('Fullscreen unavailable');
      }
    }
  }

  public showToast(message: string, durationMs = 2400) {
    if (!this.toastContainer) return;
    this.toastText.setText(message);
    const textW = this.toastText.width;
    const textH = this.toastText.height;
    const w = Math.max(190, textW + 28);
    const h = Math.max(30, textH + 14);

    this.toastBg.clear();
    this.toastBg.fillStyle(0x28160c, 0.95);
    this.toastBg.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    this.toastBg.lineStyle(1.5, 0xd4a359, 0.9);
    this.toastBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);

    const screenW = this.scale.gameSize.width;
    const screenH = this.scale.gameSize.height;
    const isPortrait = screenH > screenW;
    const toastY = isPortrait ? 76 : 108;
    this.toastContainer.setPosition(screenW / 2, toastY);
    this.toastContainer.setAlpha(0);
    this.toastContainer.setVisible(true);

    if (this.toastTimerEvent) {
      this.toastTimerEvent.remove();
      this.toastTimerEvent = null;
    }

    this.tweens.killTweensOf(this.toastContainer);
    this.tweens.add({
      targets: this.toastContainer,
      alpha: 1,
      duration: 150,
      onComplete: () => {
        this.toastTimerEvent = this.time.delayedCall(durationMs, () => {
          this.tweens.add({
            targets: this.toastContainer,
            alpha: 0,
            duration: 250,
            onComplete: () => {
              this.toastContainer.setVisible(false);
            }
          });
        });
      }
    });
  }
}
