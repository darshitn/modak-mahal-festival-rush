import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';
import { UIScene } from '../scenes/UIScene.ts';

// Visual scale and alignment constants for illustrated upgrade desk:
// Asset 1515x1038, visible bounds [48, 138, 1465, 908] (visible w=1418, h=771)
const DESK_VISIBLE_WIDTH = 1418;
const DESK_TARGET_WIDTH = 100; // within 96-105px range
const DESK_SCALE = DESK_TARGET_WIDTH / DESK_VISIBLE_WIDTH; // ~0.070522 -> visible width 100px, visible height ~54.4px
const DESK_ORIGIN_X = (48 + DESK_VISIBLE_WIDTH / 2) / 1515; // ~0.49967
const DESK_ORIGIN_Y = 908 / 1038; // ~0.87476
const FLOOR_BASE_Y = 12;

export class UpgradeStation extends BaseStation {
  private promptText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'raster_upgrade_desk', 'Improve Shop', gameState, 65);
    this.labelText.setVisible(false);

    this.mainSprite.setOrigin(DESK_ORIGIN_X, DESK_ORIGIN_Y);
    this.mainSprite.setScale(DESK_SCALE);
    this.mainSprite.setPosition(0, FLOOR_BASE_Y);

    this.mainSprite.setInteractive({ useHandCursor: true });
    this.mainSprite.on('pointerdown', () => {
      if (this.isPlayerInside) this.openModal();
    });

    // Clean single prompt under the office desk
    this.promptText = scene.add.text(0, 32, 'Upgrades [E]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 7, y: 2 }
    });
    this.promptText.setOrigin(0.5).setResolution(2);
    this.add(this.promptText);

    // Keyboard trigger [E], [Space], [Enter] when inside zone
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isPlayerInside) {
        if (event.code === 'KeyE' || event.code === 'Space' || event.code === 'Enter') {
          this.openModal();
        }
      }
    });
  }

  public get uiScene(): UIScene | null {
    return (this.scene.scene.get('UIScene') as UIScene) || null;
  }

  public get isModalOpen(): boolean {
    return this.uiScene?.isUpgradeModalOpen ?? false;
  }

  public get items() {
    return this.uiScene?.upgradeItems ?? [];
  }

  public openModal() {
    this.uiScene?.openUpgradeModal();
    this.promptText.setText('Close [Esc]');
  }

  public closeModal() {
    this.uiScene?.closeUpgradeModal();
    this.promptText.setText('Upgrades [E]');
  }

  public playPurchaseBounce() {
    this.scene.tweens.add({
      targets: this.mainSprite,
      scaleY: DESK_SCALE * 1.15,
      duration: 120,
      yoyo: true
    });
  }

  public syncPrompt(isOpen: boolean) {
    this.promptText.setText(isOpen ? 'Close [Esc]' : 'Upgrades [E]');
  }

  public onPlayerEnter() {
    this.drawRing(true, 0);
    this.promptText.setText('Open upgrades [E]');
  }

  public onPlayerStay(_delta: number) {
    // Proximity maintain
  }

  public onPlayerExit() {
    this.drawRing(false, 0);
    if (this.isModalOpen) {
      this.closeModal();
    }
    this.promptText.setText('Upgrades [E]');
  }
}
