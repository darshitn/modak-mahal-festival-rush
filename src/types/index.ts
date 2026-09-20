export type ItemType = 'bundle' | 'batch' | 'box';

export interface CarriedGoods {
  type: ItemType | null;
  count: number;
}

export type SteamerState = 'idle' | 'steaming' | 'ready';

export interface SteamerSlot {
  id: number;
  unlocked: boolean;
  /** Bundles waiting on the steamer's visible input shelf. */
  inputBundles: number;
  state: SteamerState;
  progress: number; // 0 to 1
  timer: number; // elapsed in seconds
  hasOutput: boolean;
}

export interface PackingTableState {
  inputBatches: number;
  isPacking: boolean;
  progress: number; // 0 to 1
  timer: number;
  outputBoxes: number;
}

export interface CustomerOrder {
  id: string;
  requestedBoxes: number;
  patienceRemaining: number;
  maxPatience: number;
  state: 'walking_in' | 'waiting' | 'served' | 'leaving';
}

export interface GameStats {
  totalBoxesSold: number;
  totalRevenue: number;
  batchesCooked: number;
  pandalDelivered: number;
  totalTipsEarned?: number;
  customersDeparted?: number;
  /** Number of completed customer orders (never counted per box or for expired customers). */
  customersServed: number;
}


export interface CustomerSaleResult {
  success: boolean;
  basePayment?: number;
  tipEarned?: number;
  coinsEarned: number;
  stars?: number;
  feedbackText?: string;
}

export type ObjectiveKey =
  | 'BUY_INGREDIENT'
  | 'LOAD_STEAMER'
  | 'WAIT_STEAM'
  | 'COLLECT_MODAKS'
  | 'PACK_BOXES'
  | 'COLLECT_BOXES'
  | 'SERVE_CUSTOMER'
  | 'EARN_MORE'
  | 'UPGRADE_MAHAL'
  | 'FESTIVAL_RUSH'
  | 'PANDAL_ORDER'
  | 'DISPATCHING';

export type CampaignStage =
  | 'ONBOARDING'
  | 'FESTIVAL_OPEN'
  | 'GROW_BUSINESS'
  | 'FESTIVAL_RUSH'
  | 'PANDAL_ORDER'
  | 'DISPATCHING'
  | 'VICTORY'
  | 'TIME_EXPIRED';

export interface CampaignStatsSnapshot {
  completionTimeSeconds: number;
  timeRemainingSeconds: number;
  totalBoxesSold: number;
  customersServed: number;
  customersDeparted: number;
  totalTipsEarned: number;
  finalRating: number;
  upgradesPurchased: number;
  finalScore: number;
  awardTitle: string;
  pandalBoxesDelivered: number;
  isVictory: boolean;
  fiveStarCount: number;
  fourStarCount: number;
}
