/**
 * SMRITI+ — Auth State Store (Zustand)
 *
 * Manages authentication state, user profile, and role-based access.
 * Identity always from JWT token — never trust client-supplied values.
 */

import { create } from 'zustand';
import { api } from '../services/api';

export type UserRole = 'elderly' | 'caregiver' | 'health_worker';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  language: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  loginWithCode: (link_code: string) => Promise<void>;
  signup: (data: {
    name: string;
    role: UserRole;
    email?: string;
    phone?: string;
    password: string;
    language?: string;
    patient_link_code?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        access_token: string;
        user: User;
      }>('/auth/login', { email, password });

      await api.setToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  loginWithOtp: async (phone: string, otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        access_token: string;
        user: User;
      }>('/auth/login', { phone, otp });

      await api.setToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  loginWithCode: async (link_code: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        access_token: string;
        user: User;
      }>('/auth/login', { link_code: link_code.trim().toUpperCase() });

      await api.setToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Connecting via code failed', isLoading: false });
      throw err;
    }
  },

  signup: async (data: {
    name: string;
    role: UserRole;
    email?: string;
    phone?: string;
    password: string;
    language?: string;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<{
        access_token: string;
        user: User;
      }>('/auth/signup', data);

      await api.setToken(response.access_token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await api.clearToken();
    set({ user: null, isAuthenticated: false, error: null });
  },

  setUser: (user: User) => set({ user, isAuthenticated: true }),

  clearError: () => set({ error: null }),
}));
