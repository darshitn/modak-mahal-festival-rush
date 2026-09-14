import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { Player } from '../entities/Player.ts';
import { Customer } from '../entities/Customer.ts';
import { IngredientStation } from '../stations/IngredientStation.ts';
import { SteamerStation } from '../stations/SteamerStation.ts';
import { PackingStation } from '../stations/PackingStation.ts';
import { CounterStation } from '../stations/CounterStation.ts';
import { UpgradeStation } from '../stations/UpgradeStation.ts';
import { PackerNPC, CashierNPC } from '../entities/Staff.ts';

export class ShopScene extends Phaser.Scene {
  public gameState!: GameState;
  public player!: Player;
  public ingredientStation!: IngredientStation;
  public steamer1!: SteamerStation;
  public steamer2!: SteamerStation;
  public packingStation!: PackingStation;
  public counterStation!: CounterStation;
  public upgradeStation!: UpgradeStation;
  public packerNPC!: PackerNPC;
  public cashierNPC!: CashierNPC;

  public customers: Customer[] = [];
  private customerSpawnTimer = 0;
  private customerIdCounter = 1;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameState = new GameState();

    // Start UIScene with gameState
    this.scene.launch('UIScene', { gameState: this.gameState });

    this.drawShopEnvironment();

    (window as any).__shopScene = this;
    (window as any).__gameState = this.gameState;

    // Stations layout
    this.ingredientStation = new IngredientStation(this, 160, 170, this.gameState);
    this.steamer1 = new SteamerStation(this, 360, 170, 0, this.gameState);
    this.steamer2 = new SteamerStation(this, 480, 170, 1, this.gameState);
    this.upgradeStation = new UpgradeStation(this, 700, 170, this.gameState);

    this.packingStation = new PackingStation(this, 280, 370, this.gameState);
    this.counterStation = new CounterStation(this, 680, 360, this.gameState);

    // Staff NPCs (visible once hired)
    this.packerNPC = new PackerNPC(this, 215, 370, this.gameState);
    this.cashierNPC = new CashierNPC(this, 630, 320, this.gameState);

    // Player
    this.player = new Player(this, 220, 250, this.gameState);

    // Spawn initial customers for active queue
    this.spawnCustomer();
    this.spawnCustomer();
  }

  update(time: number, delta: number) {
    const dt = delta / 1000;

    // Update player
    this.player.update(delta);

    // Update state timers
    this.gameState.updateSteamers(dt);
    this.gameState.updatePackingTable(dt, this.packingStation.isPlayerInside);

    // Update station proximities and animations
    this.ingredientStation.checkPlayerProximity(this.player, delta);

    this.steamer1.checkPlayerProximity(this.player, delta);
    this.steamer1.update(delta);

    this.steamer2.checkPlayerProximity(this.player, delta);
    this.steamer2.update(delta);

    this.upgradeStation.checkPlayerProximity(this.player, delta);

    this.packingStation.checkPlayerProximity(this.player, delta);
    this.packingStation.update(delta);

    this.counterStation.checkPlayerProximity(this.player, delta);

    // Staff automation updates
    this.packerNPC.update(time, delta);
    const frontCustomer = this.customers.find(c => c.state === 'waiting') || null;
    this.cashierNPC.update(time, delta, frontCustomer);

    // Player manual serving at counter if cashier isn't handling it or player has carried boxes
    if (this.counterStation.isPlayerInside) {
      if (frontCustomer) {
        this.counterStation.attemptServeFrontCustomer(frontCustomer);
      }
    }

    // Update customer entities and clean up departed
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const customer = this.customers[i];
      customer.update(delta);

      if (customer.state === 'leaving' && customer.x > 940) {
        customer.destroy();
        this.customers.splice(i, 1);
        this.updateQueuePositions();
      }
    }

    // Customer spawner (maintains queue up to 4 customers)
    this.customerSpawnTimer += dt;
    if (this.customerSpawnTimer >= this.gameState.config.customerSpawnIntervalSeconds) {
      this.customerSpawnTimer = 0;
      if (this.customers.length < this.gameState.config.maxCustomerQueue) {
        this.spawnCustomer();
      }
    }
  }

  private spawnCustomer() {
    const id = `cust_${this.customerIdCounter++}`;
    // Introduce 2-box orders after player has made some sales or upgraded
    const allowTwoBox = this.gameState.stats.totalBoxesSold >= 3 || this.gameState.upgrades.hasCarryUpgrade;
    const orderQty = allowTwoBox && Math.random() > 0.5 ? 2 : 1;
    const spawnX = 940;
    const spawnY = 360;

    const customer = new Customer(this, spawnX, spawnY, id, orderQty);
    this.customers.push(customer);
    this.updateQueuePositions();
  }

  private updateQueuePositions() {
    // Queue positions line up to the right of the counter
    const startX = 755;
    const spacing = 48;

    const activeCustomers = this.customers.filter(c => c.state !== 'leaving');
    for (let i = 0; i < activeCustomers.length; i++) {
      activeCustomers[i].targetX = startX + i * spacing;
      activeCustomers[i].targetY = 360;
    }
  }

  private drawShopEnvironment() {
    const g = this.add.graphics();
    const width = 960;
    const height = 540;

    // Outer festive border / street
    g.fillStyle(0x23120b, 1);
    g.fillRect(0, 0, width, height);

    // Warm terracotta tiled floor
    g.fillStyle(0x4a2414, 1);
    g.fillRect(70, 75, 820, 430);

    // Checkered festive tile texture
    g.fillStyle(0x562b18, 0.45);
    for (let x = 70; x < 890; x += 40) {
      for (let y = 75; y < 505; y += 40) {
        if (((x / 40) + (y / 40)) % 2 === 0) {
          g.fillRect(x, y, 40, 40);
        }
      }
    }

    // Traditional central floral Rangoli
    g.lineStyle(2, 0xffd54f, 0.5);
    g.strokeCircle(480, 290, 50);
    g.strokeCircle(480, 290, 28);
    g.fillStyle(0xe65100, 0.3);
    g.fillCircle(480, 290, 28);
    g.fillStyle(0xffb300, 0.4);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const px = 480 + Math.cos(angle) * 38;
      const py = 290 + Math.sin(angle) * 38;
      g.fillCircle(px, py, 6);
    }

    // Outer shop wooden molding
    g.lineStyle(4, 0xbf360c, 1);
    g.strokeRect(70, 75, 820, 430);

    // Marigold Toran garland across top wall
    for (let x = 80; x <= 880; x += 16) {
      g.fillStyle((x / 16) % 2 === 0 ? 0xff8f00 : 0xffd600, 1);
      g.fillCircle(x, 77, 6);
    }

    // Zone floor markings (visual elegance)
    const drawZoneMarker = (x: number, y: number, w: number, h: number, label: string) => {
      g.lineStyle(1, 0xffb74d, 0.25);
      g.strokeRoundedRect(x, y, w, h, 6);
      const txt = this.add.text(x + w / 2, y + h - 10, label, {
        fontFamily: 'Outfit, sans-serif',
        fontSize: '9px',
        color: '#ffcc80',
        align: 'center'
      });
      txt.setAlpha(0.6);
      txt.setOrigin(0.5);
    };

    drawZoneMarker(105, 115, 110, 105, 'INGREDIENTS');
    drawZoneMarker(300, 115, 250, 105, 'STEAMING KITCHEN');
    drawZoneMarker(630, 115, 140, 105, 'UPGRADE DESK');
    drawZoneMarker(210, 310, 140, 115, 'PACKAGING AREA');
    drawZoneMarker(610, 305, 140, 115, 'COUNTER');

    // Street entrance walkway guide on right
    g.fillStyle(0x3e2723, 0.6);
    g.fillRect(720, 335, 190, 50);
    g.lineStyle(1.5, 0xffb300, 0.5);
    g.strokeRect(720, 335, 190, 50);

    const entranceText = this.add.text(815, 320, 'Devotee Queue ➔', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffcc80'
    });
    entranceText.setOrigin(0.5);

    // Traditional brass oil lamps (Diyas) flickering at four corners
    const diyaPositions = [
      { x: 95, y: 100 },
      { x: 865, y: 100 },
      { x: 95, y: 480 },
      { x: 865, y: 480 }
    ];

    for (const pos of diyaPositions) {
      const diya = this.add.sprite(pos.x, pos.y, 'diya');
      diya.setScale(1.2);
      diya.setDepth(pos.y);

      // Flickering flame tween
      this.tweens.add({
        targets: diya,
        scaleY: 1.35,
        alpha: 0.85,
        duration: 250 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
