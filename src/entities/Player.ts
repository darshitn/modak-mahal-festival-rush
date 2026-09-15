import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { ItemType } from '../types/index.ts';

export class Player extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite;
  public shadow: Phaser.GameObjects.Graphics;
  private stackSprites: Phaser.GameObjects.Sprite[] = [];
  private gameState: GameState;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };
  public speed = 190;
  public isMoving = false;
  public isInputBlocked = false;
  private walkTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, gameState: GameState) {
    super(scene, x, y);
    this.gameState = gameState;

    // Ground shadow
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.25);
    this.shadow.fillEllipse(0, 18, 30, 12);
    this.add(this.shadow);

    // Main sprite
    this.sprite = scene.add.sprite(0, 0, 'player');
    this.add(this.sprite);

    // Setup input keys
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    }

    // Subscribe to state changes to update carried stack
    this.gameState.subscribe(() => this.updateCarriedStack());
    this.updateCarriedStack();

    scene.add.existing(this);
  }

  public update(delta: number) {
    if (this.isInputBlocked) {
      this.isMoving = false;
      this.sprite.y = 0;
      return;
    }

    let vx = 0;
    let vy = 0;

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;
    }

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const dt = delta / 1000;
    this.x += vx * this.speed * dt;
    this.y += vy * this.speed * dt;

    // Keep within shop boundary
    this.x = Phaser.Math.Clamp(this.x, 80, 880);
    this.y = Phaser.Math.Clamp(this.y, 100, 480);

    this.isMoving = vx !== 0 || vy !== 0;

    if (this.isMoving) {
      this.walkTime += dt * 15;
      const bob = Math.sin(this.walkTime) * 3;
      this.sprite.y = bob;
      if (vx < 0) this.sprite.setFlipX(true);
      else if (vx > 0) this.sprite.setFlipX(false);
    } else {
      this.sprite.y = 0;
    }

    // Update stack heights with walking bob
    this.updateStackPositions();

    // Depth sorting based on y
    this.setDepth(this.y);
  }

  private updateCarriedStack() {
    // Clear old stack sprites
    for (const s of this.stackSprites) {
      this.remove(s, true);
    }
    this.stackSprites = [];

    const carried = this.gameState.carried;
    if (!carried.type || carried.count <= 0) return;

    const textureKey = this.getTextureKeyForItem(carried.type);
    const spacing = carried.type === 'box' ? 12 : 16;

    for (let i = 0; i < carried.count; i++) {
      const itemSprite = this.scene.add.sprite(0, -22 - i * spacing, textureKey);
      itemSprite.setScale(0.85);
      this.add(itemSprite);
      this.stackSprites.push(itemSprite);
    }
  }

  private updateStackPositions() {
    const carried = this.gameState.carried;
    if (!carried.type) return;
    const spacing = carried.type === 'box' ? 12 : 16;
    const sway = this.isMoving ? Math.sin(this.walkTime) * 1.5 : 0;

    for (let i = 0; i < this.stackSprites.length; i++) {
      const spr = this.stackSprites[i];
      spr.x = sway * (i + 1) * 0.4;
      spr.y = this.sprite.y - 22 - i * spacing;
    }
  }

  private getTextureKeyForItem(type: ItemType): string {
    if (type === 'bundle') return 'item_bundle';
    if (type === 'batch') return 'item_batch';
    return 'item_box';
  }
}
