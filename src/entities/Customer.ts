import Phaser from 'phaser';
import { calculateFeedbackBounds } from '../config/layout.ts';
import {
  clampFeedbackToViewport,
  extractCameraViewport,
  isMobileLayout
} from '../utils/mobileControls.ts';

export class Customer extends Phaser.GameObjects.Container {
  public id: string;
  public requestedBoxes: number;
  public state: 'walking_in' | 'waiting' | 'served' | 'leaving' = 'walking_in';
  public targetX: number;
  public targetY: number;
  public patience: number;
  public maxPatience: number;
  public isTutorial: boolean;
  public isServing = false;

  private sprite: Phaser.GameObjects.Sprite;
  private bubbleContainer: Phaser.GameObjects.Container;
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bubbleText: Phaser.GameObjects.Text;
  private boxIcon: Phaser.GameObjects.Sprite;
  private patienceBarBg: Phaser.GameObjects.Graphics;
  private patienceBarFill: Phaser.GameObjects.Graphics;
  private walkTime = 0;
  private isExpiring = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    requestedBoxes: number,
    maxPatience = 50,
    isTutorial = false
  ) {
    super(scene, x, y);
    this.id = id;
    this.requestedBoxes = requestedBoxes;
    this.targetX = x;
    this.targetY = y;
    this.maxPatience = maxPatience;
    this.patience = maxPatience;
    this.isTutorial = isTutorial;

    // Soft shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, 16, 24, 10);
    this.add(shadow);

    // Customer sprite
    this.sprite = scene.add.sprite(0, 0, 'customer');
    this.sprite.setScale(0.5);
    this.add(this.sprite);

    // Order speech bubble (centered at 0, -40)
    this.bubbleContainer = scene.add.container(0, -40);
    this.bubbleBg = scene.add.graphics();

    this.boxIcon = scene.add.sprite(-10, -3, 'item_box');
    this.boxIcon.setScale(0.325);

    this.bubbleText = scene.add.text(8, -3, `x${requestedBoxes}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#c2185b',
      fontStyle: 'bold'
    });
    this.bubbleText.setOrigin(0.5).setResolution(2);

    // Compact patience bar at the base of the bubble: 36px wide, 3px tall
    this.patienceBarBg = scene.add.graphics();
    this.patienceBarBg.fillStyle(0x3e2723, 0.35);
    this.patienceBarBg.fillRoundedRect(-18, 7, 36, 3, 1.5);

    this.patienceBarFill = scene.add.graphics();

    this.bubbleContainer.add([
      this.bubbleBg,
      this.boxIcon,
      this.bubbleText,
      this.patienceBarBg,
      this.patienceBarFill
    ]);
    this.add(this.bubbleContainer);

    this.drawBubbleAndPatience(1.0);

    scene.add.existing(this);
    this.setDepth(y);
  }

  public getPatienceFraction(): number {
    if (this.maxPatience <= 0) return 1.0;
    return Math.max(0, Math.min(1.0, this.patience / this.maxPatience));
  }

  public update(delta: number) {
    const dt = delta / 1000;

    // Movement towards target
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
    if (dist > 3) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetX, this.targetY);
      const speed = 90;
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;

      this.walkTime += dt * 10;
      this.sprite.y = Math.sin(this.walkTime) * 2;
    } else {
      this.sprite.y = 0;
      if (this.state === 'walking_in') {
        this.state = 'waiting';
      }
    }

    // Authoritative patience simulation: decreases ONLY when customer is waiting in queue
    if (this.state === 'waiting' && !this.isServing && !this.isExpiring) {
      this.patience = Math.max(0, this.patience - dt);
      const fraction = this.getPatienceFraction();
      this.drawBubbleAndPatience(fraction);

      if (this.patience <= 0) {
        this.markExpired();
      }
    }

    this.setDepth(this.y);
  }

  private drawBubbleAndPatience(fraction: number) {
    // Determine color and mood based on patience fraction:
    // Green: 70–100%, smiling/calm
    // Amber: 40–69%, concerned
    // Red: 1–39%, impatient
    let moodColor = 0x2e7d32; // Green
    let textColor = '#2e7d32';

    if (fraction < 0.40) {
      moodColor = 0xd32f2f; // Red
      textColor = '#d32f2f';
    } else if (fraction < 0.70) {
      moodColor = 0xf57c00; // Amber
      textColor = '#e65100';
    }

    // Redraw speech bubble with mood-aligned border
    this.bubbleBg.clear();
    this.bubbleBg.fillStyle(0xffffff, 0.96);
    this.bubbleBg.fillRoundedRect(-24, -15, 48, 28, 6);
    this.bubbleBg.lineStyle(2, moodColor, 1.0);
    this.bubbleBg.strokeRoundedRect(-24, -15, 48, 28, 6);

    this.bubbleText.setColor(textColor);

    // Redraw compact patience bar fill (36px max width)
    this.patienceBarFill.clear();
    const fillWidth = Math.max(0, Math.min(36, 36 * fraction));
    if (fillWidth > 0) {
      this.patienceBarFill.fillStyle(moodColor, 1.0);
      this.patienceBarFill.fillRoundedRect(-18, 7, fillWidth, 3, 1.5);
    }
  }

  public static activeFeedbackCards: Phaser.GameObjects.Container[] = [];

  public static clearAllFeedback() {
    for (const card of Customer.activeFeedbackCards) {
      if (card && card.active) {
        card.destroy();
      }
    }
    Customer.activeFeedbackCards = [];
  }

  public static calculateFeedbackBounds = calculateFeedbackBounds;

  private static showLaneFeedback(
    scene: Phaser.Scene,
    text: string,
    type: 'success' | 'warning' | 'error',
    coinBadgeText?: string
  ) {
    // Prefer replacing the current message over stacking several cards
    while (Customer.activeFeedbackCards.length > 0) {
      const existing = Customer.activeFeedbackCards.shift();
      if (existing && existing.active) {
        existing.destroy();
      }
    }

    const textColor =
      type === 'success' ? '#1b5e20' : type === 'warning' ? '#b45309' : '#b91c1c';

    // Main label (star tier + short message)
    const label = scene.add.text(0, -4, text, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: textColor,
      fontStyle: 'bold'
    });
    label.setOrigin(0.5).setResolution(2);

    const padX = 10;
    // Clamp width to max 210 logical pixels
    const width = Math.max(70, Math.min(210, label.width + padX * 2));
    const height = coinBadgeText ? 34 : 22;

    // Coin/tip badge on second line if present
    let coinLabel: Phaser.GameObjects.Text | null = null;
    if (coinBadgeText) {
      coinLabel = scene.add.text(0, 8, coinBadgeText, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '10px',
        color: textColor
      });
      coinLabel.setOrigin(0.5).setResolution(2);
    }

    // Clamp feedback card position so it stays fully visible inside the current camera viewport
    // (accounting for camera scroll, zoom, min 8px screen edge margin, and mobile top HUD clearance)
    const cam = scene.cameras?.main;
    const isMobile = cam && scene.scale ? isMobileLayout(scene.scale.width, scene.scale.height) : false;
    const viewport = extractCameraViewport(cam, isMobile);
    const clamped = clampFeedbackToViewport(850, 250, { width, height }, viewport);

    const cardX = clamped.x;
    const cardY = clamped.y;

    const cardContainer = scene.add.container(cardX, cardY);
    cardContainer.setSize(width, height);
    cardContainer.setData('feedbackWidth', width);
    cardContainer.setData('feedbackHeight', height);
    cardContainer.setDepth(3000);

    // High-contrast cream backplate with crisp dark border
    const bgGraphics = scene.add.graphics();
    // Drop shadow
    bgGraphics.fillStyle(0x000000, 0.22);
    bgGraphics.fillRoundedRect(-width / 2 + 1, -height / 2 + 2, width, height, 5);
    // Cream fill
    bgGraphics.fillStyle(0xfffdf7, 0.96);
    bgGraphics.fillRoundedRect(-width / 2, -height / 2, width, height, 5);
    // Dark border
    bgGraphics.lineStyle(1.5, 0x3e2723, 0.9);
    bgGraphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 5);

    cardContainer.add(bgGraphics);
    cardContainer.add(label);
    if (coinLabel) cardContainer.add(coinLabel);

    Customer.activeFeedbackCards.push(cardContainer);

    // Subtle float up and fade out
    scene.tweens.add({
      targets: cardContainer,
      y: cardY - 20,
      alpha: 0,
      delay: 1000,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        const idx = Customer.activeFeedbackCards.indexOf(cardContainer);
        if (idx !== -1) Customer.activeFeedbackCards.splice(idx, 1);
        cardContainer.destroy();
      }
    });
  }

  public markServed(
    feedbackText?: string,
    stars?: number,
    coinsEarned?: number,
    tipEarned?: number
  ) {
    if (this.state === 'served' || this.state === 'leaving') return;
    this.state = 'served';
    this.bubbleContainer.setVisible(false);

    // Short star-rated message that fits within the 210px card constraint
    let starPrefix = '';
    let type: 'success' | 'warning' = 'success';
    if (stars && stars >= 5) {
      starPrefix = '5★ Festival favourite';
    } else if (stars && stars === 4) {
      starPrefix = '4★ Thank you!';
    } else if (stars && stars === 3) {
      starPrefix = '3★ Slow service';
      type = 'warning';
    } else if (stars && stars === 2) {
      starPrefix = '2★ Long wait';
      type = 'warning';
    } else {
      starPrefix = feedbackText || '🙏';
    }

    // Coin badge on second line with tip details if present
    const coinStr =
      coinsEarned !== undefined
        ? tipEarned && tipEarned > 0
          ? `+₹${coinsEarned} (+₹${tipEarned} tip)`
          : `+₹${coinsEarned}`
        : undefined;

    Customer.showLaneFeedback(this.scene, starPrefix, type, coinStr);

    // Walk away towards street exit
    this.state = 'leaving';
    this.targetX = 950;
    this.targetY = 280;
  }

  public markExpired() {
    if (this.isExpiring || this.state === 'leaving' || this.state === 'served') return;
    this.isExpiring = true;
    this.state = 'leaving';
    this.bubbleContainer.setVisible(false);

    // Short 1-star message that fits within the 210px card constraint
    Customer.showLaneFeedback(this.scene, '1★ Left unserved', 'error');

    // Emit event so ShopScene records departure and advances queue
    this.scene.events.emit('customer-expired', this);

    // Walk away towards street exit
    this.targetX = 950;
    this.targetY = 280;
  }
}
