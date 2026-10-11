export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
  isVerified?: boolean;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
  companyName?: string | null;
  tinNumber?: string | null;
  tradeLicense?: string | null;
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
