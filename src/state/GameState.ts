import { BALANCE, GameBalanceConfig } from '../config/balance.ts';
import { CarriedGoods, ItemType, SteamerSlot, PackingTableState, GameStats, ObjectiveKey, CustomerSaleResult } from '../types/index.ts';

export class GameState {
  public config: GameBalanceConfig;
  public coins: number;
  public ingredientStorageBundles: number;
  public carried: CarriedGoods;
  public steamers: SteamerSlot[];
  public packingTable: PackingTableState;
  public counterBoxesStock: number;
  public businessRating: number;
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
      { id: 0, unlocked: true, inputBundles: 0, state: 'idle', progress: 0, timer: 0, hasOutput: false },
      { id: 1, unlocked: false, inputBundles: 0, state: 'idle', progress: 0, timer: 0, hasOutput: false }
    ];
    this.packingTable = {
      inputBatches: 0,
      isPacking: false,
      progress: 0,
      timer: 0,
      outputBoxes: 0
    };
    this.counterBoxesStock = 0;
    this.businessRating = this.config.initialBusinessRating;
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
      pandalDelivered: 0,
      totalTipsEarned: 0,
      customersDeparted: 0,
      customersServed: 0
    };
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public reset() {
    this.coins = this.config.startingCash;
    this.ingredientStorageBundles = this.config.startingBundles;
    this.carried = { type: null, count: 0 };
    this.steamers = [
      { id: 0, unlocked: true, inputBundles: 0, state: 'idle', progress: 0, timer: 0, hasOutput: false },
      { id: 1, unlocked: false, inputBundles: 0, state: 'idle', progress: 0, timer: 0, hasOutput: false }
    ];
    this.packingTable = {
      inputBatches: 0,
      isPacking: false,
      progress: 0,
      timer: 0,
      outputBoxes: 0
    };
    this.counterBoxesStock = 0;
    this.businessRating = this.config.initialBusinessRating;
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
      pandalDelivered: 0,
      totalTipsEarned: 0,
      customersDeparted: 0,
      customersServed: 0
    };
    this.notify();
  }

  public notify() {
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
   * Unload all compatible carried bundles that fit on a steamer input shelf.
   * A steamer has independent queued input and output storage: accepting a
   * bundle never overwrites a cooked tray, and a queued bundle waits until the
   * output tray is free before it starts cooking.
   */
  public loadSteamer(steamerId: number): boolean {
    const steamer = this.steamers.find(s => s.id === steamerId);
    if (!steamer || !steamer.unlocked) return false;
    if (this.carried.type !== 'bundle' || this.carried.count <= 0) return false;

    const freeInputSlots = this.config.steamerInputCapacity - steamer.inputBundles;
    if (freeInputSlots <= 0) return false;

    const transferred = Math.min(this.carried.count, freeInputSlots);
    steamer.inputBundles += transferred;
    this.carried.count -= transferred;
    if (this.carried.count === 0) {
      this.carried = { type: null, count: 0 };
    }
    this.startQueuedSteamer(steamer);
    this.notify();
    return true;
  }

  /** Start exactly one queued bundle when the steamer has a free output tray. */
  private startQueuedSteamer(steamer: SteamerSlot): boolean {
    if (
      steamer.state !== 'idle' ||
      steamer.hasOutput ||
      steamer.inputBundles <= 0
    ) {
      return false;
    }

    steamer.inputBundles -= 1;
    steamer.state = 'steaming';
    steamer.timer = 0;
    steamer.progress = 0;
    return true;
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
      steamer.hasOutput = false;
      steamer.progress = 0;
      steamer.timer = 0;
      steamer.state = 'idle';
      this.startQueuedSteamer(steamer);
      this.notify();
      return true;
    } else if (this.carried.type === 'batch' && this.carried.count < maxBatches) {
      this.carried.count += 1;
      steamer.hasOutput = false;
      steamer.progress = 0;
      steamer.timer = 0;
      steamer.state = 'idle';
      this.startQueuedSteamer(steamer);
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
   * Before hiring the packer, the player starts one packing job by interacting
   * with the table. That job continues after they walk away. The packer starts
   * queued jobs automatically. A job is never started unless three output slots
   * are already reserved, preventing a full box shelf from consuming a batch.
   */
  public updatePackingTable(deltaSeconds: number, isPlayerInteracting: boolean) {
    const table = this.packingTable;
    const hasOutputReservation =
      table.outputBoxes + this.config.boxesPerBatch <= this.config.packingOutputCapacityBoxes;
    const mayStart =
      table.inputBatches > 0 &&
      hasOutputReservation &&
      (isPlayerInteracting || this.upgrades.hasPacker);

    let changed = false;
    if (!table.isPacking && mayStart) {
      table.isPacking = true;
      changed = true;
    }

    if (table.isPacking) {
      const speedMultiplier = this.upgrades.hasPacker ? 1.5 : 1;
      table.timer += deltaSeconds * speedMultiplier;
      table.progress = Math.min(1, table.timer / this.config.packingTimeSeconds);
      changed = true;

      if (table.timer >= this.config.packingTimeSeconds) {
        // The output reservation was checked before work began; completing this
        // transaction consumes one batch and creates exactly one box bundle.
        table.inputBatches -= 1;
        table.outputBoxes += this.config.boxesPerBatch;
        table.timer = 0;
        table.progress = 0;
        table.isPacking = false;
      }
    }

    if (changed) this.notify();
  }

  /**
   * Determine service tier, star rating, tip per box, and feedback message based on patience fraction.
   */
  public getServiceTier(patienceFraction?: number): {
    stars: number;
    tipPerBox: number;
    feedback: string;
  } {
    if (patienceFraction === undefined) {
      return { stars: 4, tipPerBox: 0, feedback: 'Thank you!' };
    }
    if (patienceFraction >= this.config.tipTier5StarPatienceThreshold) {
      return {
        stars: 5,
        tipPerBox: this.config.tipTier5StarAmountPerBox,
        feedback: 'Festival favourite!'
      };
    }
    if (patienceFraction >= this.config.tipTier4StarPatienceThreshold) {
      return {
        stars: 4,
        tipPerBox: this.config.tipTier4StarAmountPerBox,
        feedback: 'Thank you!'
      };
    }
    if (patienceFraction >= this.config.tipTier3StarPatienceThreshold) {
      return {
        stars: 3,
        tipPerBox: this.config.tipTier3StarAmountPerBox,
        feedback: 'Service was slow'
      };
    }
    return {
      stars: 2,
      tipPerBox: this.config.tipTier2StarAmountPerBox,
      feedback: 'Long wait!'
    };
  }

  /**
   * Deterministic rating update clamped to configured limits.
   * newRating = oldRating * 0.75 + latestServiceStars * 0.25
   */
  public updateBusinessRating(latestServiceStars: number): number {
    const clampedStars = Math.max(1, Math.min(5, latestServiceStars));
    const newRating =
      this.businessRating * this.config.ratingWeightOld +
      clampedStars * this.config.ratingWeightNew;
    let rounded = Math.round(newRating * 100) / 100;
    if (Math.abs(rounded - clampedStars) <= 0.03) {
      rounded = clampedStars;
    }
    this.businessRating = Math.max(
      this.config.minBusinessRating,
      Math.min(this.config.maxBusinessRating, rounded)
    );
    return this.businessRating;
  }

  /**
   * Record an unserved customer departure at 0 patience.
   * Awards 1-star penalty, deducts no stock, awards no coins.
   */
  public recordCustomerDeparture(): { stars: number; feedbackText: string; ratingAfter: number } {
    const stars = 1;
    this.updateBusinessRating(stars);
    this.stats.customersDeparted = (this.stats.customersDeparted || 0) + 1;
    this.notify();
    return {
      stars: 1,
      feedbackText: 'Left unserved',
      ratingAfter: this.businessRating
    };
  }

  /**
   * Cashier NPC automated service:
   * Serves waiting front customer directly from counter shelf stock.
   */
  public autoServeWithCashier(
    requestedBoxes: number,
    patienceFraction?: number
  ): CustomerSaleResult {
    if (!this.upgrades.hasCashier) return { success: false, coinsEarned: 0 };
    if (!Number.isInteger(requestedBoxes) || requestedBoxes <= 0) {
      return { success: false, coinsEarned: 0 };
    }
    if (this.counterBoxesStock < requestedBoxes) {
      return { success: false, coinsEarned: 0 };
    }

    this.counterBoxesStock -= requestedBoxes;

    const tier = this.getServiceTier(patienceFraction);
    const basePayment = requestedBoxes * this.config.boxSalePrice;
    const tipEarned = requestedBoxes * tier.tipPerBox;
    const totalPayment = basePayment + tipEarned;

    this.coins += totalPayment;
    this.stats.totalBoxesSold += requestedBoxes;
    this.stats.totalRevenue += totalPayment;
    this.stats.customersServed += 1;
    if (tipEarned > 0) {
      this.stats.totalTipsEarned = (this.stats.totalTipsEarned || 0) + tipEarned;
    }

    this.updateBusinessRating(tier.stars);

    const feedbackText = tipEarned > 0 ? `${tier.feedback} +₹${tipEarned} tip` : tier.feedback;
    this.notify();

    if (patienceFraction === undefined) {
      return { success: true, coinsEarned: totalPayment };
    }

    return {
      success: true,
      basePayment,
      tipEarned,
      coinsEarned: totalPayment,
      stars: tier.stars,
      feedbackText
    };
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
  public serveCustomer(
    requestedBoxes: number,
    patienceFraction?: number
  ): CustomerSaleResult {
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

    const tier = this.getServiceTier(patienceFraction);
    const basePayment = requestedBoxes * this.config.boxSalePrice;
    const tipEarned = requestedBoxes * tier.tipPerBox;
    const totalPayment = basePayment + tipEarned;

    this.coins += totalPayment;
    this.stats.totalBoxesSold += requestedBoxes;
    this.stats.totalRevenue += totalPayment;
    this.stats.customersServed += 1;
    if (tipEarned > 0) {
      this.stats.totalTipsEarned = (this.stats.totalTipsEarned || 0) + tipEarned;
    }

    this.updateBusinessRating(tier.stars);

    const feedbackText = tipEarned > 0 ? `${tier.feedback} +₹${tipEarned} tip` : tier.feedback;
    this.notify();

    if (patienceFraction === undefined) {
      return { success: true, coinsEarned: totalPayment };
    }

    return {
      success: true,
      basePayment,
      tipEarned,
      coinsEarned: totalPayment,
      stars: tier.stars,
      feedbackText
    };
  }

  /**
   * Determine the current contextual objective for player guidance.
   */
  public getCurrentObjective(): { key: ObjectiveKey; text: string } {
    if (
      this.ingredientStorageBundles === 0 &&
      this.carried.type !== 'bundle' &&
      this.steamers.every(s => s.state === 'idle' && s.inputBundles === 0)
    ) {
      return { key: 'BUY_INGREDIENT', text: 'Step on the Ingredient Shelf to buy ingredients (12 coins)' };
    }
    if (
      this.ingredientStorageBundles > 0 &&
      this.carried.type === null &&
      this.steamers.some(s => s.unlocked && s.inputBundles < this.config.steamerInputCapacity) &&
      this.steamers.every(s => !s.unlocked || s.state === 'idle') &&
      this.packingTable.inputBatches === 0 &&
      this.packingTable.outputBoxes === 0
    ) {
      return { key: 'BUY_INGREDIENT', text: 'Collect ingredients from the supply shelf' };
    }
    const hasReadySteamer = this.steamers.some(s => s.unlocked && s.state === 'ready');
    const hasInputSpace = this.steamers.some(
      s => s.unlocked && s.inputBundles < this.config.steamerInputCapacity
    );
    if (this.carried.type === 'bundle' && hasReadySteamer && !hasInputSpace) {
      return {
        key: 'COLLECT_MODAKS',
        text: 'Hands full of ingredients — return them at the Shelf to collect cooked modaks'
      };
    }
    if (this.carried.type === 'bundle') {
      return {
        key: 'LOAD_STEAMER',
        text: hasReadySteamer
          ? 'Unload ingredients at the Steamer, then take the cooked modaks'
          : 'Carry the ingredient bundle to the Steamer'
      };
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
    if (this.packingTable.inputBatches > 0 && this.packingTable.outputBoxes < this.config.packingOutputCapacityBoxes) {
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
