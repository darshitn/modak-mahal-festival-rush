import Phaser from 'phaser';

export class Customer extends Phaser.GameObjects.Container {
  public id: string;
  public requestedBoxes: number;
  public state: 'walking_in' | 'waiting' | 'served' | 'leaving' = 'walking_in';
  public targetX: number;
  public targetY: number;
  private sprite: Phaser.GameObjects.Sprite;
  private bubbleContainer: Phaser.GameObjects.Container;
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bubbleText: Phaser.GameObjects.Text;
  private boxIcon: Phaser.GameObjects.Sprite;
  private walkTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, requestedBoxes: number) {
    super(scene, x, y);
    this.id = id;
    this.requestedBoxes = requestedBoxes;
    this.targetX = x;
    this.targetY = y;

    // Soft shadow
    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillEllipse(0, 16, 24, 10);
    this.add(shadow);

    // Customer sprite
    this.sprite = scene.add.sprite(0, 0, 'customer');
    this.add(this.sprite);

    // Order speech bubble
    this.bubbleContainer = scene.add.container(0, -38);
    this.bubbleBg = scene.add.graphics();
    this.bubbleBg.fillStyle(0xffffff, 0.95);
    this.bubbleBg.fillRoundedRect(-24, -14, 48, 26, 6);
    this.bubbleBg.lineStyle(2, 0xc2185b, 1);
    this.bubbleBg.strokeRoundedRect(-24, -14, 48, 26, 6);

    this.boxIcon = scene.add.sprite(-10, -1, 'item_box');
    this.boxIcon.setScale(0.65);

    this.bubbleText = scene.add.text(8, -1, `x${requestedBoxes}`, {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '13px',
      color: '#c2185b',
      fontStyle: 'bold'
    });
    this.bubbleText.setOrigin(0.5);

    this.bubbleContainer.add([this.bubbleBg, this.boxIcon, this.bubbleText]);
    this.add(this.bubbleContainer);

    scene.add.existing(this);
    this.setDepth(y);
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

    this.setDepth(this.y);
  }

  public markServed() {
    this.state = 'served';
    this.bubbleContainer.setVisible(false);

    // Show heart or smile emote
    const heartText = this.scene.add.text(this.x, this.y - 40, '❤️🙏', {
      fontSize: '18px'
    });
    heartText.setOrigin(0.5);
    this.scene.tweens.add({
      targets: heartText,
      y: heartText.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: () => heartText.destroy()
    });

    // Walk away towards street exit
    this.state = 'leaving';
    this.targetX = 950;
    this.targetY = 280;
  }
}
