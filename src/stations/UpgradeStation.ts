import Phaser from 'phaser';
import { BaseStation } from './BaseStation.ts';
import { GameState } from '../state/GameState.ts';
import { UIScene } from '../scenes/UIScene.ts';

export class UpgradeStation extends BaseStation {
  private promptText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y, 'station_upgrade', 'Mahal Upgrades ⚙️', gameState, 65);

    // Ground info text under the kiosk
    this.promptText = scene.add.text(0, 36, 'Upgrades [E]', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#3e2723',
      padding: { x: 6, y: 2 }
    });
    this.promptText.setOrigin(0.5);
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
      scaleY: 1.15,
      duration: 120,
      yoyo: true
    });
  }

  public onPlayerEnter() {
    this.drawRing(true, 0);
    this.openModal();
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
