// TradeFlow Mobile — Authentication & Actor Types

export type UserRole = 'TRANSPORTER' | 'DRIVER';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  token?: string;
  // Transporter specific
  companyName?: string;
  tinNumber?: string;
  fleetSize?: string;
  // Driver specific
  licensePlate?: string;
  driverLicense?: string;
}

export interface LoginCredentials {
  identifier: string; // Email or Phone
  password: string;
  role: UserRole;
}

export interface RegisterTransporterData {
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  tinNumber: string;
  fleetSize: string;
  password: string;
}

export interface RegisterDriverData {
  fullName: string;
  phone: string;
  licensePlate: string;
  driverLicense: string;
  password: string;
}
