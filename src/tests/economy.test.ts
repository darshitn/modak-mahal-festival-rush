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
});
