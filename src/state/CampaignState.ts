import { BALANCE, GameBalanceConfig } from '../config/balance.ts';
import { CampaignStage, CampaignStatsSnapshot } from '../types/index.ts';
import { GameState } from './GameState.ts';

export class CampaignState {
  public config: GameBalanceConfig;
  public stage: CampaignStage = 'ONBOARDING';
  public timeRemaining: number;
  public isTimerRunning = false;
  public isPaused = false;
  public isContinueGrowing = false;

  public announcement: { text: string; timer: number } | null = null;

  public rushState = {
    hasTriggered: false,
    isAnnouncing: false,
    announceTimer: 0,
    isActive: false,
    timer: 0
  };

  public pandalBoxesReserved = 0;
  public isCourierDispatching = false;
  public courierDispatchTimer = 0;

  public fiveStarCount = 0;
  public fourStarCount = 0;

  public finalSnapshot: CampaignStatsSnapshot | null = null;

  private listeners: Array<() => void> = [];

  constructor(customConfig?: Partial<GameBalanceConfig>) {
    this.config = { ...BALANCE, ...customConfig };
    this.timeRemaining = this.config.campaignDurationSeconds;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setAnnouncement(text: string, durationSeconds = 4) {
    this.announcement = { text, timer: durationSeconds };
    this.notify();
  }

  public getUpgradeCount(gameState: GameState): number {
    let count = 0;
    if (gameState.upgrades.hasCarryUpgrade) count++;
    if (gameState.upgrades.hasPacker) count++;
    if (gameState.upgrades.hasCashier) count++;
    if (gameState.upgrades.hasSecondSteamer) count++;
    return count;
  }

  /**
   * Called on the first successful customer sale. Starts round timer exactly once.
   */
  public startCampaignTimer(): boolean {
    if (this.isTimerRunning || this.stage !== 'ONBOARDING') return false;

    this.isTimerRunning = true;
    this.stage = 'FESTIVAL_OPEN';
    this.setAnnouncement('The festival is open! Grow the Mahal before closing.', 5);
    this.notify();
    return true;
  }

  /**
   * Called whenever a sale is completed to track stars and start timer on 1st sale.
   */
  public recordSale(stars?: number) {
    if (stars === 5) this.fiveStarCount++;
    else if (stars === 4) this.fourStarCount++;

    if (!this.isTimerRunning && this.stage === 'ONBOARDING') {
      this.startCampaignTimer();
    }
    this.notify();
  }

  /**
   * Called when any upgrade is bought.
   */
  public onUpgradePurchased(gameState: GameState) {
    // Check if first staff member hired to trigger rush
    if (
      !this.rushState.hasTriggered &&
      (gameState.upgrades.hasPacker || gameState.upgrades.hasCashier)
    ) {
      this.triggerRush();
    }

    // Check if all 4 upgrades owned
    if (
      this.getUpgradeCount(gameState) === 4 &&
      this.stage !== 'PANDAL_ORDER' &&
      this.stage !== 'DISPATCHING' &&
      this.stage !== 'VICTORY' &&
      this.stage !== 'TIME_EXPIRED'
    ) {
      this.stage = 'PANDAL_ORDER';
      this.setAnnouncement('All upgrades owned! Grand Pandal Order is now OPEN!', 5);
    } else if (
      this.stage === 'FESTIVAL_OPEN' &&
      this.getUpgradeCount(gameState) > 0
    ) {
      this.stage = 'GROW_BUSINESS';
    }

    this.notify();
  }

  /**
   * Triggers the single 75s Festival Rush with an advance announcement.
   */
  public triggerRush(): boolean {
    if (this.rushState.hasTriggered) return false;

    this.rushState.hasTriggered = true;
    this.rushState.isAnnouncing = true;
    this.rushState.announceTimer = this.config.rushAnnouncementSeconds;
    this.setAnnouncement('Festival Rush incoming! Hungry devotees arriving!', this.config.rushAnnouncementSeconds);
    this.notify();
    return true;
  }

  /**
   * Deposit packed boxes into the Pandal dispatch stand (up to 12).
   */
  public depositBoxesToDispatch(count: number): number {
    if (this.stage === 'VICTORY' || this.stage === 'TIME_EXPIRED') return 0;
    if (this.pandalBoxesReserved >= this.config.pandalOrderTargetBoxes) return 0;
    if (count <= 0) return 0;

    const needed = this.config.pandalOrderTargetBoxes - this.pandalBoxesReserved;
    const accepted = Math.min(count, needed);
    this.pandalBoxesReserved += accepted;

    if (this.pandalBoxesReserved >= this.config.pandalOrderTargetBoxes && !this.isCourierDispatching) {
      this.isCourierDispatching = true;
      this.courierDispatchTimer = 0;
      this.stage = 'DISPATCHING';
      this.setAnnouncement('Grand Pandal Order full! Courier is dispatching!', 4);
    }

    this.notify();
    return accepted;
  }

  /**
   * Update campaign delta, timer, announcements, rush, and courier dispatch.
   */
  public update(dt: number, gameState: GameState) {
    if (this.isPaused) return;

    // 1. Announcements timer
    if (this.announcement) {
      this.announcement.timer -= dt;
      if (this.announcement.timer <= 0) {
        this.announcement = null;
        this.notify();
      }
    }

    // 2. Campaign Round Clock (freezes if victory/timeout or continue growing)
    if (this.isTimerRunning && !this.isContinueGrowing && !this.finalSnapshot) {
      this.timeRemaining = Math.max(0, this.timeRemaining - dt);
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.finishCampaign(false, gameState);
        return;
      }
    }

    // 3. Rush transition logic
    if (this.rushState.isAnnouncing) {
      this.rushState.announceTimer -= dt;
      if (this.rushState.announceTimer <= 0) {
        this.rushState.isAnnouncing = false;
        this.rushState.isActive = true;
        this.rushState.timer = this.config.rushDurationSeconds;
        this.setAnnouncement('Festival Rush is ON! Devotees are flooding in!', 4);
        if (this.stage !== 'PANDAL_ORDER' && this.stage !== 'DISPATCHING') {
          this.stage = 'FESTIVAL_RUSH';
        }
        this.notify();
      }
    } else if (this.rushState.isActive) {
      this.rushState.timer -= dt;
      if (this.rushState.timer <= 0) {
        this.rushState.isActive = false;
        this.setAnnouncement('Festival Rush completed! Wonderful service!', 4);
        if (this.stage === 'FESTIVAL_RUSH') {
          this.stage = this.getUpgradeCount(gameState) === 4 ? 'PANDAL_ORDER' : 'GROW_BUSINESS';
        }
        this.notify();
      }
    }

    // 4. Progression to GROW_BUSINESS from FESTIVAL_OPEN
    if (this.stage === 'FESTIVAL_OPEN' && !this.announcement) {
      this.stage = 'GROW_BUSINESS';
      this.notify();
    }

    // 5. Courier Dispatch progress (10 seconds)
    if (this.isCourierDispatching && !this.finalSnapshot) {
      this.courierDispatchTimer += dt;
      if (this.courierDispatchTimer >= this.config.courierDispatchDurationSeconds) {
        this.isCourierDispatching = false;
        this.finishCampaign(true, gameState);
        return;
      }
    }
  }

  /**
   * Deterministic score calculation clamped to minimum zero.
   */
  public calculateScore(gameState: GameState, timeRemaining: number, isVictory: boolean): number {
    let score =
      gameState.stats.totalBoxesSold * this.config.scorePerBoxSold +
      this.fiveStarCount * this.config.scorePer5Star +
      this.fourStarCount * this.config.scorePer4Star -
      (gameState.stats.customersDeparted || 0) * this.config.scorePenaltyPerDeparted;

    if (isVictory) {
      score += this.config.scorePandalCompletionBonus;
      score += Math.floor(Math.max(0, timeRemaining)) * this.config.scorePerSecondRemaining;
    }
    return Math.max(0, score);
  }

  public getAwardTitle(rating: number): string {
    if (rating >= 4.6) return 'Festival Favourite';
    if (rating >= 4.0) return 'Beloved Modak Mahal';
    if (rating >= 3.0) return 'Successful Festival Service';
    return 'Festival Completed — Keep Improving';
  }

  public getTimeoutTitle(): string {
    return 'Festival Attempt Ended';
  }

  /**
   * Transition to VICTORY or TIME_EXPIRED, creating an immutable stats snapshot.
   */
  public finishCampaign(isVictory: boolean, gameState: GameState): CampaignStatsSnapshot {
    if (this.finalSnapshot) return this.finalSnapshot;

    this.stage = isVictory ? 'VICTORY' : 'TIME_EXPIRED';
    this.isTimerRunning = false;

    const timeRemaining = Math.max(0, this.timeRemaining);
    const completionTime = this.config.campaignDurationSeconds - timeRemaining;
    const finalRating = gameState.businessRating;
    const finalScore = this.calculateScore(gameState, timeRemaining, isVictory);
    const awardTitle = isVictory
      ? this.getAwardTitle(finalRating)
      : this.getTimeoutTitle();

    this.finalSnapshot = {
      completionTimeSeconds: Math.round(completionTime),
      timeRemainingSeconds: Math.round(timeRemaining),
      totalBoxesSold: gameState.stats.totalBoxesSold,
      customersServed: gameState.stats.customersServed,
      customersDeparted: gameState.stats.customersDeparted || 0,
      totalTipsEarned: gameState.stats.totalTipsEarned || 0,
      finalRating,
      upgradesPurchased: this.getUpgradeCount(gameState),
      finalScore,
      awardTitle,
      pandalBoxesDelivered: this.pandalBoxesReserved,
      isVictory,
      fiveStarCount: this.fiveStarCount,
      fourStarCount: this.fourStarCount
    };

    this.notify();
    return this.finalSnapshot;
  }

  public continueGrowing() {
    this.isContinueGrowing = true;
    this.isTimerRunning = false;
    this.notify();
  }

  /**
   * Complete reset for clean Restart Festival.
   */
  public reset() {
    this.stage = 'ONBOARDING';
    this.timeRemaining = this.config.campaignDurationSeconds;
    this.isTimerRunning = false;
    this.isPaused = false;
    this.isContinueGrowing = false;
    this.announcement = null;
    this.rushState = {
      hasTriggered: false,
      isAnnouncing: false,
      announceTimer: 0,
      isActive: false,
      timer: 0
    };
    this.pandalBoxesReserved = 0;
    this.isCourierDispatching = false;
    this.courierDispatchTimer = 0;
    this.fiveStarCount = 0;
    this.fourStarCount = 0;
    this.finalSnapshot = null;
    this.notify();
  }
}
