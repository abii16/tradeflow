export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface LoadItem {
  id: string;
  title: string;
  origin: string;
  destination: string;
  weightKg: number;
  priceEstimate: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_TRANSIT' | 'DELIVERED';
}
