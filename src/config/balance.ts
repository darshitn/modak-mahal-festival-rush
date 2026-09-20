export interface GameBalanceConfig {
  startingCash: number;
  startingBundles: number;
  bundleCost: number;
  boxesPerBatch: number;
  boxSalePrice: number;
  steamTimeSeconds: number;
  steamerInputCapacity: number;
  packingTimeSeconds: number;
  packingOutputCapacityBoxes: number;
  initialCarryCapacity: {
    bundles: number;
    batches: number;
    boxes: number;
  };
  carryUpgradeCapacity: {
    bundles: number;
    batches: number;
    boxes: number;
  };
  carryUpgradeCost: number;
  packerCost: number;
  cashierCost: number;
  secondSteamerCost: number;
  minWorkingCapitalReserve: number;
  customerSpawnIntervalSeconds: number;
  maxCustomerQueue: number;
  customerPatienceSeconds: number;
  // Customer patience, tip, and rating balance
  patience1BoxSeconds: number;
  patience2BoxSeconds: number;
  patienceTutorialSeconds: number;
  initialBusinessRating: number;
  ratingWeightOld: number;
  ratingWeightNew: number;
  minBusinessRating: number;
  maxBusinessRating: number;
  tipTier5StarPatienceThreshold: number;
  tipTier5StarAmountPerBox: number;
  tipTier4StarPatienceThreshold: number;
  tipTier4StarAmountPerBox: number;
  tipTier3StarPatienceThreshold: number;
  tipTier3StarAmountPerBox: number;
  tipTier2StarPatienceThreshold: number;
  tipTier2StarAmountPerBox: number;
  // Campaign & Festival Day settings
  campaignDurationSeconds: number;
  rushDurationSeconds: number;
  rushAnnouncementSeconds: number;
  rushSpawnIntervalMultiplier: number;
  pandalOrderTargetBoxes: number;
  courierDispatchDurationSeconds: number;
  // Score formula constants
  scorePerBoxSold: number;
  scorePer5Star: number;
  scorePer4Star: number;
  scorePenaltyPerDeparted: number;
  scorePandalCompletionBonus: number;
  scorePerSecondRemaining: number;
}

export const BALANCE: GameBalanceConfig = {
  startingCash: 30,
  startingBundles: 2,
  bundleCost: 12,
  boxesPerBatch: 3,
  boxSalePrice: 10,
  steamTimeSeconds: 8,
  steamerInputCapacity: 2,
  packingTimeSeconds: 3,
  packingOutputCapacityBoxes: 6,
  initialCarryCapacity: {
    bundles: 1,
    batches: 1,
    boxes: 3
  },
  carryUpgradeCapacity: {
    bundles: 2,
    batches: 2,
    boxes: 6
  },
  carryUpgradeCost: 30,
  packerCost: 45,
  cashierCost: 60,
  secondSteamerCost: 90,
  minWorkingCapitalReserve: 12,
  customerSpawnIntervalSeconds: 6,
  maxCustomerQueue: 4,
  customerPatienceSeconds: 35,
  patience1BoxSeconds: 50,
  patience2BoxSeconds: 65,
  patienceTutorialSeconds: 75,
  initialBusinessRating: 4.0,
  ratingWeightOld: 0.75,
  ratingWeightNew: 0.25,
  minBusinessRating: 1.0,
  maxBusinessRating: 5.0,
  tipTier5StarPatienceThreshold: 0.70,
  tipTier5StarAmountPerBox: 3,
  tipTier4StarPatienceThreshold: 0.40,
  tipTier4StarAmountPerBox: 1,
  tipTier3StarPatienceThreshold: 0.15,
  tipTier3StarAmountPerBox: 0,
  tipTier2StarPatienceThreshold: 0.0001,
  tipTier2StarAmountPerBox: 0,
  campaignDurationSeconds: 600,
  rushDurationSeconds: 75,
  rushAnnouncementSeconds: 4,
  rushSpawnIntervalMultiplier: 0.65,
  pandalOrderTargetBoxes: 12,
  courierDispatchDurationSeconds: 10,
  scorePerBoxSold: 100,
  scorePer5Star: 50,
  scorePer4Star: 20,
  scorePenaltyPerDeparted: 100,
  scorePandalCompletionBonus: 1500,
  scorePerSecondRemaining: 10
};
