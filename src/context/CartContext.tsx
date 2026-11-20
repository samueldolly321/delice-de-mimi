import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFreeDeliveryBySubtotal } from '../utils/delivery';
import { Product, CartItem, Order, RestaurantSettings, SoupTopping } from '../types';
import { INITIAL_SETTINGS } from '../data/seedData';
import { api } from '../services/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedToppings?: SoupTopping[],
    customUnitPrice?: number,
    customNotes?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  /** Livraison offerte (seuil de commande atteint). */
  isFreeDelivery: boolean;
  /** Frais de livraison minimum (« à partir de »). */
  minDeliveryFee: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  activeOrderConfirmation: Order | null;
  setActiveOrderConfirmation: (order: Order | null) => void;
  deliveryType: 'delivery' | 'takeaway';
  setDeliveryType: (type: 'delivery' | 'takeaway') => void;
  settings: RestaurantSettings;
  refreshSettings: () => Promise<void>;
  formatPrice: (val: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'saveurs_dasie_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      // Ensure compatibility with previous cart format
      return parsed.map((item: any) => ({
        ...item,
        id: item.id || (item.selectedToppings?.length ? `${item.product.id}-${item.selectedToppings.map((t: any) => t.id).sort().join('_')}` : item.product.id),
        unitPrice: item.unitPrice ?? item.product.price,
      }));
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderConfirmation, setActiveOrderConfirmation] = useState<Order | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'takeaway'>('delivery');
  const [settings, setSettings] = useState<RestaurantSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const refreshSettings = async () => {
    try {
      const s = await api.getSettings();
      setSettings(s);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedToppings?: SoupTopping[],
    customUnitPrice?: number,
    customNotes?: string
  ) => {
    const toppingKey = selectedToppings && selectedToppings.length > 0
      ? selectedToppings.map((t) => t.id).sort().join('_')
      : '';
    const cartItemId = toppingKey ? `${product.id}-${toppingKey}` : product.id;

    const toppingsSum = selectedToppings ? selectedToppings.reduce((sum, t) => sum + t.price, 0) : 0;
    const unitPrice = customUnitPrice !== undefined ? customUnitPrice : product.price + toppingsSum;

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === cartItemId);
      if (existingIndex !== -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          product,
          quantity,
          selectedToppings: selectedToppings || [],
          unitPrice,
          customNotes,
        },
      ];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== cartItemId && item.product.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId || item.product.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice !== undefined ? item.unitPrice : item.product.price) * item.quantity,
    0
  );

  // Les frais de livraison exacts dépendent du lieu et sont fixés par l'équipe
  // après la commande (« à partir de » settings.deliveryFee) : ils ne sont donc
  // pas inclus dans le total affiché au client.
  const deliveryFee = 0;
  const isFreeDelivery = deliveryType === 'delivery' && isFreeDeliveryBySubtotal(subtotal, settings);
  const minDeliveryFee = settings.deliveryFee;

  const total = subtotal;

  const formatPrice = (val: number): string => {
    return `${val.toLocaleString('fr-FR')} ${settings.currency || 'Ar'}`;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        isFreeDelivery,
        minDeliveryFee,
        total,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        activeOrderConfirmation,
        setActiveOrderConfirmation,
        deliveryType,
        setDeliveryType,
        settings,
        refreshSettings,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
