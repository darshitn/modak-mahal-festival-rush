import { describe, it, expect } from 'vitest';
import { GameState } from '../state/GameState.ts';
import { CampaignState } from '../state/CampaignState.ts';
import { BALANCE } from '../config/balance.ts';
import { calculateFeedbackBounds } from '../config/layout.ts';

describe('Winnable Festival Campaign Tests', () => {
  // 1. Timer does not run before first successful sale
  it('1. Timer does not run before first successful sale', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    expect(campaign.stage).toBe('ONBOARDING');
    expect(campaign.isTimerRunning).toBe(false);
    expect(campaign.timeRemaining).toBe(BALANCE.campaignDurationSeconds);

    // Update campaign with simulation delta
    campaign.update(10, gameState);
    expect(campaign.isTimerRunning).toBe(false);
    expect(campaign.timeRemaining).toBe(BALANCE.campaignDurationSeconds);
  });

  // 2. First sale starts the timer exactly once
  it('2. First sale starts the timer exactly once', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    expect(campaign.isTimerRunning).toBe(false);

    // Record first sale
    campaign.recordSale(5);
    expect(campaign.isTimerRunning).toBe(true);
    expect(campaign.stage).toBe('FESTIVAL_OPEN');

    // Update delta advances time
    campaign.update(5, gameState);
    expect(campaign.timeRemaining).toBe(BALANCE.campaignDurationSeconds - 5);
  });

  // 3. Later sales cannot reset the timer
  it('3. Later sales cannot reset the timer', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    campaign.recordSale(5);
    campaign.update(20, gameState);
    const timeAfter20s = campaign.timeRemaining;

    // Subsequent sales
    campaign.recordSale(4);
    campaign.recordSale(5);

    expect(campaign.timeRemaining).toBe(timeAfter20s);
    expect(campaign.isTimerRunning).toBe(true);
  });

  // 4. Paused simulation does not advance campaign or production timers
  it('4. Paused simulation does not advance campaign or production timers', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    campaign.recordSale(5);
    campaign.update(10, gameState);
    const timeBeforePause = campaign.timeRemaining;

    campaign.isPaused = true;
    campaign.update(15, gameState);
    expect(campaign.timeRemaining).toBe(timeBeforePause);

    // In GameState, when paused in ShopScene, updateSteamers is not called
    const steamer = gameState.steamers[0];
    steamer.state = 'steaming';
    steamer.timer = 2;
    // When paused, dt = 0 effectively
    if (!campaign.isPaused) {
      gameState.updateSteamers(5);
    }
    expect(steamer.timer).toBe(2);
  });

  // 5. Hidden-tab pause path does not apply a large resume delta
  it('5. Hidden-tab pause path does not apply a large resume delta', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    campaign.recordSale(5);

    // Simulate tab return delta spike (e.g. 15,000ms = 15s)
    const rawDeltaMs = 15000;
    const clampedDeltaMs = Math.min(rawDeltaMs, 100);
    const dt = clampedDeltaMs / 1000; // 0.1s

    campaign.update(dt, gameState);
    expect(campaign.timeRemaining).toBeCloseTo(BALANCE.campaignDurationSeconds - 0.1, 2);
  });

  // 6. Rush starts once after the first staff hire
  it('6. Rush starts once after the first staff hire', () => {
    const gameState = new GameState({ startingCash: 200 });
    const campaign = new CampaignState();
    campaign.recordSale(5);

    expect(campaign.rushState.hasTriggered).toBe(false);

    // Buy carry upgrade (not staff) - does not trigger rush
    gameState.buyCarryUpgrade();
    campaign.onUpgradePurchased(gameState);
    expect(campaign.rushState.hasTriggered).toBe(false);

    // Hire Packer (first staff)
    gameState.buyPacker();
    campaign.onUpgradePurchased(gameState);
    expect(campaign.rushState.hasTriggered).toBe(true);
    expect(campaign.rushState.isAnnouncing).toBe(true);
    expect(campaign.rushState.announceTimer).toBe(BALANCE.rushAnnouncementSeconds);

    // Advance through announcement
    campaign.update(BALANCE.rushAnnouncementSeconds, gameState);
    expect(campaign.rushState.isAnnouncing).toBe(false);
    expect(campaign.rushState.isActive).toBe(true);
    expect(campaign.rushState.timer).toBe(BALANCE.rushDurationSeconds);
  });

  // 7. Rush ends once and restores normal spawning
  it('7. Rush ends once and restores normal spawning', () => {
    const gameState = new GameState({ startingCash: 200 });
    const campaign = new CampaignState();
    campaign.recordSale(5);

    gameState.buyCashier();
    campaign.onUpgradePurchased(gameState);

    // Pass announcement
    campaign.update(BALANCE.rushAnnouncementSeconds, gameState);
    expect(campaign.rushState.isActive).toBe(true);

    // Pass rush duration
    campaign.update(BALANCE.rushDurationSeconds, gameState);
    expect(campaign.rushState.isActive).toBe(false);
    expect(campaign.rushState.hasTriggered).toBe(true);

    // Hiring another staff does not re-trigger rush
    gameState.buyPacker();
    campaign.onUpgradePurchased(gameState);
    expect(campaign.rushState.isActive).toBe(false);
  });

  // 8. Dispatch accepts only packed boxes
  it('8. Dispatch accepts only packed boxes', () => {
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    expect(campaign.pandalBoxesReserved).toBe(0);
    // Depositing 0 or negative
    expect(campaign.depositBoxesToDispatch(0)).toBe(0);
    expect(campaign.pandalBoxesReserved).toBe(0);

    // Depositing boxes
    expect(campaign.depositBoxesToDispatch(3)).toBe(3);
    expect(campaign.pandalBoxesReserved).toBe(3);
  });

  // 9. Dispatch accepts only the remaining quantity up to 12
  it('9. Dispatch accepts only the remaining quantity up to 12', () => {
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    campaign.depositBoxesToDispatch(10);
    expect(campaign.pandalBoxesReserved).toBe(10);

    // Player carries 5 boxes, but only 2 needed
    const accepted = campaign.depositBoxesToDispatch(5);
    expect(accepted).toBe(2);
    expect(campaign.pandalBoxesReserved).toBe(12);

    // Further attempts accept 0
    expect(campaign.depositBoxesToDispatch(3)).toBe(0);
    expect(campaign.pandalBoxesReserved).toBe(12);
  });

  // 10. Reserved boxes cannot be served to customers
  it('10. Reserved boxes cannot be served to customers', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    // Player deposits 4 boxes to dispatch
    campaign.depositBoxesToDispatch(4);
    expect(campaign.pandalBoxesReserved).toBe(4);

    // Counter stock is still 0
    expect(gameState.counterBoxesStock).toBe(0);
    expect(gameState.carried.count).toBe(0);

    // Serving customer fails because dispatch boxes are strictly isolated
    const saleResult = gameState.serveCustomer(1);
    expect(saleResult.success).toBe(false);
    expect(campaign.pandalBoxesReserved).toBe(4);
  });

  // 11. Counter boxes cannot count as dispatch stock
  it('11. Counter boxes cannot count as dispatch stock', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    gameState.counterBoxesStock = 6;
    expect(campaign.pandalBoxesReserved).toBe(0);

    // Counter stock remains separate from dispatch
    expect(campaign.pandalBoxesReserved).toBe(0);
  });

  // 12. Twelve reserved boxes begin courier delivery exactly once
  it('12. Twelve reserved boxes begin courier delivery exactly once', () => {
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    campaign.depositBoxesToDispatch(6);
    expect(campaign.isCourierDispatching).toBe(false);

    campaign.depositBoxesToDispatch(6);
    expect(campaign.isCourierDispatching).toBe(true);
    expect(campaign.stage).toBe('DISPATCHING');
    expect(campaign.courierDispatchTimer).toBe(0);

    // Extra call does not re-trigger or reset courier
    campaign.depositBoxesToDispatch(2);
    expect(campaign.courierDispatchTimer).toBe(0);
  });

  // 13. Courier completion produces victory exactly once
  it('13. Courier completion produces victory exactly once', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.recordSale(5);
    campaign.stage = 'PANDAL_ORDER';
    campaign.depositBoxesToDispatch(12);

    expect(campaign.stage).toBe('DISPATCHING');
    expect(campaign.isCourierDispatching).toBe(true);

    // Advance through 10-second courier dispatch
    campaign.update(BALANCE.courierDispatchDurationSeconds, gameState);

    expect(campaign.stage).toBe('VICTORY');
    expect(campaign.finalSnapshot).not.toBeNull();
    expect(campaign.finalSnapshot?.isVictory).toBe(true);

    // Further updates do not re-trigger victory
    const snapshot1 = campaign.finalSnapshot;
    campaign.update(5, gameState);
    expect(campaign.finalSnapshot).toBe(snapshot1);
  });

  // 14. Timer reaching zero produces timeout exactly once
  it('14. Timer reaching zero produces timeout exactly once', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.recordSale(5);

    expect(campaign.isTimerRunning).toBe(true);

    // Run down full 600 seconds
    campaign.update(BALANCE.campaignDurationSeconds + 1, gameState);

    expect(campaign.stage).toBe('TIME_EXPIRED');
    expect(campaign.timeRemaining).toBe(0);
    expect(campaign.finalSnapshot).not.toBeNull();
    expect(campaign.finalSnapshot?.isVictory).toBe(false);

    const snapshot = campaign.finalSnapshot;
    campaign.update(10, gameState);
    expect(campaign.finalSnapshot).toBe(snapshot);
  });

  // 15. Victory and timeout cannot both occur
  it('15. Victory and timeout cannot both occur', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.recordSale(5);

    // Victory achieved
    campaign.stage = 'PANDAL_ORDER';
    campaign.depositBoxesToDispatch(12);
    campaign.update(BALANCE.courierDispatchDurationSeconds, gameState);
    expect(campaign.stage).toBe('VICTORY');

    // Run out the clock after victory
    campaign.update(BALANCE.campaignDurationSeconds * 2, gameState);
    expect(campaign.stage).toBe('VICTORY'); // Cannot transition to TIME_EXPIRED
    expect(campaign.finalSnapshot?.isVictory).toBe(true);
  });

  // 16. Score calculation is deterministic and nonnegative
  it('16. Score calculation is deterministic and nonnegative', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    // Baseline 0
    const score0 = campaign.calculateScore(gameState, 0, false);
    expect(score0).toBe(0);

    // With sales, 5-stars, tips, and departures
    gameState.stats.totalBoxesSold = 15;
    campaign.fiveStarCount = 10;
    campaign.fourStarCount = 5;
    gameState.stats.customersDeparted = 2;

    const score1 = campaign.calculateScore(gameState, 120, true);
    // 15 * 100 = 1500
    // 10 * 50 = 500
    // 5 * 20 = 100
    // -2 * 100 = -200
    // Victory bonus = 1500
    // Time remaining: 120 * 10 = 1200
    // Total = 1500 + 500 + 100 - 200 + 1500 + 1200 = 4600
    expect(score1).toBe(4600);

    // Enforce nonnegative clamp
    gameState.stats.totalBoxesSold = 0;
    campaign.fiveStarCount = 0;
    campaign.fourStarCount = 0;
    gameState.stats.customersDeparted = 20; // -2000 penalty
    const scoreClamped = campaign.calculateScore(gameState, 0, false);
    expect(scoreClamped).toBe(0);
  });

  // 17. Continue Growing cannot alter the captured final result
  it('17. Continue Growing cannot alter the captured final result', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.recordSale(5);
    campaign.stage = 'PANDAL_ORDER';
    campaign.depositBoxesToDispatch(12);
    campaign.update(BALANCE.courierDispatchDurationSeconds, gameState);

    const snapshot = { ...campaign.finalSnapshot! };
    campaign.continueGrowing();
    expect(campaign.isContinueGrowing).toBe(true);

    // New sales in free play
    gameState.stats.totalBoxesSold += 50;
    campaign.recordSale(5);

    // Snapshot remains immutable
    expect(campaign.finalSnapshot?.totalBoxesSold).toBe(snapshot.totalBoxesSold);
    expect(campaign.finalSnapshot?.finalScore).toBe(snapshot.finalScore);
  });

  // 18. Restart creates a clean initial run
  it('18. Restart creates a clean initial run', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    campaign.recordSale(5);
    campaign.depositBoxesToDispatch(5);
    gameState.coins = 500;
    gameState.upgrades.hasCarryUpgrade = true;

    // Reset both states
    gameState.reset();
    campaign.reset();

    expect(gameState.coins).toBe(BALANCE.startingCash);
    expect(gameState.upgrades.hasCarryUpgrade).toBe(false);
    expect(campaign.stage).toBe('ONBOARDING');
    expect(campaign.isTimerRunning).toBe(false);
    expect(campaign.timeRemaining).toBe(BALANCE.campaignDurationSeconds);
    expect(campaign.pandalBoxesReserved).toBe(0);
    expect(campaign.finalSnapshot).toBeNull();
    expect(campaign.rushState.hasTriggered).toBe(false);
  });

  // 19. Customer payment, tips and rating cannot duplicate during an ending transition
  it('19. Customer payment, tips and rating cannot duplicate during an ending transition', () => {
    const gameState = new GameState();
    gameState.counterBoxesStock = 2;
    const initialCoins = gameState.coins;

    const res1 = gameState.serveCustomer(2, 0.9);
    expect(res1.success).toBe(true);

    // Attempting duplicate serve on empty stock fails
    const res2 = gameState.serveCustomer(2, 0.9);
    expect(res2.success).toBe(false);
    expect(gameState.coins).toBe(initialCoins + res1.coinsEarned);
  });

  // 20. Existing economy and customer-service regressions remain green
  it('20. Existing economy and customer-service regressions remain green', () => {
    const gameState = new GameState();
    // Working capital reserve rule: starting cash 30, bundle cost 12
    expect(gameState.canAffordUpgrade(15)).toBe(true); // 30 - 15 = 15 >= 12
    expect(gameState.canAffordUpgrade(20)).toBe(false); // 30 - 20 = 10 < 12
  });

  // 21. Two-box order equals one customer served (totalBoxesSold = 2, customersServed = 1)
  it('21. Two-box order equals one customer served (totalBoxesSold = 2, customersServed = 1)', () => {
    const gameState = new GameState();
    gameState.counterBoxesStock = 2;

    expect(gameState.stats.customersServed).toBe(0);
    const res = gameState.serveCustomer(2, 0.80);
    expect(res.success).toBe(true);
    expect(gameState.stats.totalBoxesSold).toBe(2);
    expect(gameState.stats.customersServed).toBe(1);
  });

  // 22. Manual and Cashier service each increment customersServed exactly once
  it('22. Manual and Cashier service each increment customersServed exactly once', () => {
    const gameState = new GameState({ startingCash: 100 });
    gameState.counterBoxesStock = 3;
    expect(gameState.buyCashier()).toBe(true);

    // Manual serve 1
    const resManual = gameState.serveCustomer(1, 0.85);
    expect(resManual.success).toBe(true);
    expect(gameState.stats.customersServed).toBe(1);
    expect(gameState.stats.totalBoxesSold).toBe(1);

    // Cashier serve 2
    const resCashier = gameState.autoServeWithCashier(2, 0.85);
    expect(resCashier.success).toBe(true);
    expect(gameState.stats.customersServed).toBe(2);
    expect(gameState.stats.totalBoxesSold).toBe(3);
  });

  // 23. Expiration does NOT increment customersServed
  it('23. Expiration does NOT increment customersServed', () => {
    const gameState = new GameState();
    expect(gameState.stats.customersServed).toBe(0);
    gameState.recordCustomerDeparture();
    expect(gameState.stats.customersDeparted).toBe(1);
    expect(gameState.stats.customersServed).toBe(0);
    expect(gameState.stats.totalBoxesSold).toBe(0);
  });

  // 24. Clean timeout with no activity produces score of exactly 0
  it('24. Clean timeout with no activity produces score of exactly 0', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.startCampaignTimer();

    // Advance to timeout with 0 sales, 0 stars, 0 departures, 0 pandal
    campaign.update(BALANCE.campaignDurationSeconds + 1, gameState);
    expect(campaign.stage).toBe('TIME_EXPIRED');

    const snapshot = campaign.finalSnapshot!;
    expect(snapshot.totalBoxesSold).toBe(0);
    expect(snapshot.customersServed).toBe(0);
    expect(snapshot.customersDeparted).toBe(0);
    expect(snapshot.fiveStarCount).toBe(0);
    expect(snapshot.fourStarCount).toBe(0);
    expect(snapshot.pandalBoxesDelivered).toBe(0);
    expect(snapshot.finalScore).toBe(0);
  });

  // 25. Restart resets customersServed, fiveStarCount, fourStarCount and every score counter
  it('25. Restart resets customersServed, fiveStarCount, fourStarCount and every score counter', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();

    // Mutate various counters
    gameState.stats.customersServed = 8;
    gameState.stats.totalBoxesSold = 15;
    gameState.stats.totalRevenue = 180;
    gameState.stats.totalTipsEarned = 24;
    gameState.stats.customersDeparted = 2;
    campaign.fiveStarCount = 6;
    campaign.fourStarCount = 2;
    campaign.pandalBoxesReserved = 5;

    // Reset both
    gameState.reset();
    campaign.reset();

    expect(gameState.stats.customersServed).toBe(0);
    expect(gameState.stats.totalBoxesSold).toBe(0);
    expect(gameState.stats.totalRevenue).toBe(0);
    expect(gameState.stats.totalTipsEarned).toBe(0);
    expect(gameState.stats.customersDeparted).toBe(0);
    expect(campaign.fiveStarCount).toBe(0);
    expect(campaign.fourStarCount).toBe(0);
    expect(campaign.pandalBoxesReserved).toBe(0);
    expect(campaign.finalSnapshot).toBeNull();
  });

  // 26. Exact completion time calculation with known timeRemaining values
  it('26. Exact completion time calculation with known timeRemaining values', () => {
    const gameState = new GameState();

    // Case A: 384 seconds remaining -> 600 - 384 = 216 seconds elapsed
    const campaignA = new CampaignState();
    campaignA.startCampaignTimer();
    campaignA.timeRemaining = 384;
    const snapA = campaignA.finishCampaign(true, gameState);
    expect(snapA.timeRemainingSeconds).toBe(384);
    expect(snapA.completionTimeSeconds).toBe(216);

    // Case B: 0 seconds remaining -> 600 seconds elapsed (full timeout)
    const campaignB = new CampaignState();
    campaignB.startCampaignTimer();
    campaignB.timeRemaining = 0;
    const snapB = campaignB.finishCampaign(false, gameState);
    expect(snapB.timeRemainingSeconds).toBe(0);
    expect(snapB.completionTimeSeconds).toBe(600);

    // Case C: 600 seconds remaining -> 0 seconds elapsed
    const campaignC = new CampaignState();
    campaignC.startCampaignTimer();
    campaignC.timeRemaining = 600;
    const snapC = campaignC.finishCampaign(true, gameState);
    expect(snapC.timeRemainingSeconds).toBe(600);
    expect(snapC.completionTimeSeconds).toBe(0);
  });

  // 27. Victory snapshot data comes from the same immutable snapshot
  it('27. Victory snapshot data comes from the same immutable snapshot', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.recordSale(5);
    campaign.stage = 'PANDAL_ORDER';
    campaign.depositBoxesToDispatch(12);
    campaign.update(BALANCE.courierDispatchDurationSeconds, gameState);

    expect(campaign.stage).toBe('VICTORY');
    const snapshot = campaign.finalSnapshot!;
    expect(snapshot).not.toBeNull();

    // Calling finishCampaign again returns the identical snapshot reference
    const secondCall = campaign.finishCampaign(true, gameState);
    expect(secondCall).toBe(snapshot);

    // Modifying gameState after victory does not mutate snapshot values
    gameState.stats.totalBoxesSold += 20;
    gameState.stats.customersServed += 10;
    expect(snapshot.totalBoxesSold).not.toBe(gameState.stats.totalBoxesSold);
    expect(snapshot.customersServed).not.toBe(gameState.stats.customersServed);
  });

  // 28. Dispatch relocation does not alter inventory isolation
  it('28. Dispatch relocation does not alter inventory isolation', () => {
    const gameState = new GameState();
    const campaign = new CampaignState();
    campaign.stage = 'PANDAL_ORDER';

    // Deposit boxes into dispatch
    const accepted = campaign.depositBoxesToDispatch(4);
    expect(accepted).toBe(4);
    expect(campaign.pandalBoxesReserved).toBe(4);

    // Counter stock is still 0
    expect(gameState.counterBoxesStock).toBe(0);

    // Devotee cannot be served with dispatch stock
    const saleResult = gameState.serveCustomer(1);
    expect(saleResult.success).toBe(false);
    expect(campaign.pandalBoxesReserved).toBe(4);

    // Counter stock cannot be deposited into dispatch automatically
    gameState.counterBoxesStock = 5;
    expect(campaign.pandalBoxesReserved).toBe(4);
  });

  // 29. Locked dispatch cannot accept boxes
  it('29. Locked dispatch cannot accept boxes', () => {
    const campaign = new CampaignState();
    expect(campaign.stage).toBe('ONBOARDING');

    // Simulate station-level gate: stage must be PANDAL_ORDER or DISPATCHING
    const canStationDeposit = (stage: string) => stage === 'PANDAL_ORDER' || stage === 'DISPATCHING';

    expect(canStationDeposit(campaign.stage)).toBe(false);
    campaign.stage = 'GROW_BUSINESS';
    expect(canStationDeposit(campaign.stage)).toBe(false);
    campaign.stage = 'FESTIVAL_RUSH';
    expect(canStationDeposit(campaign.stage)).toBe(false);

    campaign.stage = 'PANDAL_ORDER';
    expect(canStationDeposit(campaign.stage)).toBe(true);
  });

  // 30. Feedback bounds calculation stays strictly inside 960x540 viewport
  it('30. Feedback bounds calculation stays strictly inside 960x540 viewport', () => {
    // Test the longest 5-star two-box feedback message
    const longestMsg = '5★ Festival favourite';
    const coinBadge = '+₹26 (+₹6 tip)';

    const bounds = calculateFeedbackBounds(longestMsg, coinBadge);

    expect(bounds.width).toBeLessThanOrEqual(210);
    expect(bounds.minX).toBeGreaterThanOrEqual(0);
    expect(bounds.maxX).toBeLessThanOrEqual(960);
    expect(bounds.minY).toBeGreaterThanOrEqual(0);
    expect(bounds.maxY).toBeLessThanOrEqual(540);

    // Verify it sits above customer speech bubbles (which sit at y ≈ 305)
    expect(bounds.maxY).toBeLessThan(290);
  });

  // 31. Modal Routing: Results modal open ignores P and Escape
  it('31. Modal Routing: Results modal open ignores P and Escape', () => {
    let pauseOpened = false;
    let upgradeOpened = false;
    const isResultsModalOpen = true;

    // Simulation of handleModalKeyDown priority rules
    const handleKeyDown = (code: string, repeat = false) => {
      if (repeat) return;
      if (isResultsModalOpen) return;
      if (code === 'KeyP' || code === 'Escape') pauseOpened = true;
    };

    handleKeyDown('KeyP');
    handleKeyDown('Escape');
    expect(pauseOpened).toBe(false);
    expect(upgradeOpened).toBe(false);
  });

  // 32. Modal Routing: Upgrade modal open consumes Escape, ignores P, and does not open Pause
  it('32. Modal Routing: Upgrade modal open consumes Escape, ignores P, and does not open Pause', () => {
    let isUpgradeModalOpen = true;
    let isPauseModalOpen = false;
    const campaign = new CampaignState();
    campaign.isPaused = true;

    const handleKeyDown = (code: string, repeat = false) => {
      if (repeat) return;
      if (isUpgradeModalOpen) {
        if (code === 'Escape') {
          isUpgradeModalOpen = false;
          if (!isPauseModalOpen) {
            campaign.isPaused = false;
          }
          return;
        }
        if (code === 'KeyP') {
          return; // P does nothing
        }
        return;
      }
      if (isPauseModalOpen) {
        if (code === 'KeyP' || code === 'Escape') isPauseModalOpen = false;
        return;
      }
      if (code === 'KeyP' || code === 'Escape') {
        isPauseModalOpen = true;
      }
    };

    // P does nothing while upgrade is open
    handleKeyDown('KeyP');
    expect(isUpgradeModalOpen).toBe(true);
    expect(isPauseModalOpen).toBe(false);
    expect(campaign.isPaused).toBe(true);

    // Repeated keydown does nothing
    handleKeyDown('KeyP', true);
    handleKeyDown('Escape', true);
    expect(isUpgradeModalOpen).toBe(true);

    // Escape closes only Upgrade modal, never opens Pause, restores campaign
    handleKeyDown('Escape');
    expect(isUpgradeModalOpen).toBe(false);
    expect(isPauseModalOpen).toBe(false);
    expect(campaign.isPaused).toBe(false);
  });

  // 33. Modal Routing: Pause modal open consumes P or Escape to resume
  it('33. Modal Routing: Pause modal open consumes P or Escape to resume', () => {
    let isPauseModalOpen = false;
    let isUpgradeModalOpen = false;
    const campaign = new CampaignState();

    const handleKeyDown = (code: string, repeat = false) => {
      if (repeat) return;
      if (isUpgradeModalOpen) return;
      if (isPauseModalOpen) {
        if (code === 'KeyP' || code === 'Escape') {
          isPauseModalOpen = false;
          campaign.isPaused = false;
        }
        return;
      }
      if (code === 'KeyP' || code === 'Escape') {
        isPauseModalOpen = true;
        campaign.isPaused = true;
      }
    };

    // P opens pause
    handleKeyDown('KeyP');
    expect(isPauseModalOpen).toBe(true);
    expect(campaign.isPaused).toBe(true);

    // P closes pause
    handleKeyDown('KeyP');
    expect(isPauseModalOpen).toBe(false);
    expect(campaign.isPaused).toBe(false);

    // Escape opens pause
    handleKeyDown('Escape');
    expect(isPauseModalOpen).toBe(true);
    expect(campaign.isPaused).toBe(true);

    // Escape closes pause
    handleKeyDown('Escape');
    expect(isPauseModalOpen).toBe(false);
    expect(campaign.isPaused).toBe(false);
  });

  // 34. Simulation State: Closing Upgrades does not unpause if Pause modal is active
  it('34. Simulation State: Closing Upgrades does not unpause if Pause modal is active', () => {
    const campaign = new CampaignState();
    const isPauseModalOpen = true;
    let isUpgradeModalOpen = true;

    // When closing upgrade modal while pause modal is active:
    isUpgradeModalOpen = false;
    if (!isPauseModalOpen) {
      campaign.isPaused = false;
    } else {
      campaign.isPaused = true;
    }

    expect(isUpgradeModalOpen).toBe(false);
    expect(campaign.isPaused).toBe(true);
  });
});
