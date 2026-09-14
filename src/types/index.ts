export type ItemType = 'bundle' | 'batch' | 'box';

export interface CarriedGoods {
  type: ItemType | null;
  count: number;
}

export type SteamerState = 'idle' | 'steaming' | 'ready';

export interface SteamerSlot {
  id: number;
  unlocked: boolean;
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
}

export type ObjectiveKey =
  | 'BUY_INGREDIENT'
  | 'LOAD_STEAMER'
  | 'WAIT_STEAM'
  | 'COLLECT_MODAKS'
  | 'PACK_BOXES'
  | 'COLLECT_BOXES'
  | 'SERVE_CUSTOMER'
  | 'EARN_MORE';
