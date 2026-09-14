import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';

export class UIScene extends Phaser.Scene {
  private gameState!: GameState;
  private coinText!: Phaser.GameObjects.Text;
  private carriedText!: Phaser.GameObjects.Text;
  private objectiveText!: Phaser.GameObjects.Text;
  private objectiveBg!: Phaser.GameObjects.Graphics;

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

    if (this.gameState) {
      this.gameState.subscribe(() => this.updateHUD());
      this.updateHUD();
    }
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
}
