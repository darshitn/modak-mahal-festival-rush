import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { Player } from '../entities/Player.ts';
import { Customer } from '../entities/Customer.ts';
import { IngredientStation } from '../stations/IngredientStation.ts';
import { SteamerStation } from '../stations/SteamerStation.ts';
import { PackingStation } from '../stations/PackingStation.ts';
import { CounterStation } from '../stations/CounterStation.ts';

export class ShopScene extends Phaser.Scene {
  public gameState!: GameState;
  public player!: Player;
  public ingredientStation!: IngredientStation;
  public steamer1!: SteamerStation;
  public packingStation!: PackingStation;
  public counterStation!: CounterStation;

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

    // Stations
    this.ingredientStation = new IngredientStation(this, 160, 170, this.gameState);
    this.steamer1 = new SteamerStation(this, 400, 170, 0, this.gameState);
    this.packingStation = new PackingStation(this, 280, 370, this.gameState);
    this.counterStation = new CounterStation(this, 680, 360, this.gameState);

    // Player
    this.player = new Player(this, 220, 250, this.gameState);

    // Spawn initial customer for M1 verification
    this.spawnCustomer();
  }

  update(_time: number, delta: number) {
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

    this.packingStation.checkPlayerProximity(this.player, delta);
    this.packingStation.update(delta);

    this.counterStation.checkPlayerProximity(this.player, delta);

    // Auto-serve check if player is at counter with boxes or counter has stock
    if (this.counterStation.isPlayerInside) {
      const frontCustomer = this.customers.find(c => c.state === 'waiting');
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

    // Customer spawner
    this.customerSpawnTimer += dt;
    if (this.customerSpawnTimer >= this.gameState.config.customerSpawnIntervalSeconds) {
      this.customerSpawnTimer = 0;
      if (this.customers.length < 3) {
        this.spawnCustomer();
      }
    }
  }

  private spawnCustomer() {
    const id = `cust_${this.customerIdCounter++}`;
    // In M1, customers ask for 1 box (or occasionally 2 once player has made a sale)
    const orderQty = this.gameState.stats.totalBoxesSold >= 3 && Math.random() > 0.6 ? 2 : 1;
    const spawnX = 940;
    const spawnY = 360;

    const customer = new Customer(this, spawnX, spawnY, id, orderQty);
    this.customers.push(customer);
    this.updateQueuePositions();
  }

  private updateQueuePositions() {
    // Queue positions line up to the right of the counter
    // Front customer stands at x = 750, y = 360
    const startX = 750;
    const spacing = 50;

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
    g.fillStyle(0x2d1810, 1);
    g.fillRect(0, 0, width, height);

    // Warm terracotta tiled floor
    g.fillStyle(0x4e2716, 1);
    g.fillRect(80, 80, 800, 420);

    // Subtle checkered floor pattern
    g.fillStyle(0x5d311d, 0.4);
    for (let x = 80; x < 880; x += 40) {
      for (let y = 80; y < 500; y += 40) {
        if (((x / 40) + (y / 40)) % 2 === 0) {
          g.fillRect(x, y, 40, 40);
        }
      }
    }

    // Festive Rangoli in the center
    g.lineStyle(2, 0xffd54f, 0.4);
    g.strokeCircle(480, 290, 45);
    g.strokeCircle(480, 290, 25);
    g.fillStyle(0xff6f00, 0.25);
    g.fillCircle(480, 290, 25);

    // Walls & wooden plinths
    g.lineStyle(4, 0xbf360c, 1);
    g.strokeRect(80, 80, 800, 420);

    // Marigold Toran garland across top wall
    for (let x = 90; x <= 870; x += 15) {
      g.fillStyle((x / 15) % 2 === 0 ? 0xff8f00 : 0xffd600, 1);
      g.fillCircle(x, 82, 5);
    }

    // Street entrance walkway guide on right
    g.fillStyle(0x3e2723, 0.5);
    g.fillRect(720, 335, 200, 50);
    g.lineStyle(1, 0xffb300, 0.4);
    g.strokeRect(720, 335, 200, 50);

    const entranceText = this.add.text(820, 320, 'Devotee Queue ➔', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: '11px',
      color: '#ffcc80'
    });
    entranceText.setOrigin(0.5);
  }
}
