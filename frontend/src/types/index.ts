export interface User {
  id: number;
  email: string;
  role: UserRole;
  organisatie_id?: number;
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface Opvangvorm {
  id?: number;
  naam: string;
  omschrijving?: string;
  organisatie_id: number;
  actief?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TariefType = 'uur' | 'dag' | 'vast_maand' | 'dagen_week' | 'vrij_uren_week' | 'vrij_uren_maand';

export interface DagenWeekConfiguratie {
  dagen: string[]; // ['ma', 'di', 'wo', 'do', 'vr']
  uurtarief: number;
  uren_per_dag?: { [dag: string]: number }; // Optioneel: specifieke uren per dag
}

export interface VrijUrenConfiguratie {
  max_uren: number;
  uurtarief: number;
}

export type TariefConfiguratie = DagenWeekConfiguratie | VrijUrenConfiguratie;

export interface Tarief {
  id?: number;
  naam: string;
  type: TariefType;
  tarief: number;
  omschrijving?: string;
  opvangvorm_id: number;
  organisatie_id: number;
  configuratie?: TariefConfiguratie;
  actief?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  organisatie?: Organisatie;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  organisatie: Organisatie | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isImpersonating?: boolean;
  originalUser?: User | null;
  stopImpersonation?: () => void;
} 