import axios from 'axios';
import { LoginRequest, LoginResponse, ApiResponse, Opvangvorm, Tarief } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5007/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and impersonation header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add impersonation header if active
    const impersonationData = localStorage.getItem('superuser_impersonation');
    if (impersonationData) {
      try {
        const { impersonatingOrganisatie } = JSON.parse(impersonationData);
        config.headers['X-Impersonate-Organisation'] = impersonatingOrganisatie.id.toString();
      } catch (error) {
        console.error('Error parsing impersonation data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials);
    return response.data.data!;
  },

  me: async (): Promise<{ user: any; organisatie: any }> => {
    const response = await api.get<ApiResponse<{ user: any; organisatie: any }>>('/api/auth/me');
    return response.data.data!;
  },
};

export const opvangvormenAPI = {
  getAll: async (): Promise<Opvangvorm[]> => {
    const response = await api.get<ApiResponse<Opvangvorm[]>>('/api/opvangvormen/beheer');
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Opvangvorm> => {
    const response = await api.get<Opvangvorm>(`/api/opvangvormen/beheer/${id}`);
    return response.data;
  },

  create: async (opvangvorm: Omit<Opvangvorm, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>): Promise<Opvangvorm> => {
    const response = await api.post<Opvangvorm>('/api/opvangvormen', opvangvorm);
    return response.data;
  },

  update: async (id: number, opvangvorm: Partial<Omit<Opvangvorm, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>>): Promise<Opvangvorm> => {
    const response = await api.put<Opvangvorm>(`/api/opvangvormen/${id}`, opvangvorm);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/opvangvormen/${id}`);
  },
};

export const tarievenAPI = {
  getAll: async (): Promise<Tarief[]> => {
    const response = await api.get<ApiResponse<Tarief[]>>('/api/tarieven/beheer');
    return response.data.data || [];
  },

  getByOpvangvorm: async (opvangvormId: number): Promise<Tarief[]> => {
    const response = await api.get<ApiResponse<Tarief[]>>(`/api/tarieven/beheer/opvangvorm/${opvangvormId}`);
    return response.data.data || [];
  },

  getById: async (id: number): Promise<Tarief> => {
    const response = await api.get<Tarief>(`/api/tarieven/beheer/${id}`);
    return response.data;
  },

  create: async (tarief: Omit<Tarief, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>): Promise<Tarief> => {
    const response = await api.post<Tarief>('/api/tarieven', tarief);
    return response.data;
  },

  update: async (id: number, tarief: Partial<Omit<Tarief, 'id' | 'organisatie_id' | 'created_at' | 'updated_at'>>): Promise<Tarief> => {
    const response = await api.put<Tarief>(`/api/tarieven/${id}`, tarief);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/tarieven/${id}`);
  },
};

export default api; 