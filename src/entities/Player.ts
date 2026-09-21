import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { ItemType } from '../types/index.ts';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/layout.ts';
import { combineInputVectors } from '../utils/mobileControls.ts';

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
  private virtualVx = 0;
  private virtualVy = 0;

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
    this.sprite.setScale(0.5);
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

  public clearVirtualMovement() {
    this.virtualVx = 0;
    this.virtualVy = 0;
  }

  public setVirtualMovement(x: number, y: number) {
    this.virtualVx = x;
    this.virtualVy = y;
  }

  public clearMovementInput() {
    this.isMoving = false;
    this.sprite.y = 0;
    this.clearVirtualMovement();
    if (this.cursors) {
      this.cursors.left.reset();
      this.cursors.right.reset();
      this.cursors.up.reset();
      this.cursors.down.reset();
    }
    if (this.wasd) {
      this.wasd.left.reset();
      this.wasd.right.reset();
      this.wasd.up.reset();
      this.wasd.down.reset();
    }
  }

  public update(delta: number) {
    if (this.isInputBlocked) {
      this.isMoving = false;
      this.sprite.y = 0;
      return;
    }

    let kx = 0;
    let ky = 0;

    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) kx -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) kx += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) ky -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) ky += 1;
    }

    // Combine keyboard input with virtual joystick input safely and normalize once
    const combined = combineInputVectors({ x: kx, y: ky }, { x: this.virtualVx, y: this.virtualVy });
    const vx = combined.x;
    const vy = combined.y;

    const dt = delta / 1000;
    this.x += vx * this.speed * dt;
    this.y += vy * this.speed * dt;

    // Keep within world boundary derived from world dimensions and feet footprint
    // Physical wall collisions are governed by ShopScene collision map
    const FOOT_OFFSET_Y = 15;
    const FOOT_RADIUS = 8.5;
    this.x = Phaser.Math.Clamp(this.x, FOOT_RADIUS, LOGICAL_WIDTH - FOOT_RADIUS);
    this.y = Phaser.Math.Clamp(this.y, 0, LOGICAL_HEIGHT - FOOT_OFFSET_Y - FOOT_RADIUS);

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
      const itemSprite = this.scene.add.sprite(0, -28 - i * spacing, textureKey);
      itemSprite.setScale(0.44);
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
      spr.y = this.sprite.y - 28 - i * spacing;
    }
  }

  private getTextureKeyForItem(type: ItemType): string {
    if (type === 'bundle') return 'item_bundle';
    if (type === 'batch') return 'item_batch';
    return 'item_box';
  }
}
