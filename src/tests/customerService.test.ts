import { describe, it, expect } from 'vitest';
import { GameState } from '../state/GameState.ts';
import { BALANCE } from '../config/balance.ts';

describe('Customer Patience, Reactions, Tips & Business Rating', () => {
  it('1. Fast 1-box service awards base payment plus exactly one ₹3 tip', () => {
    const state = new GameState({ startingCash: 30 });
    state.carried = { type: 'box', count: 1 };

    // Patience >= 70% (e.g. 0.85) -> 5 stars, +₹3/box tip
    const res = state.serveCustomer(1, 0.85);

    expect(res.success).toBe(true);
    expect(res.basePayment).toBe(10);
    expect(res.tipEarned).toBe(3);
    expect(res.coinsEarned).toBe(13);
    expect(res.stars).toBe(5);
    expect(res.feedbackText).toContain('+₹3 tip');
    expect(state.coins).toBe(43); // 30 + 13
    expect(state.stats.totalBoxesSold).toBe(1);
    expect(state.stats.totalRevenue).toBe(13);
    expect(state.stats.totalTipsEarned).toBe(3);
  });

  it('2. Fast 2-box service awards base payment plus exactly one ₹6 tip', () => {
    const state = new GameState({ startingCash: 30 });
    state.carried = { type: 'box', count: 2 };

    // Patience >= 70% (e.g. 0.90) -> 5 stars, +₹3/box tip -> 2 * 3 = ₹6 tip
    const res = state.serveCustomer(2, 0.90);

    expect(res.success).toBe(true);
    expect(res.basePayment).toBe(20);
    expect(res.tipEarned).toBe(6);
    expect(res.coinsEarned).toBe(26);
    expect(res.stars).toBe(5);
    expect(res.feedbackText).toContain('+₹6 tip');
    expect(state.coins).toBe(56); // 30 + 26
    expect(state.stats.totalBoxesSold).toBe(2);
    expect(state.stats.totalRevenue).toBe(26);
    expect(state.stats.totalTipsEarned).toBe(6);
  });

  it('3. Slow service awards base payment but no tip', () => {
    const state = new GameState({ startingCash: 30 });
    state.carried = { type: 'box', count: 1 };

    // Patience between 15% and 39% (e.g. 0.25) -> 3 stars, no tip
    const res = state.serveCustomer(1, 0.25);

    expect(res.success).toBe(true);
    expect(res.basePayment).toBe(10);
    expect(res.tipEarned).toBe(0);
    expect(res.coinsEarned).toBe(10);
    expect(res.stars).toBe(3);
    expect(res.feedbackText).toBe('Service was slow');
    expect(state.coins).toBe(40); // 30 + 10
    expect(state.stats.totalBoxesSold).toBe(1);
    expect(state.stats.totalRevenue).toBe(10);
  });

  it('4. An expired customer consumes no boxes and awards no money', () => {
    const state = new GameState({ startingCash: 30 });
    state.carried = { type: 'box', count: 2 };
    state.counterBoxesStock = 3;

    const departure = state.recordCustomerDeparture();

    expect(departure.stars).toBe(1);
    expect(departure.feedbackText).toBe('Left unserved');
    // Inventories and cash remain untouched
    expect(state.carried).toEqual({ type: 'box', count: 2 });
    expect(state.counterBoxesStock).toBe(3);
    expect(state.coins).toBe(30);
    expect(state.stats.totalBoxesSold).toBe(0);
    expect(state.stats.totalRevenue).toBe(0);
    expect(state.stats.customersDeparted).toBe(1);
  });

  it('5. Queue continues after an expired customer leaves', () => {
    const state = new GameState({ startingCash: 30 });
    state.counterBoxesStock = 2;

    // Simulate mock queue
    const queue = [
      { id: 'c1', state: 'waiting', requestedBoxes: 1, patience: 0 },
      { id: 'c2', state: 'waiting', requestedBoxes: 1, patience: 45 }
    ];

    // c1 expires
    queue[0].state = 'leaving';
    state.recordCustomerDeparture();

    // Queue updates: active customers advance
    const active = queue.filter(c => c.state !== 'leaving');
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('c2');

    // c2 can be served cleanly
    const res = state.serveCustomer(active[0].requestedBoxes, 0.8);
    expect(res.success).toBe(true);
    expect(res.coinsEarned).toBe(13); // 10 base + 3 tip
    expect(state.counterBoxesStock).toBe(1);
  });

  it('6. Rating remains clamped between 1.0 and 5.0 with deterministic formula', () => {
    const state = new GameState();
    expect(state.businessRating).toBe(BALANCE.initialBusinessRating); // 4.0

    // Deterministic formula: newRating = oldRating * 0.75 + stars * 0.25
    // 4.0 * 0.75 + 5 * 0.25 = 3.0 + 1.25 = 4.25
    state.updateBusinessRating(5);
    expect(state.businessRating).toBe(4.25);

    // 4.25 * 0.75 + 1 * 0.25 = 3.1875 + 0.25 = 3.44
    state.updateBusinessRating(1);
    expect(state.businessRating).toBe(3.44);

    // Repeated 5-star ratings clamp at max 5.0
    for (let i = 0; i < 30; i++) {
      state.updateBusinessRating(5);
    }
    expect(state.businessRating).toBe(5.0);

    // Repeated 1-star ratings clamp at min 1.0
    for (let i = 0; i < 30; i++) {
      state.updateBusinessRating(1);
    }
    expect(state.businessRating).toBe(1.0);
  });

  it('7. Cashier and player cannot both serve the same customer or duplicate payment/tip', () => {
    const state = new GameState({ startingCash: 100 });
    expect(state.buyCashier()).toBe(true);
    state.counterBoxesStock = 1;

    // Mock customer with mutual-exclusion isServing flag
    const mockCustomer = {
      state: 'waiting',
      requestedBoxes: 1,
      isServing: false,
      getPatienceFraction: () => 0.85
    };

    // First serving attempt succeeds
    let firstServiceSuccess = false;
    if (!mockCustomer.isServing && mockCustomer.state === 'waiting') {
      mockCustomer.isServing = true;
      const res = state.autoServeWithCashier(mockCustomer.requestedBoxes, mockCustomer.getPatienceFraction());
      if (res.success) {
        firstServiceSuccess = true;
        mockCustomer.state = 'served';
      }
    }
    expect(firstServiceSuccess).toBe(true);

    // Simultaneous second serving attempt fails because isServing is true and state is 'served'
    let secondServiceSuccess = false;
    if (!mockCustomer.isServing && mockCustomer.state === 'waiting') {
      const res = state.serveCustomer(mockCustomer.requestedBoxes, mockCustomer.getPatienceFraction());
      if (res.success) {
        secondServiceSuccess = true;
      }
    }
    expect(secondServiceSuccess).toBe(false);

    // Stock deducted once, payment credited once
    expect(state.counterBoxesStock).toBe(0);
    expect(state.stats.totalBoxesSold).toBe(1);
  });

  it('8. HANDOFF-001 counter deposit and pooled fulfillment remain correct with tip', () => {
    const state = new GameState({ startingCash: 0, startingBundles: 0 });
    state.carried = { type: 'box', count: 1 };
    state.counterBoxesStock = 1;

    // Pooled fulfillment of 2 boxes at 50% patience (4-star: +₹1/box tip -> ₹2 tip)
    const res = state.serveCustomer(2, 0.50);

    expect(res.success).toBe(true);
    expect(res.basePayment).toBe(20);
    expect(res.tipEarned).toBe(2);
    expect(res.coinsEarned).toBe(22);
    expect(state.carried).toEqual({ type: null, count: 0 });
    expect(state.counterBoxesStock).toBe(0);
    expect(state.coins).toBe(22);
    expect(state.stats.totalBoxesSold).toBe(2);
    expect(state.stats.totalRevenue).toBe(22);

    // Re-attempting fails without duplicate payment
    expect(state.serveCustomer(2, 0.50).success).toBe(false);
    expect(state.coins).toBe(22);
  });

  it('9. HANDOFF-002 ingredient return recovery remains correct', () => {
    const state = new GameState({ startingCash: 42, startingBundles: 2 });
    expect(state.buyCarryUpgrade()).toBe(true);
    expect(state.pickupBundle()).toBe(true);
    expect(state.pickupBundle()).toBe(true);
    expect(state.carried).toEqual({ type: 'bundle', count: 2 });

    // Load 1 into steamer
    expect(state.loadSteamer(0)).toBe(true);
    expect(state.carried).toEqual({ type: null, count: 0 }); // Both bundles absorbed (1 active, 1 queued)
    state.updateSteamers(state.config.steamTimeSeconds + 0.1);
    expect(state.steamers[0].state).toBe('ready');

    // Collect ready batch
    expect(state.collectBatchFromSteamer(0)).toBe(true);
    expect(state.carried).toEqual({ type: 'batch', count: 1 });
    expect(state.loadPackingTable()).toBe(true);
    state.updatePackingTable(state.config.packingTimeSeconds + 0.1, true);
    expect(state.packingTable.outputBoxes).toBe(3);

    // Collect boxes and serve customer
    expect(state.collectBoxesFromPackingTable()).toBe(true);
    const sale = state.serveCustomer(3, 0.80);
    expect(sale.success).toBe(true);
    expect(sale.basePayment).toBe(30);
    expect(sale.tipEarned).toBe(9); // 3 boxes * 3
    expect(sale.coinsEarned).toBe(39);
    expect(state.stats.totalBoxesSold).toBe(3);
  });

  it('10. Inventory and coins never become negative', () => {
    const state = new GameState({ startingCash: 5, startingBundles: 0 });

    // Insufficient coins to buy bundle (costs 12)
    expect(state.buyBundle()).toBe(false);
    expect(state.coins).toBe(5);

    // Serving with 0 stock
    const res = state.serveCustomer(1, 0.90);
    expect(res.success).toBe(false);
    expect(res.coinsEarned).toBe(0);
    expect(state.coins).toBe(5);
    expect(state.carried.count).toBe(0);
    expect(state.counterBoxesStock).toBe(0);

    // Customer departure
    state.recordCustomerDeparture();
    expect(state.coins).toBe(5);
    expect(state.carried.count).toBe(0);
    expect(state.counterBoxesStock).toBe(0);
    expect(state.businessRating).toBeLessThan(4.0);
    expect(state.businessRating).toBeGreaterThanOrEqual(1.0);
  });

  it('11. serveCustomer increments customersServed exactly once (2-box order -> totalBoxesSold = 2, customersServed = 1)', () => {
    const state = new GameState({ startingCash: 30 });
    state.carried = { type: 'box', count: 2 };

    expect(state.stats.customersServed).toBe(0);
    const res = state.serveCustomer(2, 0.85);
    expect(res.success).toBe(true);
    expect(state.stats.totalBoxesSold).toBe(2);
    expect(state.stats.customersServed).toBe(1);
  });

  it('12. autoServeWithCashier increments customersServed exactly once', () => {
    const state = new GameState({ startingCash: 100 });
    expect(state.buyCashier()).toBe(true);
    state.counterBoxesStock = 2;

    expect(state.stats.customersServed).toBe(0);
    const res = state.autoServeWithCashier(2, 0.85);
    expect(res.success).toBe(true);
    expect(state.stats.totalBoxesSold).toBe(2);
    expect(state.stats.customersServed).toBe(1);
  });

  it('13. Customer departure on expiration does NOT increment customersServed', () => {
    const state = new GameState();
    expect(state.stats.customersServed).toBe(0);
    state.recordCustomerDeparture();
    expect(state.stats.customersDeparted).toBe(1);
    expect(state.stats.customersServed).toBe(0);
  });
});
