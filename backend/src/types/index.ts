export interface User {
  id: number;
  email: string;
  password: string;
  role: UserRole;
  organisatie_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

export enum UserRole {
  ORGANISATIE_BEHEERDER = 'organisatie_beheerder',
  SUPERUSER = 'superuser'
}

export interface Organisatie {
  id: number;
  naam: string;
  email?: string;
  telefoon?: string;
  adres?: string;
  postcode?: string;
  plaats?: string;
  website?: string;
  actief: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserWithoutPassword;
  organisatie?: Organisatie;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  organisatieId?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 