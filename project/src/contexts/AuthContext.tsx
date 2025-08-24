import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, type User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token and validate with backend
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid or expired
          api.clearToken();
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('API object:', api);
      console.log('signIn method exists:', typeof api.signIn);
      
      if (!api.signIn) {
        throw new Error('signIn method not found on api object');
      }
      
      const response = await api.signIn(email, password);
      setUser(response.user);
    } catch (error) {
      console.error('SignIn error:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Sign in failed. Please check your credentials.');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    try {
      await api.signUp(email, password, fullName, role);
      throw new Error('Registration successful! Your account is pending admin approval. You will be notified once approved.');
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
    } catch (error) {
      // Even if the API call fails, clear local state
      console.error('Logout API call failed:', error);
    } finally {
      api.clearToken();
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}