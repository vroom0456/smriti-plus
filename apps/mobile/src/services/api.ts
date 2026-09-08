/**
 * SMRITI+ — API Configuration & Client
 *
 * Centralized API client for all backend communication.
 * All requests go through this client for consistent auth headers and error handling.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://smriti-plus-api.railway.app';

let inMemoryToken: string | null = null;

export const api = {
  baseUrl: API_BASE_URL,

  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem('auth_token');
        }
      } catch {
        // Ignore localStorage errors
      }
      return inMemoryToken;
    }

    try {
      return await SecureStore.getItemAsync('auth_token');
    } catch {
      return inMemoryToken;
    }
  },

  async setToken(token: string): Promise<void> {
    inMemoryToken = token;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('auth_token', token);
        }
      } catch {
        // Ignore localStorage errors
      }
      return;
    }

    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch {
      // Fallback to memory
    }
  },

  async clearToken(): Promise<void> {
    inMemoryToken = null;
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('auth_token');
        }
      } catch {
        // Ignore localStorage errors
      }
      return;
    }

    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch {
      // Fallback
    }
  },

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorBody.detail || `Request failed: ${response.status}`,
        errorBody,
      );
    }

    return response.json();
  },

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

export class ApiError extends Error {
  status: number;
  body: any;

  constructor(status: number, message: string, body: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
