import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, Order } from '../types';
import { api } from '../services/api';

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoggedIn: boolean;
  customerOrders: Order[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  authNotice: string | null;
  setAuthNotice: (notice: string | null) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; notFound?: boolean }>;
  register: (data: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<Customer>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshOrders: () => Promise<void>;
  requireAuthToOrder: () => boolean; // Returns true if already logged in, otherwise opens modal and returns false
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => api.getCurrentCustomer());
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const refreshOrders = async () => {
    if (!customer) {
      setCustomerOrders([]);
      return;
    }
    try {
      const list = await api.getCustomerOrders(customer.id, customer.phone, customer.email);
      setCustomerOrders(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (customer) {
      refreshOrders();
    } else {
      setCustomerOrders([]);
    }
  }, [customer?.id]);

  const login = async (identifier: string, password: string) => {
    const res = await api.loginCustomer(identifier, password);
    if (res.success && res.customer) {
      setCustomer(res.customer);
      if (res.orders) {
        setCustomerOrders(res.orders);
      } else {
        refreshOrders();
      }
      setIsAuthModalOpen(false);
      setAuthNotice(null);
      return { success: true };
    }
    return { success: false, notFound: res.notFound, error: res.error };
  };

  const register = async (data: {
    fullName: string;
    phone?: string;
    email?: string;
    address?: string;
    district?: string;
    password: string;
    securityQuestion: string;
    securityAnswer: string;
  }) => {
    const res = await api.registerCustomer(data);
    if (res.success && res.customer) {
      setCustomer(res.customer);
      setCustomerOrders(res.orders || []);
      setIsAuthModalOpen(false);
      setAuthNotice(null);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const updateProfile = async (data: Partial<Customer>) => {
    if (!customer) return { success: false, error: 'Non connecté' };
    const res = await api.updateCustomerProfile(customer.id, data);
    if (res.success && res.customer) {
      setCustomer(res.customer);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = () => {
    api.setCurrentCustomer(null);
    setCustomer(null);
    setCustomerOrders([]);
    setIsProfileOpen(false);
  };

  const requireAuthToOrder = (): boolean => {
    if (customer) {
      return true;
    }
    setAuthNotice('Veuillez vous connecter ou créer votre profil pour valider votre commande. Juste votre numéro de téléphone ou votre adresse email !');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    return false;
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isLoggedIn: !!customer,
        customerOrders,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        authNotice,
        setAuthNotice,
        isProfileOpen,
        setIsProfileOpen,
        login,
        register,
        updateProfile,
        logout,
        refreshOrders,
        requireAuthToOrder,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = (): CustomerAuthContextType => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return ctx;
};
