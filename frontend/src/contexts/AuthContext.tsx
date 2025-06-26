import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Organisatie, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organisatie, setOrganisatie] = useState<Organisatie | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<User | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const data = await authAPI.me();
          
          // Check voor superuser impersonation
          const impersonationData = localStorage.getItem('superuser_impersonation');
          if (impersonationData && data.user.role === 'superuser') {
            const { originalRole, impersonatingOrganisatie } = JSON.parse(impersonationData);
            
            // Zet impersonation state
            setIsImpersonating(true);
            setOriginalUser(data.user);
            setUser({ ...data.user, role: 'organisatie_beheerder', organisatieId: impersonatingOrganisatie.id });
            setOrganisatie(impersonatingOrganisatie);
          } else {
            setUser(data.user);
            setOrganisatie(data.organisatie);
            setIsImpersonating(false);
            setOriginalUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData, organisatie: orgData } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setOrganisatie(orgData || null);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('superuser_impersonation');
    setToken(null);
    setUser(null);
    setOrganisatie(null);
    setIsImpersonating(false);
    setOriginalUser(null);
  };

  const stopImpersonation = () => {
    localStorage.removeItem('superuser_impersonation');
    if (originalUser) {
      setUser(originalUser);
      setOrganisatie(null);
      setIsImpersonating(false);
      setOriginalUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    organisatie,
    token,
    login,
    logout,
    loading,
    isImpersonating,
    originalUser,
    stopImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 