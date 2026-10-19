// TradeFlow Mobile — Type Definitions (Transporter & Driver Actors)

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

export type ActionType =
  | 'SUBMIT_BID'
  | 'ACCEPT_LOAD'
  | 'WAYPOINT_CHECKIN'
  | 'REPORT_INCIDENT'
  | 'PROOF_OF_DELIVERY';

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

export interface Waypoint {
  id: string;
  name: string;
  corridorLeg: string;
  kmFromOrigin: number;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  lat: number;
  lng: number;
}

export interface IncidentReportPayload {
  tripId: string;
  type: string;
  location: string;
  notes: string;
  timestamp: string;
}

export interface PodPayload {
  tripId: string;
  receiverName: string;
  waybillNumber: string;
  signatureDate: string;
}
