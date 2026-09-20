import Phaser from 'phaser';
import { GameState } from '../state/GameState.ts';
import { CampaignState } from '../state/CampaignState.ts';
import { Player } from '../entities/Player.ts';
import { Customer } from '../entities/Customer.ts';
import { IngredientStation } from '../stations/IngredientStation.ts';
import { SteamerStation } from '../stations/SteamerStation.ts';
import { PackingStation } from '../stations/PackingStation.ts';
import { CounterStation } from '../stations/CounterStation.ts';
import { UpgradeStation } from '../stations/UpgradeStation.ts';
import { DispatchStation } from '../stations/DispatchStation.ts';
import { PackerNPC, CashierNPC } from '../entities/Staff.ts';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/layout.ts';
import { CustomerSaleResult } from '../types/index.ts';

export interface CollisionBlocker {
  id: string;
  category: 'architecture' | 'furniture' | 'boundary';
  rect: Phaser.Geom.Rectangle;
}

export class ShopScene extends Phaser.Scene {
  public gameState!: GameState;
  public campaignState!: CampaignState;
  public player!: Player;
  public ingredientStation!: IngredientStation;
  public steamer1!: SteamerStation;
  public steamer2!: SteamerStation;
  public packingStation!: PackingStation;
  public counterStation!: CounterStation;
  public upgradeStation!: UpgradeStation;
  public dispatchStation!: DispatchStation;
  public packerNPC!: PackerNPC;
  public cashierNPC!: CashierNPC;

  public customers: Customer[] = [];
  private customerSpawnTimer = 0;
  private customerIdCounter = 1;
  public collisionBlockers: CollisionBlocker[] = [];
  public isCollisionOverlayVisible = false;
  private collisionOverlayGraphics?: Phaser.GameObjects.Graphics;
  public badgeDispatch?: Phaser.GameObjects.Sprite;

  public isDispatchUnlocked(): boolean {
    const stage = this.campaignState?.stage;
    return stage === 'PANDAL_ORDER' || stage === 'DISPATCHING' || stage === 'VICTORY';
  }

  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.gameState = new GameState();
    this.campaignState = new CampaignState(this.gameState.config);

    // Start UIScene with gameState and campaignState
    this.scene.launch('UIScene', { gameState: this.gameState, campaignState: this.campaignState });

    this.drawShopEnvironment();
    this.initCollisionBlockers();

    (window as any).__shopScene = this;
    (window as any).__gameState = this.gameState;
    (window as any).__campaignState = this.campaignState;
    (window as any).__restartGame = () => this.restartGame();
    (window as any).__toggleCollisionOverlay = () => this.toggleCollisionOverlay();
    (window as any).__setCollisionOverlay = (val: boolean) => this.setCollisionOverlay(val);

    // Two connected departments layout:
    // Compartment 1: Supplies (x: 118 to 292, y: 76 to 185)
    this.ingredientStation = new IngredientStation(this, 205, 135, this.gameState);

    // Compartment 2: Steaming Kitchen (x: 318 to 618, y: 76 to 185)
    // Repositioned to 405 and 555 for 150px separation (eliminates table/label overlap when Steamer 2 is unlocked)
    this.steamer1 = new SteamerStation(this, 405, 135, 0, this.gameState);
    this.steamer2 = new SteamerStation(this, 555, 135, 1, this.gameState);

    // Office / Upgrade Desk (x: 644 to 935, y: 76 to 185)
    this.upgradeStation = new UpgradeStation(this, 740, 135, this.gameState);

    // Compartment 3: Packing & Boxing (x: 295 to 490, y: 295 to 450)
    // Visually centered in room interior at x: 380 (room interior x: 288..468)
    this.packingStation = new PackingStation(this, 380, 390, this.gameState);

    // Compartment 4: Service Counter (x: 520 to 762, y: 295 to 450)
    this.counterStation = new CounterStation(this, 700, 390, this.gameState);

    // Grand Pandal Dispatch Stand — Service room west flank, clear of doorway, counter, and customer street
    // Position (572, 370): inside service room, flush along west partition wall
    this.dispatchStation = new DispatchStation(this, 572, 370, this.gameState, this.campaignState);

    // Staff NPCs (visible once hired)
    this.packerNPC = new PackerNPC(this, 335, 365, this.gameState);
    this.packerNPC.setDepth(370);
    this.cashierNPC = new CashierNPC(this, 660, 365, this.gameState);
    this.cashierNPC.setDepth(370);

    // Player initial position in central working aisle
    this.player = new Player(this, 260, 240, this.gameState);
    this.configureCamera(this.scale.gameSize);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.configureCamera, this);

    // Setup development-only collision overlay (accessible via window.__toggleCollisionOverlay())
    this.collisionOverlayGraphics = this.add.graphics();
    this.collisionOverlayGraphics.setDepth(9999);
    this.collisionOverlayGraphics.setVisible(false);


    // Listen for customer expiration
    this.events.on('customer-expired', (customer: Customer) => {
      this.onCustomerExpired(customer);
    });

    // Listen for completed customer sales to advance campaign
    this.events.on('customer-sale-completed', (result: CustomerSaleResult) => {
      this.campaignState.recordSale(result.stars);
    });

    // Tab blur / focus listeners to clear movement and prevent stuck keys
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.player?.clearMovementInput();
    });
    this.game.events.on(Phaser.Core.Events.FOCUS, () => {
      this.player?.clearMovementInput();
    });

    // Spawn initial customers for active queue in customer street
    this.spawnCustomer();
    this.spawnCustomer();

    // UIScene owns screen-space HUD and modal input. Bring it above the world.
    this.scene.bringToTop('UIScene');
  }

  public onCustomerExpired(customer: Customer) {
    if (!this.customers.includes(customer)) return;
    this.gameState.recordCustomerDeparture();
    this.updateQueuePositions();
    this.campaignState.notify();
  }

  public toggleCollisionOverlay() {
    this.setCollisionOverlay(!this.isCollisionOverlayVisible);
  }

  public setCollisionOverlay(visible: boolean) {
    this.isCollisionOverlayVisible = visible;
    this.collisionOverlayGraphics?.setVisible(visible);
    if (!visible) {
      this.collisionOverlayGraphics?.clear();
    }
  }

  private initCollisionBlockers() {
    this.collisionBlockers = [
      // === A. OUTER BOUNDARIES ===
      // Top outer wall
      { id: 'top_wall', category: 'boundary', rect: new Phaser.Geom.Rectangle(25, 0, 915, 76) },
      // Left outer wall
      { id: 'left_wall', category: 'boundary', rect: new Phaser.Geom.Rectangle(0, 0, 32, 540) },
      // Right outer wall
      { id: 'right_wall', category: 'boundary', rect: new Phaser.Geom.Rectangle(935, 0, 25, 540) },
      // Bottom plinth / balustrade boundary
      { id: 'bottom_boundary', category: 'boundary', rect: new Phaser.Geom.Rectangle(25, 455, 915, 85) },

      // === B. ARCHITECTURAL WALLS & STRUCTURES ===
      // Locked Staircase (steps + velvet rope stanchions at y ≈ 180)
      { id: 'staircase_locked', category: 'architecture', rect: new Phaser.Geom.Rectangle(32, 76, 62, 110) },
      // Wall between staircase corridor and Supplies
      { id: 'wall_stairs_supplies', category: 'architecture', rect: new Phaser.Geom.Rectangle(94, 76, 22, 114) },
      // Wall between Supplies and Steaming Kitchen
      { id: 'wall_supplies_steaming', category: 'architecture', rect: new Phaser.Geom.Rectangle(294, 76, 24, 114) },
      // Wall between Steaming Kitchen and Office Alcove
      { id: 'wall_steaming_office', category: 'architecture', rect: new Phaser.Geom.Rectangle(620, 76, 24, 114) },

      // Lower-Left Pandal Alcove (shrine enclosure walls)
      // North wall beam sits at y: 296..322; aisle floor above y=296 is clear
      { id: 'pandal_north_wall', category: 'architecture', rect: new Phaser.Geom.Rectangle(32, 296, 156, 26) },
      // East wall sits at x: 180..205; leaves 58px corridor between Pandal and Packing (x: 206..264)
      { id: 'pandal_east_wall', category: 'architecture', rect: new Phaser.Geom.Rectangle(180, 296, 25, 160) },

      // Compartment 3 (Packing) Walls
      // West partition wall (x: 264..288)
      { id: 'packing_west_wall', category: 'architecture', rect: new Phaser.Geom.Rectangle(264, 292, 24, 164) },
      // North wall left stub (entrance door is x: 336 to 427, width 91px)
      { id: 'packing_north_left', category: 'architecture', rect: new Phaser.Geom.Rectangle(264, 292, 72, 26) },
      // North wall right stub
      { id: 'packing_north_right', category: 'architecture', rect: new Phaser.Geom.Rectangle(427, 292, 65, 26) },
      // East partition wall bounding Packing room (x: 468..492)
      { id: 'wall_packing_east', category: 'architecture', rect: new Phaser.Geom.Rectangle(468, 292, 24, 164) },

      // Central Corridor between Packing and Service (x: 492..533, width 41px) is completely clear!

      // Compartment 4 (Service) Walls
      // West partition wall bounding Service room (x: 533..557)
      { id: 'wall_service_west', category: 'architecture', rect: new Phaser.Geom.Rectangle(533, 292, 24, 164) },
      // North wall left stub (entrance door is x: 613 to 693, width 80px)
      { id: 'service_north_left', category: 'architecture', rect: new Phaser.Geom.Rectangle(533, 292, 80, 26) },
      // North wall right stub
      { id: 'service_north_right', category: 'architecture', rect: new Phaser.Geom.Rectangle(693, 292, 72, 26) },
      // East wall dividing Service from Street (stub above service counter bench)
      { id: 'service_east_top', category: 'architecture', rect: new Phaser.Geom.Rectangle(762, 292, 20, 78) },
      // East wall dividing Service from Street (stub below service counter bench)
      { id: 'service_east_bottom', category: 'architecture', rect: new Phaser.Geom.Rectangle(762, 415, 20, 42) },
      // Customer street north boundary
      { id: 'street_north_wall', category: 'architecture', rect: new Phaser.Geom.Rectangle(780, 292, 155, 18) },

      // === C. FURNITURE FOOTPRINTS ===
      // Supplies shelf unit against top wall
      { id: 'furn_supply_shelf', category: 'furniture', rect: new Phaser.Geom.Rectangle(163, 110, 84, 30) },
      // Goods In sacks pallet
      { id: 'furn_goods_in_sacks', category: 'furniture', rect: new Phaser.Geom.Rectangle(137, 112, 24, 28) },
      // Steamer 1 assembly (prep table, brass steamer, output platter; center at 405, art spans 349..461)
      { id: 'furn_steamer1_assembly', category: 'furniture', rect: new Phaser.Geom.Rectangle(348, 100, 114, 36) },
      // Steamer 2 assembly / blueprint unit (center at 555, art spans 499..611)
      { id: 'furn_steamer2_assembly', category: 'furniture', rect: new Phaser.Geom.Rectangle(498, 100, 114, 36) },
      // Management upgrade desk (centered at 740, solid base footprint)
      { id: 'furn_upgrade_desk', category: 'furniture', rect: new Phaser.Geom.Rectangle(692, 112, 96, 34) },
      // Packing bench worktable (centered at x: 380, solid lower footprint)
      { id: 'furn_packing_bench', category: 'furniture', rect: new Phaser.Geom.Rectangle(331, 386, 98, 20) },
      // Service counter bench separating staff from hatch
      { id: 'furn_service_counter', category: 'furniture', rect: new Phaser.Geom.Rectangle(644, 384, 115, 22) },
      // Grand Pandal dispatch crate inside Service room (centre at 572, 370)
      // Sits flush along the service west wall — clear of doorway, counter, and customer street
      { id: 'furn_dispatch_crate', category: 'furniture', rect: new Phaser.Geom.Rectangle(557, 359, 30, 22) }
    ];
  }

  /**
   * Desktop shows the compact shop in full. Portrait uses the same logical
   * world but follows the shopkeeper, keeping the play area tall and usable.
   */
  private configureCamera(gameSize: Phaser.Structs.Size) {
    const camera = this.cameras.main;
    const isPortrait = gameSize.height > gameSize.width;
    const desktopZoom = Math.min(
      gameSize.width / LOGICAL_WIDTH,
      gameSize.height / LOGICAL_HEIGHT
    );
    // Portrait frames ~400px width cleanly without clipping stations or badges
    const zoom = isPortrait
      ? Math.min(gameSize.width / 400, 1.0)
      : desktopZoom;

    camera.setViewport(0, 0, gameSize.width, gameSize.height);
    camera.setBackgroundColor(0x1a0f0b);
    camera.setBounds(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    camera.setZoom(zoom);

    if (isPortrait) {
      // Follow player with vertical offset so department badges are never covered by top HUD
      camera.startFollow(this.player, true, 0.1, 0.1, 0, 35);
    } else {
      camera.stopFollow();
      const visibleWidth = gameSize.width / zoom;
      const visibleHeight = gameSize.height / zoom;
      camera.setScroll(
        (LOGICAL_WIDTH - visibleWidth) / 2,
        (LOGICAL_HEIGHT - visibleHeight) / 2
      );
    }
  }

  update(time: number, delta: number) {
    // Avoid large resume delta after browser tab blur/focus return
    const clampedDelta = Math.min(delta, 100);
    const dt = clampedDelta / 1000;

    // Authoritative campaign simulation update
    this.campaignState.update(dt, this.gameState);

    // If game is paused or modal open, freeze everything
    if (this.campaignState.isPaused) {
      this.player.clearMovementInput();
      return;
    }

    // Update player, then slide against shallow furniture and wall footprints
    const previousX = this.player.x;
    const previousY = this.player.y;
    this.player.update(clampedDelta);
    this.resolveFurnitureCollisions(previousX, previousY);

    // Update state timers
    this.gameState.updateSteamers(dt);
    this.gameState.updatePackingTable(dt, this.packingStation.isPlayerInside);

    // Update station proximities and animations
    this.ingredientStation.checkPlayerProximity(this.player, clampedDelta);
    this.steamer1.checkPlayerProximity(this.player, clampedDelta);
    this.steamer1.update(clampedDelta);
    this.steamer2.checkPlayerProximity(this.player, clampedDelta);
    this.steamer2.update(clampedDelta);
    this.packingStation.checkPlayerProximity(this.player, clampedDelta);
    this.packingStation.update(clampedDelta);
    this.counterStation.checkPlayerProximity(this.player, clampedDelta);
    this.counterStation.update(clampedDelta);
    this.dispatchStation.checkPlayerProximity(this.player, clampedDelta);
    this.dispatchStation.update(clampedDelta);
    this.upgradeStation.checkPlayerProximity(this.player, clampedDelta);
    this.badgeDispatch?.setVisible(this.isDispatchUnlocked());

    // Staff automation updates
    this.packerNPC.update(time, clampedDelta);
    const frontCustomer = this.customers.find(c => c.state === 'waiting') || null;
    this.cashierNPC.update(time, clampedDelta, frontCustomer);

    // Player manual serving at counter if cashier isn't handling it or player has carried boxes
    if (this.counterStation.isPlayerInside) {
      if (frontCustomer) {
        this.counterStation.attemptServeFrontCustomer(frontCustomer);
      }
    }

    // Update customer entities and clean up departed
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const customer = this.customers[i];
      customer.update(clampedDelta);

      if (customer.state === 'leaving' && customer.x > 940) {
        customer.destroy();
        this.customers.splice(i, 1);
        this.updateQueuePositions();
      }
    }

    // Customer spawner with Festival Rush multiplier (maintains queue up to 4 customers)
    const isRush = this.campaignState.rushState.isActive;
    const spawnInterval = isRush
      ? this.gameState.config.customerSpawnIntervalSeconds * this.gameState.config.rushSpawnIntervalMultiplier
      : this.gameState.config.customerSpawnIntervalSeconds;

    this.customerSpawnTimer += dt;
    if (this.customerSpawnTimer >= spawnInterval) {
      this.customerSpawnTimer = 0;
      if (this.customers.length < this.gameState.config.maxCustomerQueue) {
        this.spawnCustomer();
      }
    }

    // Redraw collision overlay if active
    if (this.isCollisionOverlayVisible) {
      this.renderCollisionOverlay();
    }
  }

  public restartGame() {
    Customer.clearAllFeedback();
    for (const cust of this.customers) {
      cust.destroy();
    }
    this.customers = [];
    this.customerSpawnTimer = 0;
    this.customerIdCounter = 1;

    this.gameState.reset();
    this.campaignState.reset();

    this.player.setPosition(260, 240);
    this.player.clearMovementInput();
    this.player.isInputBlocked = false;

    this.steamer1?.updateDisplay();
    this.steamer2?.updateDisplay();
    this.packingStation?.updateDisplay();
    this.counterStation?.updateDisplay();
    this.dispatchStation?.updateDisplay();
    this.badgeDispatch?.setVisible(false);

    this.spawnCustomer();
    this.spawnCustomer();

    const uiScene = this.scene.get('UIScene') as any;
    if (uiScene) {
      uiScene.closePauseModal?.();
      uiScene.closeResultsModal?.();
      uiScene.closeUpgradeModal?.();
      uiScene.hasShownOpeningGuide = false;
      uiScene.openGuideModal?.();
      uiScene.updateHUD?.();
    }
  }

  private spawnCustomer() {
    const id = `cust_${this.customerIdCounter}`;
    const isTutorial = this.customerIdCounter <= 2;
    this.customerIdCounter++;

    const allowTwoBox = this.gameState.stats.totalBoxesSold >= 3 || this.gameState.upgrades.hasCarryUpgrade;
    const orderQty = allowTwoBox && Math.random() > 0.5 ? 2 : 1;
    const spawnX = 920;
    const spawnY = 430;

    const maxPatience = isTutorial
      ? this.gameState.config.patienceTutorialSeconds
      : orderQty === 1
      ? this.gameState.config.patience1BoxSeconds
      : this.gameState.config.patience2BoxSeconds;

    const customer = new Customer(this, spawnX, spawnY, id, orderQty, maxPatience, isTutorial);
    this.customers.push(customer);
    this.updateQueuePositions();
  }

  private updateQueuePositions() {
    // Courtyard street queue: 4 dedicated slots with generous horizontal (70px) and vertical (70px) spacing
    // Exceeds 48px bubble width + gap, ensuring 100% readability without overlap and zero viewport clipping
    const QUEUE_SLOTS = [
      { x: 810, y: 345 }, // Slot 0: Front at service counter hatch
      { x: 880, y: 345 }, // Slot 1: 2nd devotee (70px horizontal separation)
      { x: 880, y: 415 }, // Slot 2: 3rd devotee (70px vertical separation)
      { x: 810, y: 415 }  // Slot 3: 4th devotee (70px horizontal separation)
    ];

    const activeCustomers = this.customers.filter(c => c.state !== 'leaving');
    for (let i = 0; i < activeCustomers.length; i++) {
      const slot = QUEUE_SLOTS[Math.min(i, QUEUE_SLOTS.length - 1)];
      activeCustomers[i].targetX = slot.x;
      activeCustomers[i].targetY = slot.y;
    }
  }

  private resolveFurnitureCollisions(previousX: number, previousY: number) {
    // Collision feet anchor: 15px below player container origin, radius 8.5px
    // Keeps collision strictly around player feet, providing generous doorway clearance
    const FOOT_OFFSET_Y = 15;
    const FOOT_RADIUS = 8.5;
    const dispatchUnlocked = this.isDispatchUnlocked();

    const collides = (fx: number, fy: number) => {
      for (let i = 0; i < this.collisionBlockers.length; i++) {
        const blocker = this.collisionBlockers[i];
        if (blocker.id === 'furn_dispatch_crate' && !dispatchUnlocked) {
          continue;
        }
        const rect = blocker.rect;
        if (
          fx >= rect.x - FOOT_RADIUS &&
          fx <= rect.x + rect.width + FOOT_RADIUS &&
          fy >= rect.y - FOOT_RADIUS &&
          fy <= rect.y + rect.height + FOOT_RADIUS
        ) {
          return true;
        }
      }
      return false;
    };

    const newFootX = this.player.x;
    const newFootY = this.player.y + FOOT_OFFSET_Y;
    const prevFootX = previousX;
    const prevFootY = previousY + FOOT_OFFSET_Y;

    if (!collides(newFootX, newFootY)) {
      return;
    }

    // Try sliding horizontally (allow X movement if Y is restored)
    if (!collides(newFootX, prevFootY)) {
      this.player.y = previousY;
      return;
    }

    // Try sliding vertically (allow Y movement if X is restored)
    if (!collides(prevFootX, newFootY)) {
      this.player.x = previousX;
      return;
    }

    // Blocked in both directions
    this.player.x = previousX;
    this.player.y = previousY;
  }

  private renderCollisionOverlay() {
    const g = this.collisionOverlayGraphics;
    if (!g) return;

    g.clear();

    // 1. Draw collision blockers with distinct category colors
    for (const blocker of this.collisionBlockers) {
      if (blocker.id === 'furn_dispatch_crate' && !this.isDispatchUnlocked()) {
        continue;
      }
      const rect = blocker.rect;
      if (blocker.category === 'boundary') {
        // Boundaries: warm amber
        g.fillStyle(0xff9100, 0.35);
        g.fillRect(rect.x, rect.y, rect.width, rect.height);
        g.lineStyle(1.5, 0xff6d00, 0.9);
        g.strokeRect(rect.x, rect.y, rect.width, rect.height);
      } else if (blocker.category === 'architecture') {
        // Architecture: crisp crimson red
        g.fillStyle(0xef5350, 0.45);
        g.fillRect(rect.x, rect.y, rect.width, rect.height);
        g.lineStyle(1.5, 0xd32f2f, 0.95);
        g.strokeRect(rect.x, rect.y, rect.width, rect.height);
      } else {
        // Furniture: bright cyan / teal
        g.fillStyle(0x00e5ff, 0.45);
        g.fillRect(rect.x, rect.y, rect.width, rect.height);
        g.lineStyle(1.5, 0x00b0ff, 0.95);
        g.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
    }

    // 2. Draw station interaction trigger zones: translucent gold
    const stations = [
      this.ingredientStation,
      this.steamer1,
      this.steamer2,
      this.upgradeStation,
      this.packingStation,
      this.counterStation,
      ...(this.isDispatchUnlocked() ? [this.dispatchStation] : [])
    ];
    for (const st of stations) {
      if (!st) continue;
      g.fillStyle(0xffeb3b, 0.15);
      g.fillCircle(st.x, st.y, st.interactionRadius);
      g.lineStyle(1, 0xffc107, 0.6);
      g.strokeCircle(st.x, st.y, st.interactionRadius);
    }

    // 3. Draw player collision footprint at feet: bright green
    const playerFootX = this.player.x;
    const playerFootY = this.player.y + 15;
    g.fillStyle(0x00e676, 0.7);
    g.fillCircle(playerFootX, playerFootY, 8.5);
    g.lineStyle(2, 0x1b5e20, 1);
    g.strokeCircle(playerFootX, playerFootY, 8.5);

    // 4. Draw customer queue positions: magenta dots and speech bubble bounding boxes (48x26)
    for (const cust of this.customers) {
      if (cust.state === 'leaving') continue;
      // Feet anchor
      g.fillStyle(0xe040fb, 0.65);
      g.fillCircle(cust.x, cust.y + 15, 6);
      g.lineStyle(1, 0xaa00ff, 0.9);
      g.strokeCircle(cust.x, cust.y + 15, 6);

      // Order speech bubble footprint (48px wide x 26px high at y - 38)
      // Visually verifies spacing >= 48px + gap and zero overlap between devotees
      const bubbleX = cust.x - 24;
      const bubbleY = cust.y - 38 - 14;
      g.fillStyle(0xe040fb, 0.18);
      g.fillRoundedRect(bubbleX, bubbleY, 48, 26, 4);
      g.lineStyle(1.5, 0xd500f9, 0.9);
      g.strokeRoundedRect(bubbleX, bubbleY, 48, 26, 4);
    }

    // 5. Draw active player movement boundary clamp (derived from world size & feet footprint)
    // No hidden constraints: x in [8.5, 951.5], y in [0, 516.5]
    g.lineStyle(1.5, 0xffd600, 0.85);
    g.strokeRect(8.5, 0, LOGICAL_WIDTH - 17, LOGICAL_HEIGHT - 15 - 8.5);
  }

  private drawShopEnvironment() {
    // 1. Render illustrated 960x540 environment background at world position (0, 0), origin (0, 0)
    const bg = this.add.image(0, 0, 'bg_hall_illustrated');
    bg.setOrigin(0, 0);
    bg.setDepth(0);

    // 2. Department Badges (station UI indicators)
    const badgeSupplies = this.add.sprite(205, 88, 'dept_badge_supplies');
    badgeSupplies.setScale(0.5);
    badgeSupplies.setDepth(95);

    const badgeSteaming = this.add.sprite(465, 88, 'dept_badge_steaming');
    badgeSteaming.setScale(0.5);
    badgeSteaming.setDepth(95);

    const badgePacking = this.add.sprite(395, 278, 'dept_badge_packing');
    badgePacking.setScale(0.5);
    badgePacking.setDepth(95);

    const badgeService = this.add.sprite(642, 278, 'dept_badge_service');
    badgeService.setScale(0.5);
    badgeService.setDepth(95);

    this.badgeDispatch = this.add.sprite(572, 328, 'dept_badge_dispatch');
    this.badgeDispatch.setScale(0.5);
    this.badgeDispatch.setDepth(95);
    this.badgeDispatch.setVisible(this.isDispatchUnlocked());

    // Subtle floor-contact shadow behind the shrine (grounds pedestal on alcove floor)
    const pandalShadow = this.add.ellipse(106, 441, 88, 18, 0x2b1810, 0.12);
    pandalShadow.setDepth(9);

    // Illustrated Pandal Ganesha shrine inside lower-left alcove (stationary festive decoration)
    // Visible artwork fits x: ~60..152, y: ~322..444 within the alcove enclosure (x: 32..180, y: 322..456)
    // Anchored at visible bottom-center (asset u: 626, v: 1132) placed at world (106, 444)
    // Depth of 10 keeps the pedestal above background floor but strictly behind characters and foreground architecture
    const pandal = this.add.image(106, 444, 'pandal_ganesha');
    pandal.setOrigin(626 / 1254, 1132 / 1254);
    pandal.setScale(0.1125);
    pandal.setDepth(10);
  }
}
