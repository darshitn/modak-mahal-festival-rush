import { BALANCE, GameBalanceConfig } from '../config/balance.ts';
import { CarriedGoods, ItemType, SteamerSlot, PackingTableState, GameStats, ObjectiveKey } from '../types/index.ts';

export class GameState {
  public config: GameBalanceConfig;
  public coins: number;
  public ingredientStorageBundles: number;
  public carried: CarriedGoods;
  public steamers: SteamerSlot[];
  public packingTable: PackingTableState;
  public counterBoxesStock: number;
  public upgrades: {
    hasCarryUpgrade: boolean;
    hasPacker: boolean;
    hasCashier: boolean;
    hasSecondSteamer: boolean;
  };
  public stats: GameStats;

  // Listeners for UI / Sound events
  private listeners: Array<() => void> = [];

  constructor(customConfig?: Partial<GameBalanceConfig>) {
    this.config = { ...BALANCE, ...customConfig };
    this.coins = this.config.startingCash;
    this.ingredientStorageBundles = this.config.startingBundles;
    this.carried = { type: null, count: 0 };
    this.steamers = [
      { id: 0, unlocked: true, state: 'idle', progress: 0, timer: 0, hasOutput: false },
      { id: 1, unlocked: false, state: 'idle', progress: 0, timer: 0, hasOutput: false }
    ];
    this.packingTable = {
      inputBatches: 0,
      isPacking: false,
      progress: 0,
      timer: 0,
      outputBoxes: 0
    };
    this.counterBoxesStock = 0;
    this.upgrades = {
      hasCarryUpgrade: false,
      hasPacker: false,
      hasCashier: false,
      hasSecondSteamer: false
    };
    this.stats = {
      totalBoxesSold: 0,
      totalRevenue: 0,
      batchesCooked: 0,
      pandalDelivered: 0
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getCarryCapacity(type: ItemType): number {
    const isUpgraded = this.upgrades.hasCarryUpgrade;
    const caps = isUpgraded ? this.config.carryUpgradeCapacity : this.config.initialCarryCapacity;
    if (type === 'bundle') return caps.bundles;
    if (type === 'batch') return caps.batches;
    if (type === 'box') return caps.boxes;
    return 0;
  }

  /**
   * Check if player can afford an upgrade while preserving minimum working capital reserve (12 coins).
   */
  public canAffordUpgrade(cost: number): boolean {
    return this.coins - cost >= this.config.minWorkingCapitalReserve;
  }

  /**
   * Buy Carrying Capacity Upgrade (30 coins -> 2 bundles/batches, 6 boxes).
   */
  public buyCarryUpgrade(): boolean {
    if (this.upgrades.hasCarryUpgrade) return false;
    if (!this.canAffordUpgrade(this.config.carryUpgradeCost)) return false;

    this.coins -= this.config.carryUpgradeCost;
    this.upgrades.hasCarryUpgrade = true;
    this.notify();
    return true;
  }

  /**
   * Buy Packer Helper (45 coins).
   */
  public buyPacker(): boolean {
    if (this.upgrades.hasPacker) return false;
    if (!this.canAffordUpgrade(this.config.packerCost)) return false;

    this.coins -= this.config.packerCost;
    this.upgrades.hasPacker = true;
    this.notify();
    return true;
  }

  /**
   * Buy Cashier Helper (60 coins).
   */
  public buyCashier(): boolean {
    if (this.upgrades.hasCashier) return false;
    if (!this.canAffordUpgrade(this.config.cashierCost)) return false;

    this.coins -= this.config.cashierCost;
    this.upgrades.hasCashier = true;
    this.notify();
    return true;
  }

  /**
   * Buy Second Steamer (90 coins).
   */
  public buySecondSteamer(): boolean {
    if (this.upgrades.hasSecondSteamer) return false;
    if (!this.canAffordUpgrade(this.config.secondSteamerCost)) return false;

    this.coins -= this.config.secondSteamerCost;
    this.upgrades.hasSecondSteamer = true;
    const steamer2 = this.steamers.find(s => s.id === 1);
    if (steamer2) {
      steamer2.unlocked = true;
    }
    this.notify();
    return true;
  }

  /**
   * Action: Buy recipe bundle from supplier.
   * Costs 12 coins, adds 1 bundle to ingredient storage shelf.
   */
  public buyBundle(): boolean {
    if (this.coins < this.config.bundleCost) {
      return false;
    }
    this.coins -= this.config.bundleCost;
    this.ingredientStorageBundles += 1;
    this.notify();
    return true;
  }

  /**
   * Action: Player picks up 1 recipe bundle from ingredient storage.
   */
  public pickupBundle(): boolean {
    if (this.ingredientStorageBundles <= 0) {
      return false;
    }
    const maxCapacity = this.getCarryCapacity('bundle');
    if (this.carried.type === null) {
      this.carried = { type: 'bundle', count: 1 };
      this.ingredientStorageBundles -= 1;
      this.notify();
      return true;
    } else if (this.carried.type === 'bundle' && this.carried.count < maxCapacity) {
      this.carried.count += 1;
      this.ingredientStorageBundles -= 1;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Action: Return bundle back to ingredient storage (safe drop).
   */
  public returnBundleToStorage(): boolean {
    if (this.carried.type === 'bundle' && this.carried.count > 0) {
      this.ingredientStorageBundles += this.carried.count;
      this.carried = { type: null, count: 0 };
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Action: Load 1 bundle into a steamer.
   */
  public loadSteamer(steamerId: number): boolean {
    const steamer = this.steamers.find(s => s.id === steamerId);
    if (!steamer || !steamer.unlocked) return false;
    if (steamer.state !== 'idle') return false;

    if (this.carried.type === 'bundle' && this.carried.count > 0) {
      this.carried.count -= 1;
      if (this.carried.count === 0) {
        this.carried.type = null;
      }
      steamer.state = 'steaming';
      steamer.timer = 0;
      steamer.progress = 0;
      steamer.hasOutput = false;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Update active steamers over time (in seconds).
   */
  public updateSteamers(deltaSeconds: number) {
    let changed = false;
    for (const steamer of this.steamers) {
      if (steamer.unlocked && steamer.state === 'steaming') {
        steamer.timer += deltaSeconds;
        steamer.progress = Math.min(1, steamer.timer / this.config.steamTimeSeconds);
        changed = true;
        if (steamer.timer >= this.config.steamTimeSeconds) {
          steamer.state = 'ready';
          steamer.progress = 1;
          steamer.hasOutput = true;
          this.stats.batchesCooked += 1;
        }
      }
    }
    if (changed) {
      this.notify();
    }
  }

  /**
   * Action: Collect ready cooked batch from steamer.
   */
  public collectBatchFromSteamer(steamerId: number): boolean {
    const steamer = this.steamers.find(s => s.id === steamerId);
    if (!steamer || steamer.state !== 'ready' || !steamer.hasOutput) {
      return false;
    }

    const maxBatches = this.getCarryCapacity('batch');
    if (this.carried.type === null) {
      this.carried = { type: 'batch', count: 1 };
      steamer.state = 'idle';
      steamer.hasOutput = false;
      steamer.progress = 0;
      steamer.timer = 0;
      this.notify();
      return true;
    } else if (this.carried.type === 'batch' && this.carried.count < maxBatches) {
      this.carried.count += 1;
      steamer.state = 'idle';
      steamer.hasOutput = false;
      steamer.progress = 0;
      steamer.timer = 0;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Action: Deposit cooked batch to packing table input.
   */
  public loadPackingTable(): boolean {
    if (this.carried.type === 'batch' && this.carried.count > 0) {
      this.packingTable.inputBatches += this.carried.count;
      this.carried = { type: null, count: 0 };
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Update packing table progress.
   * In M1 (no packer), packing progresses when player is actively interacting.
   * With packer helper, packing progresses automatically whenever inputBatches > 0.
   */
  public updatePackingTable(deltaSeconds: number, isPlayerInteracting: boolean) {
    const canPack = this.packingTable.inputBatches > 0 && (isPlayerInteracting || this.upgrades.hasPacker);

    if (canPack) {
      this.packingTable.isPacking = true;
      // Packer helper works faster (1.5x speed) and automatically
      const speedMultiplier = this.upgrades.hasPacker ? 1.5 : 1.0;
      this.packingTable.timer += deltaSeconds * speedMultiplier;
      this.packingTable.progress = Math.min(1, this.packingTable.timer / this.config.packingTimeSeconds);

      if (this.packingTable.timer >= this.config.packingTimeSeconds) {
        // Complete 1 batch packing
        this.packingTable.inputBatches -= 1;
        this.packingTable.outputBoxes += this.config.boxesPerBatch;
        this.packingTable.timer = 0;
        this.packingTable.progress = 0;
        this.packingTable.isPacking = false;
      }
      this.notify();
    } else {
      if (this.packingTable.isPacking) {
        this.packingTable.isPacking = false;
        this.notify();
      }
    }
  }

  /**
   * Cashier NPC automated service:
   * Serves waiting front customer directly from counter shelf stock.
   */
  public autoServeWithCashier(requestedBoxes: number): { success: boolean; coinsEarned: number } {
    if (!this.upgrades.hasCashier) return { success: false, coinsEarned: 0 };
    if (!Number.isInteger(requestedBoxes) || requestedBoxes <= 0) {
      return { success: false, coinsEarned: 0 };
    }
    if (this.counterBoxesStock < requestedBoxes) {
      return { success: false, coinsEarned: 0 };
    }

    this.counterBoxesStock -= requestedBoxes;
    const payment = requestedBoxes * this.config.boxSalePrice;
    this.coins += payment;
    this.stats.totalBoxesSold += requestedBoxes;
    this.stats.totalRevenue += payment;
    this.notify();
    return { success: true, coinsEarned: payment };
  }

  /**
   * Action: Collect finished modak boxes from packing table.
   */
  public collectBoxesFromPackingTable(): boolean {
    if (this.packingTable.outputBoxes <= 0) return false;

    const maxBoxes = this.getCarryCapacity('box');
    if (this.carried.type === null) {
      const takeCount = Math.min(this.packingTable.outputBoxes, maxBoxes);
      this.carried = { type: 'box', count: takeCount };
      this.packingTable.outputBoxes -= takeCount;
      this.notify();
      return true;
    } else if (this.carried.type === 'box' && this.carried.count < maxBoxes) {
      const spaceLeft = maxBoxes - this.carried.count;
      const takeCount = Math.min(this.packingTable.outputBoxes, spaceLeft);
      this.carried.count += takeCount;
      this.packingTable.outputBoxes -= takeCount;
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Action: Deposit carried boxes to counter stock shelf.
   */
  public depositBoxesToCounter(): boolean {
    if (this.carried.type === 'box' && this.carried.count > 0) {
      this.counterBoxesStock += this.carried.count;
      this.carried = { type: null, count: 0 };
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Action: Serve customer.
   * Customer requires `requestedBoxes`.
   * Can pool boxes carried by the player with boxes already on the counter.
   * The transaction is all-or-nothing so a failed attempt never consumes stock
   * or pays for only part of an order.
   */
  public serveCustomer(requestedBoxes: number): { success: boolean; coinsEarned: number } {
    if (!Number.isInteger(requestedBoxes) || requestedBoxes <= 0) {
      return { success: false, coinsEarned: 0 };
    }

    const carriedBoxes = this.carried.type === 'box' ? this.carried.count : 0;
    const totalAvailable = carriedBoxes + this.counterBoxesStock;

    // Check the full order before mutating either inventory location.
    if (totalAvailable < requestedBoxes) {
      return { success: false, coinsEarned: 0 };
    }

    const boxesFromCarried = Math.min(carriedBoxes, requestedBoxes);
    const boxesFromCounter = requestedBoxes - boxesFromCarried;

    if (boxesFromCarried > 0) {
      this.carried.count -= boxesFromCarried;
      if (this.carried.count === 0) {
        this.carried = { type: null, count: 0 };
      }
    }
    this.counterBoxesStock -= boxesFromCounter;

    const payment = requestedBoxes * this.config.boxSalePrice;
    this.coins += payment;
    this.stats.totalBoxesSold += requestedBoxes;
    this.stats.totalRevenue += payment;
    this.notify();
    return { success: true, coinsEarned: payment };
  }

  /**
   * Determine the current contextual objective for player guidance.
   */
  public getCurrentObjective(): { key: ObjectiveKey; text: string } {
    if (this.ingredientStorageBundles === 0 && this.carried.type !== 'bundle' && this.steamers.every(s => s.state === 'idle')) {
      return { key: 'BUY_INGREDIENT', text: 'Step on the Ingredient Shelf to buy ingredients (12 coins)' };
    }
    const hasReadySteamer = this.steamers.some(s => s.unlocked && s.state === 'ready');
    const hasIdleSteamer = this.steamers.some(s => s.unlocked && s.state === 'idle');
    if (this.carried.type === 'bundle' && hasReadySteamer && !hasIdleSteamer) {
      return {
        key: 'COLLECT_MODAKS',
        text: 'Hands full of ingredients — return them at the Shelf to collect cooked modaks'
      };
    }
    if (this.carried.type === 'bundle') {
      return { key: 'LOAD_STEAMER', text: 'Carry the ingredient bundle to the Steamer' };
    }
    if (this.steamers.some(s => s.state === 'steaming') && this.carried.type === null && this.packingTable.outputBoxes === 0) {
      return { key: 'WAIT_STEAM', text: 'Waiting for modaks to steam...' };
    }
    if (this.steamers.some(s => s.state === 'ready')) {
      return { key: 'COLLECT_MODAKS', text: 'Collect the freshly steamed modaks!' };
    }
    if (this.carried.type === 'batch') {
      return { key: 'PACK_BOXES', text: 'Bring the steamed modaks to the Packing Table' };
    }
    if (this.packingTable.inputBatches > 0 && this.packingTable.outputBoxes === 0) {
      return { key: 'PACK_BOXES', text: 'Stand at the Packing Table to pack modak boxes' };
    }
    if (this.packingTable.outputBoxes > 0 && this.carried.type === null) {
      return { key: 'COLLECT_BOXES', text: 'Pick up the packed modak boxes' };
    }
    if (this.carried.type === 'box' || this.counterBoxesStock > 0) {
      return { key: 'SERVE_CUSTOMER', text: 'Walk to the Counter to serve waiting devotees!' };
    }
    return { key: 'EARN_MORE', text: 'Keep making modaks to grow your festival stall!' };
  }
}
