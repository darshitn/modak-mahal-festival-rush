import { describe, it, expect } from 'vitest';
import { GameState } from '../state/GameState.ts';
import { BALANCE } from '../config/balance.ts';

describe('Modak Mahal Economy & State Loop (M1)', () => {
  it('initializes with correct starting inventory and cash', () => {
    const state = new GameState();
    expect(state.coins).toBe(BALANCE.startingCash); // 30 coins
    expect(state.ingredientStorageBundles).toBe(BALANCE.startingBundles); // 2 bundles
    expect(state.carried.type).toBeNull();
    expect(state.carried.count).toBe(0);
    expect(state.counterBoxesStock).toBe(0);
    expect(state.steamers[0].state).toBe('idle');
  });

  it('handles buying bundles cleanly and prohibits purchase when funds are insufficient', () => {
    const state = new GameState();
    // Has 30 coins. Bundle costs 12.
    expect(state.buyBundle()).toBe(true);
    expect(state.coins).toBe(18);
    expect(state.ingredientStorageBundles).toBe(3);

    expect(state.buyBundle()).toBe(true);
    expect(state.coins).toBe(6);
    expect(state.ingredientStorageBundles).toBe(4);

    // Now has 6 coins, less than 12. Must fail.
    expect(state.buyBundle()).toBe(false);
    expect(state.coins).toBe(6);
    expect(state.ingredientStorageBundles).toBe(4);
  });

  it('runs through full Buy -> Cook -> Pack -> Serve -> Earn cycle conserving items', () => {
    const state = new GameState({ startingCash: 12, startingBundles: 0 });

    // Step 1: Buy bundle
    expect(state.buyBundle()).toBe(true);
    expect(state.coins).toBe(0);
    expect(state.ingredientStorageBundles).toBe(1);

    // Step 2: Pick up bundle
    expect(state.pickupBundle()).toBe(true);
    expect(state.ingredientStorageBundles).toBe(0);
    expect(state.carried.type).toBe('bundle');
    expect(state.carried.count).toBe(1);

    // Step 3: Load into idle steamer
    expect(state.loadSteamer(0)).toBe(true);
    expect(state.carried.type).toBeNull();
    expect(state.carried.count).toBe(0);
    expect(state.steamers[0].state).toBe('steaming');

    // Steamer cannot be loaded twice while steaming
    expect(state.loadSteamer(0)).toBe(false);

    // Step 4: Advance steamer timer (8 seconds)
    state.updateSteamers(4);
    expect(state.steamers[0].state).toBe('steaming');
    expect(state.steamers[0].progress).toBeCloseTo(0.5);

    state.updateSteamers(4.5);
    expect(state.steamers[0].state).toBe('ready');
    expect(state.steamers[0].hasOutput).toBe(true);

    // Step 5: Collect cooked batch
    expect(state.collectBatchFromSteamer(0)).toBe(true);
    expect(state.steamers[0].state).toBe('idle');
    expect(state.carried.type).toBe('batch');
    expect(state.carried.count).toBe(1);

    // Step 6: Deposit to packing table
    expect(state.loadPackingTable()).toBe(true);
    expect(state.carried.type).toBeNull();
    expect(state.carried.count).toBe(0);
    expect(state.packingTable.inputBatches).toBe(1);
    expect(state.packingTable.outputBoxes).toBe(0);

    // Step 7: Progress packing (3 seconds)
    state.updatePackingTable(1.5, true);
    expect(state.packingTable.isPacking).toBe(true);
    expect(state.packingTable.outputBoxes).toBe(0);

    state.updatePackingTable(1.6, true);
    expect(state.packingTable.inputBatches).toBe(0);
    expect(state.packingTable.outputBoxes).toBe(3); // 1 batch yields 3 boxes

    // Step 8: Collect boxes
    expect(state.collectBoxesFromPackingTable()).toBe(true);
    expect(state.packingTable.outputBoxes).toBe(0);
    expect(state.carried.type).toBe('box');
    expect(state.carried.count).toBe(3);

    // Step 9: Serve customer requesting 1 box
    const sale1 = state.serveCustomer(1);
    expect(sale1.success).toBe(true);
    expect(sale1.coinsEarned).toBe(10);
    expect(state.coins).toBe(10);
    expect(state.carried.count).toBe(2);

    // Serve customer requesting 2 boxes
    const sale2 = state.serveCustomer(2);
    expect(sale2.success).toBe(true);
    expect(sale2.coinsEarned).toBe(20);
    expect(state.coins).toBe(30);
    expect(state.carried.type).toBeNull();
    expect(state.carried.count).toBe(0);

    // Total boxes sold is 3, total revenue is 30 coins
    expect(state.stats.totalBoxesSold).toBe(3);
    expect(state.stats.totalRevenue).toBe(30);

    // Trying to serve when empty must fail
    const sale3 = state.serveCustomer(1);
    expect(sale3.success).toBe(false);
    expect(state.coins).toBe(30);
  });

  it('allows returning items to storage so player never gets trapped', () => {
    const state = new GameState();
    state.pickupBundle();
    expect(state.carried.type).toBe('bundle');
    expect(state.carried.count).toBe(1);

    expect(state.returnBundleToStorage()).toBe(true);
    expect(state.carried.type).toBeNull();
    expect(state.carried.count).toBe(0);
    expect(state.ingredientStorageBundles).toBe(BALANCE.startingBundles);
  });

  it('unloads a two-bundle stack into one steamer and safely chains the queued cook', () => {
    const state = new GameState({ startingCash: 42, startingBundles: 2 });
    expect(state.buyCarryUpgrade()).toBe(true);
    expect(state.pickupBundle()).toBe(true);
    expect(state.pickupBundle()).toBe(true);
    expect(state.carried).toEqual({ type: 'bundle', count: 2 });

    // Both bundles leave the player's hands. One begins steaming and one is
    // visible in the steamer input queue, so the carry upgrade removes trips.
    expect(state.loadSteamer(0)).toBe(true);
    expect(state.carried).toEqual({ type: null, count: 0 });
    expect(state.steamers[0].state).toBe('steaming');
    expect(state.steamers[0].inputBundles).toBe(1);

    state.updateSteamers(state.config.steamTimeSeconds + 0.1);
    expect(state.steamers[0].state).toBe('ready');
    expect(state.steamers[0].hasOutput).toBe(true);
    expect(state.steamers[0].inputBundles).toBe(1);

    // Taking the tray starts exactly one queued bundle; neither bundle is lost.
    expect(state.collectBatchFromSteamer(0)).toBe(true);
    expect(state.carried).toEqual({ type: 'batch', count: 1 });
    expect(state.steamers[0].state).toBe('steaming');
    expect(state.steamers[0].inputBundles).toBe(0);
    expect(state.steamers[0].hasOutput).toBe(false);
  });

  it('keeps a carried bundle recoverable when every steamer input shelf is full', () => {
    const state = new GameState({ startingBundles: 0 });
    state.carried = { type: 'bundle', count: 1 };
    state.steamers[0].inputBundles = state.config.steamerInputCapacity;

    expect(state.loadSteamer(0)).toBe(false);
    expect(state.carried).toEqual({ type: 'bundle', count: 1 });
    expect(state.returnBundleToStorage()).toBe(true);
    expect(state.ingredientStorageBundles).toBe(1);
    expect(state.carried).toEqual({ type: null, count: 0 });
  });

  it('does not consume a batch when the packing output shelf is full', () => {
    const state = new GameState({ startingBundles: 0 });
    state.packingTable.inputBatches = 1;
    state.packingTable.outputBoxes = state.config.packingOutputCapacityBoxes;

    state.updatePackingTable(state.config.packingTimeSeconds * 2, true);
    expect(state.packingTable.isPacking).toBe(false);
    expect(state.packingTable.inputBatches).toBe(1);
    expect(state.packingTable.outputBoxes).toBe(state.config.packingOutputCapacityBoxes);

    // A returned cooked batch still has a receiving area even when the box
    // shelf is full, and packing resumes safely after boxes are collected.
    state.carried = { type: 'batch', count: 1 };
    expect(state.loadPackingTable()).toBe(true);
    expect(state.packingTable.inputBatches).toBe(2);
    expect(state.collectBoxesFromPackingTable()).toBe(true);
    expect(state.packingTable.outputBoxes).toBe(
      state.config.packingOutputCapacityBoxes - state.config.boxesPerBatch
    );
    state.depositBoxesToCounter();

    state.updatePackingTable(state.config.packingTimeSeconds + 0.1, true);
    expect(state.packingTable.inputBatches).toBe(1);
    expect(state.packingTable.outputBoxes).toBe(state.config.packingOutputCapacityBoxes);
  });

  it('finishes a player-started packing job after the player walks away', () => {
    const state = new GameState({ startingBundles: 0 });
    state.packingTable.inputBatches = 1;

    state.updatePackingTable(1, true);
    expect(state.packingTable.isPacking).toBe(true);

    state.updatePackingTable(state.config.packingTimeSeconds, false);
    expect(state.packingTable.isPacking).toBe(false);
    expect(state.packingTable.inputBatches).toBe(0);
    expect(state.packingTable.outputBoxes).toBe(state.config.boxesPerBatch);
  });

  it('guides the player to wait while an active steamer is cooking', () => {
    const state = new GameState();
    expect(state.pickupBundle()).toBe(true);
    expect(state.loadSteamer(0)).toBe(true);

    expect(state.getCurrentObjective()).toEqual({
      key: 'WAIT_STEAM',
      text: 'Waiting for modaks to steam...'
    });
  });

  it('deposits an incomplete box amount at the counter and frees the player to keep producing', () => {
    const state = new GameState({ startingCash: 0, startingBundles: 1 });
    state.carried = { type: 'box', count: 1 };

    expect(state.serveCustomer(2)).toEqual({ success: false, coinsEarned: 0 });
    expect(state.carried).toEqual({ type: 'box', count: 1 });
    expect(state.counterBoxesStock).toBe(0);

    expect(state.depositBoxesToCounter()).toBe(true);
    expect(state.carried).toEqual({ type: null, count: 0 });
    expect(state.counterBoxesStock).toBe(1);

    // Hands are free to pick up existing ingredients even with no cash.
    expect(state.pickupBundle()).toBe(true);
    expect(state.carried).toEqual({ type: 'bundle', count: 1 });
  });

  it('pools carried and counter boxes to fulfill one order with exactly one payment', () => {
    const state = new GameState({ startingCash: 0, startingBundles: 0 });
    state.carried = { type: 'box', count: 1 };
    state.counterBoxesStock = 1;

    expect(state.serveCustomer(2)).toEqual({ success: true, coinsEarned: 20 });
    expect(state.carried).toEqual({ type: null, count: 0 });
    expect(state.counterBoxesStock).toBe(0);
    expect(state.coins).toBe(20);
    expect(state.stats.totalBoxesSold).toBe(2);
    expect(state.stats.totalRevenue).toBe(20);

    // Repeating the same request cannot duplicate stock or payment.
    expect(state.serveCustomer(2)).toEqual({ success: false, coinsEarned: 0 });
    expect(state.coins).toBe(20);
    expect(state.stats.totalBoxesSold).toBe(2);
  });

  it('leaves both inventories unchanged when pooled stock cannot fill the order', () => {
    const state = new GameState({ startingCash: 7, startingBundles: 0 });
    state.carried = { type: 'box', count: 1 };
    state.counterBoxesStock = 1;

    expect(state.serveCustomer(3)).toEqual({ success: false, coinsEarned: 0 });
    expect(state.carried).toEqual({ type: 'box', count: 1 });
    expect(state.counterBoxesStock).toBe(1);
    expect(state.coins).toBe(7);
    expect(state.stats.totalBoxesSold).toBe(0);
    expect(state.stats.totalRevenue).toBe(0);
  });

  describe('M2 Upgrades, Staff Automation & Working Capital', () => {
    it('enforces 12-coin working capital reserve on all purchases', () => {
      // Carry upgrade costs 30. With 40 coins: 40 - 30 = 10 (< 12 reserve), so purchase must fail!
      const state = new GameState({ startingCash: 40 });
      expect(state.canAffordUpgrade(30)).toBe(false);
      expect(state.buyCarryUpgrade()).toBe(false);
      expect(state.coins).toBe(40);
      expect(state.upgrades.hasCarryUpgrade).toBe(false);

      // With 42 coins: 42 - 30 = 12 (>= 12 reserve), purchase succeeds!
      state.coins = 42;
      expect(state.canAffordUpgrade(30)).toBe(true);
      expect(state.buyCarryUpgrade()).toBe(true);
      expect(state.coins).toBe(12);
      expect(state.upgrades.hasCarryUpgrade).toBe(true);

      // Cannot buy again
      expect(state.buyCarryUpgrade()).toBe(false);
      expect(state.coins).toBe(12);
    });

    it('expands carry capacity upon carry upgrade', () => {
      const state = new GameState();
      expect(state.getCarryCapacity('bundle')).toBe(1);
      expect(state.getCarryCapacity('batch')).toBe(1);
      expect(state.getCarryCapacity('box')).toBe(3);

      state.coins = 100;
      expect(state.buyCarryUpgrade()).toBe(true);
      expect(state.getCarryCapacity('bundle')).toBe(2);
      expect(state.getCarryCapacity('batch')).toBe(2);
      expect(state.getCarryCapacity('box')).toBe(6);
    });

    it('packer helper automates and accelerates batch packaging', () => {
      const state = new GameState();
      state.coins = 100;
      expect(state.buyPacker()).toBe(true);
      expect(state.upgrades.hasPacker).toBe(true);

      state.packingTable.inputBatches = 1;
      // When isPlayerInteracting is false, packer still packs!
      state.updatePackingTable(1.0, false);
      expect(state.packingTable.isPacking).toBe(true);

      // With 1.5x speed, 2 seconds total finishes 3s packing (1.0 + 1.1 = 2.1s * 1.5 = 3.15s)
      state.updatePackingTable(1.1, false);
      expect(state.packingTable.inputBatches).toBe(0);
      expect(state.packingTable.outputBoxes).toBe(3);
    });

    it('cashier helper auto-serves customer from counter stock', () => {
      const state = new GameState();
      state.coins = 100;
      expect(state.buyCashier()).toBe(true);
      expect(state.upgrades.hasCashier).toBe(true);

      state.counterBoxesStock = 2;
      const initialCoins = state.coins;

      const res = state.autoServeWithCashier(2);
      expect(res.success).toBe(true);
      expect(res.coinsEarned).toBe(20);
      expect(state.counterBoxesStock).toBe(0);
      expect(state.coins).toBe(initialCoins + 20);
      expect(state.stats.totalBoxesSold).toBe(2);
    });

    it('second steamer unlocks and cooks in parallel', () => {
      const state = new GameState();
      expect(state.steamers[1].unlocked).toBe(false);

      state.coins = 150;
      expect(state.buySecondSteamer()).toBe(true);
      expect(state.steamers[1].unlocked).toBe(true);

      // Load both steamers
      state.carried = { type: 'bundle', count: 1 };
      expect(state.loadSteamer(0)).toBe(true);
      state.carried = { type: 'bundle', count: 1 };
      expect(state.loadSteamer(1)).toBe(true);

      expect(state.steamers[0].state).toBe('steaming');
      expect(state.steamers[1].state).toBe('steaming');

      state.updateSteamers(8.5);
      expect(state.steamers[0].state).toBe('ready');
      expect(state.steamers[1].state).toBe('ready');
    });

    it('completes the upgraded loop after unloading both carried bundles', () => {
      const state = new GameState({ startingCash: 42, startingBundles: 2 });

      expect(state.buyCarryUpgrade()).toBe(true);
      expect(state.coins).toBe(12);
      expect(state.pickupBundle()).toBe(true);
      expect(state.pickupBundle()).toBe(true);
      expect(state.carried).toEqual({ type: 'bundle', count: 2 });

      expect(state.loadSteamer(0)).toBe(true);
      expect(state.carried).toEqual({ type: null, count: 0 });
      expect(state.steamers[0].inputBundles).toBe(1);
      state.updateSteamers(state.config.steamTimeSeconds + 0.1);
      expect(state.steamers[0].state).toBe('ready');

      expect(state.collectBatchFromSteamer(0)).toBe(true);
      expect(state.carried).toEqual({ type: 'batch', count: 1 });
      expect(state.steamers[0].state).toBe('steaming');
      expect(state.loadPackingTable()).toBe(true);
      state.updatePackingTable(state.config.packingTimeSeconds + 0.1, true);
      expect(state.packingTable.outputBoxes).toBe(3);

      expect(state.collectBoxesFromPackingTable()).toBe(true);
      expect(state.serveCustomer(3)).toEqual({ success: true, coinsEarned: 30 });
      expect(state.coins).toBe(42);
      expect(state.carried).toEqual({ type: null, count: 0 });
      expect(state.counterBoxesStock).toBe(0);
      expect(state.stats.totalBoxesSold).toBe(3);
      expect(state.stats.totalRevenue).toBe(30);
    });
  });
});
