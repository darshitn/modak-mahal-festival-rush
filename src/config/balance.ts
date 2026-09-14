export interface GameBalanceConfig {
  startingCash: number;
  startingBundles: number;
  bundleCost: number;
  boxesPerBatch: number;
  boxSalePrice: number;
  steamTimeSeconds: number;
  packingTimeSeconds: number;
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
}

export const BALANCE: GameBalanceConfig = {
  startingCash: 30,
  startingBundles: 2,
  bundleCost: 12,
  boxesPerBatch: 3,
  boxSalePrice: 10,
  steamTimeSeconds: 8,
  packingTimeSeconds: 3,
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
  customerPatienceSeconds: 35
};
