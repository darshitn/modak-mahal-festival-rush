import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { Player } from '../entities/Player.ts';

export abstract class BaseStation extends Phaser.GameObjects.Container {
  public stationName: string;
  public interactionRadius: number;
  public isPlayerInside = false;
  protected ringGraphics: Phaser.GameObjects.Graphics;
  protected mainSprite: Phaser.GameObjects.Sprite;
  protected labelText: Phaser.GameObjects.Text;
  protected gameState: GameState;
  protected interactionTimer = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    stationName: string,
    gameState: GameState,
    interactionRadius = 55
  ) {
    super(scene, x, y);
    this.stationName = stationName;
    this.gameState = gameState;
    this.interactionRadius = interactionRadius;

    // Proximity ring beneath station
    this.ringGraphics = scene.add.graphics();
    this.add(this.ringGraphics);

    // Station sprite
    this.mainSprite = scene.add.sprite(0, 0, textureKey);
    this.mainSprite.setScale(0.5);
    this.add(this.mainSprite);

    // Station label
    this.labelText = scene.add.text(0, -36, stationName, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#45362e',
      stroke: '#fffdf7',
      strokeThickness: 4,
      align: 'center'
    });
    this.labelText.setOrigin(0.5).setResolution(2);
    this.add(this.labelText);

    this.drawRing(false, 0);

    scene.add.existing(this);
    this.setDepth(y);
  }

  public checkPlayerProximity(player: Player, delta: number) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const wasInside = this.isPlayerInside;
    this.isPlayerInside = dist <= this.interactionRadius;

    if (this.isPlayerInside) {
      if (!wasInside) {
        this.onPlayerEnter();
      }
      this.onPlayerStay(delta);
    } else {
      if (wasInside) {
        this.onPlayerExit();
      }
    }
  }

  protected drawRing(active: boolean, progress = 0, ringColor = 0xffb300) {
    this.ringGraphics.clear();

    if (!active && progress <= 0) {
      return;
    }

    // Only the active station is highlighted; inactive circles add clutter.
    this.ringGraphics.lineStyle(2, active ? 0xe99527 : 0xc9953d, active ? 0.9 : 0.55);
    this.ringGraphics.strokeCircle(0, 10, this.interactionRadius);

    // Background fill when active
    if (active) {
      this.ringGraphics.fillStyle(0xe99527, 0.1);
      this.ringGraphics.fillCircle(0, 10, this.interactionRadius);
    }

    // Progress arc if progress > 0
    if (progress > 0) {
      this.ringGraphics.lineStyle(5, ringColor, 1);
      this.ringGraphics.beginPath();
      this.ringGraphics.arc(
        0,
        10,
        this.interactionRadius,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * Phaser.Math.Clamp(progress, 0, 1)),
        false
      );
      this.ringGraphics.strokePath();
    }
  }

  public abstract onPlayerEnter(): void;
  public abstract onPlayerStay(delta: number): void;
  public abstract onPlayerExit(): void;
}
