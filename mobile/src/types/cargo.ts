// TradeFlow Mobile — Type Definitions

export type CargoStatus = 'open' | 'bid_placed' | 'in_transit' | 'delivered';

export type CargoType =
  | 'Structural Steel'
  | 'Coffee Beans'
  | 'Textile Goods'
  | 'Construction Material'
  | 'Agricultural Products'
  | 'Electronics'
  | 'Machinery Parts'
  | 'Fertilizer'
  | 'General Freight';

export interface CargoLoad {
  id: string;
  title: string;
  cargoType: CargoType;
  origin: string;
  destination: string;
  distanceKm: number;
  weightTons: number;
  rateETB: number;
  pickupWindow: string;
  status: CargoStatus;
  urgency: 'normal' | 'urgent';
  postedAt: string; // ISO timestamp
}

export type ActionType = 'SUBMIT_BID' | 'ACCEPT_LOAD' | 'WAYPOINT_CHECKIN';
export type QueueStatus = 'pending' | 'synced' | 'failed';

export interface OfflineAction {
  id: number;
  actionType: ActionType;
  payload: string; // JSON string
  createdAt: string; // ISO timestamp
  status: QueueStatus;
  retryCount: number;
}

export interface BidPayload {
  cargoId: string;
  amountETB: number;
  licensePlate: string;
  estimatedArrival: string;
}
