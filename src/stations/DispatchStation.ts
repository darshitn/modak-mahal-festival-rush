import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';
import { CampaignState } from '../state/CampaignState.ts';
import { Player } from '../entities/Player.ts';

export class DispatchStation extends BaseStation {
  private campaignState: CampaignState;
  private crateBadge: Phaser.GameObjects.Text;
  private boxStackContainer: Phaser.GameObjects.Container;
  private progressBarGraphics: Phaser.GameObjects.Graphics;
  private courierCueContainer: Phaser.GameObjects.Container;
  private courierIcon: Phaser.GameObjects.Text;
  private parcelIcon: Phaser.GameObjects.Sprite;
  private depositCooldown = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gameState: GameState,
    campaignState: CampaignState
  ) {
    super(scene, x, y, 'station_dispatch', 'Pandal Dispatch', gameState, 50);
    this.campaignState = campaignState;

    // Hide BaseStation default label
    this.labelText.setVisible(false);

    // Visible deposited boxes accumulation container (mini boxes stack on crate top)
    this.boxStackContainer = scene.add.container(0, -6);
    this.add(this.boxStackContainer);

    // Compact crate badge: "Pandal 0/12" up to "Pandal 12/12"
    this.crateBadge = scene.add.text(0, 24, 'Pandal 0/12', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#d97706',
      padding: { x: 6, y: 2 }
    });
    this.crateBadge.setOrigin(0.5).setResolution(2);
    this.add(this.crateBadge);

    // Compact progress bar for 10-second courier dispatch
    this.progressBarGraphics = scene.add.graphics();
    this.add(this.progressBarGraphics);

    // Courier / parcel movement cue
    this.courierCueContainer = scene.add.container(0, -28);
    this.courierIcon = scene.add.text(-12, 0, '🚴', {
      fontSize: '14px'
    }).setOrigin(0.5);
    this.parcelIcon = scene.add.sprite(10, 0, 'item_box').setScale(0.35);
    this.courierCueContainer.add([this.courierIcon, this.parcelIcon]);
    this.courierCueContainer.setVisible(false);
    this.add(this.courierCueContainer);

    this.campaignState.subscribe(() => this.updateDisplay());
    this.gameState.subscribe(() => this.updateDisplay());
    this.updateDisplay();
  }

  public isUnlocked(): boolean {
    const stage = this.campaignState?.stage;
    return (
      stage === 'PANDAL_ORDER' ||
      stage === 'DISPATCHING' ||
      stage === 'VICTORY'
    );
  }

  public override checkPlayerProximity(player: Player, delta: number) {
    if (!this.isUnlocked()) {
      if (this.isPlayerInside) {
        this.isPlayerInside = false;
        this.onPlayerExit();
      }
      return;
    }
    super.checkPlayerProximity(player, delta);
  }

  public update(_delta: number) {
    const unlocked = this.isUnlocked();
    if (!unlocked) {
      this.ringGraphics.clear();
      this.progressBarGraphics.clear();
      this.courierCueContainer.setVisible(false);
      return;
    }

    const reserved = this.campaignState.pandalBoxesReserved;
    const target = this.campaignState.config.pandalOrderTargetBoxes;
    const hasBoxes = this.gameState.carried?.type === 'box' && this.gameState.carried.count > 0;

    // Show highlight ONLY when the player approaches carrying packed boxes
    this.ringGraphics.clear();
    if (
      this.isPlayerInside &&
      hasBoxes &&
      this.campaignState.stage !== 'VICTORY' &&
      reserved < target
    ) {
      this.ringGraphics.lineStyle(1.5, 0xc9953d, 0.7);
      this.ringGraphics.strokeEllipse(0, 10, 68, 24);
      this.ringGraphics.fillStyle(0xffd54f, 0.12);
      this.ringGraphics.fillEllipse(0, 10, 68, 24);
    }

    if (this.campaignState.isCourierDispatching) {
      const progress = Math.min(
        1,
        this.campaignState.courierDispatchTimer / this.campaignState.config.courierDispatchDurationSeconds
      );
      this.drawProgressBar(progress);

      // Animate courier cue moving across
      this.courierCueContainer.setVisible(true);
      this.courierCueContainer.x = -24 + progress * 48;
    } else {
      this.progressBarGraphics.clear();
      this.courierCueContainer.setVisible(false);
    }
  }

  private drawProgressBar(progress: number) {
    this.progressBarGraphics.clear();
    const barW = 54;
    const barH = 6;
    const x = -barW / 2;
    const y = 14;

    // Track
    this.progressBarGraphics.fillStyle(0x3e2723, 0.85);
    this.progressBarGraphics.fillRoundedRect(x, y, barW, barH, 3);

    // Progress fill
    const fillW = Math.max(0, barW * progress);
    this.progressBarGraphics.fillStyle(0x00e676, 1);
    this.progressBarGraphics.fillRoundedRect(x, y, fillW, barH, 3);

    // Border
    this.progressBarGraphics.lineStyle(1, 0xffd54f, 0.9);
    this.progressBarGraphics.strokeRoundedRect(x, y, barW, barH, 3);
  }

  public updateDisplay() {
    const unlocked = this.isUnlocked();
    if (!unlocked) {
      // Completely hidden when locked before PANDAL_ORDER
      this.setVisible(false);
      this.mainSprite.setVisible(false);
      this.crateBadge.setVisible(false);
      this.boxStackContainer.setVisible(false);
      this.progressBarGraphics.clear();
      this.courierCueContainer.setVisible(false);
      this.ringGraphics.clear();
      return;
    }

    // Unlocked presentation
    this.setVisible(true);
    this.mainSprite.setVisible(true);
    this.mainSprite.setTexture('station_dispatch');
    this.mainSprite.clearTint();
    this.crateBadge.setVisible(true);
    this.boxStackContainer.setVisible(true);

    const reserved = this.campaignState.pandalBoxesReserved;
    const target = this.campaignState.config.pandalOrderTargetBoxes;

    this.crateBadge.setText(`Pandal ${reserved}/${target}`);
    if (reserved >= target) {
      this.crateBadge.setStyle({
        backgroundColor: '#2e7d32',
        color: '#ffffff'
      });
    } else {
      this.crateBadge.setStyle({
        backgroundColor: '#d97706',
        color: '#ffffff'
      });
    }

    this.updateBoxAccumulation(reserved);
  }

  /**
   * Visibly accumulate deposited gift boxes on the parcel stand.
   * Renders up to 6 mini boxes forming a festive stack as 12 boxes are deposited.
   */
  private updateBoxAccumulation(reserved: number) {
    this.boxStackContainer.removeAll(true);
    if (reserved <= 0) return;

    // 1 mini box sprite for every 2 deposited boxes, up to 6
    const count = Math.min(6, Math.ceil(reserved / 2));
    const BOX_OFFSETS = [
      { x: -10, y: -4 },
      { x: 2, y: -4 },
      { x: 14, y: -4 },
      { x: -4, y: -11 },
      { x: 8, y: -11 },
      { x: 2, y: -18 }
    ];

    for (let i = 0; i < count; i++) {
      const offset = BOX_OFFSETS[i];
      const box = this.scene.add.sprite(offset.x, offset.y, 'item_box');
      box.setScale(0.24);
      this.boxStackContainer.add(box);
    }
  }

  public onPlayerEnter() {
    this.depositCooldown = 0;
    this.attemptDeposit();
  }

  public onPlayerStay(delta: number) {
    this.depositCooldown -= delta;
    if (this.depositCooldown <= 0) {
      this.attemptDeposit();
      this.depositCooldown = 350;
    }
  }

  public onPlayerExit() {
    this.depositCooldown = 0;
  }

  public attemptDeposit(): boolean {
    if (!this.isUnlocked()) {
      return false;
    }

    if (this.campaignState.pandalBoxesReserved >= this.campaignState.config.pandalOrderTargetBoxes) {
      return false;
    }

    const carried = this.gameState.carried;
    if (!carried || carried.type !== 'box' || carried.count <= 0) {
      return false;
    }

    const accepted = this.campaignState.depositBoxesToDispatch(carried.count);
    if (accepted > 0) {
      carried.count -= accepted;
      if (carried.count <= 0) {
        carried.type = null;
        carried.count = 0;
      }
      this.gameState.notify();

      // Crate bounce tween
      this.scene.tweens.add({
        targets: this.mainSprite,
        scaleY: 0.55,
        duration: 100,
        yoyo: true
      });
      return true;
    }

    return false;
  }
}
