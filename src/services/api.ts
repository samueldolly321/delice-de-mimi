import { Product, Category, Order, Customer, RestaurantSettings, OrderStatus, ContactMessage } from '../types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_ORDERS, INITIAL_CUSTOMERS, INITIAL_SETTINGS, INITIAL_MESSAGES } from '../data/seedData';

// Storage keys for offline / fallback persistence
const PRODUCTS_KEY = 'saveurs_dasie_products';
const CATEGORIES_KEY = 'saveurs_dasie_categories';
const ORDERS_KEY = 'saveurs_dasie_orders';
const SETTINGS_KEY = 'saveurs_dasie_settings';
const CUSTOMERS_KEY = 'saveurs_dasie_customers';
const MESSAGES_KEY = 'saveurs_dasie_messages';

// Helper to provide secure Authorization headers for admin calls
const getAdminHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('saveurs_admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Signale que la session admin n'est plus valide (jeton expiré ou serveur
 * redémarré). Sans ça, une requête admin qui échoue en 401/403 pouvait
 * passer inaperçue et afficher silencieusement une liste obsolète en cache
 * (ex : nouvelles commandes invisibles dans l'administration).
 */
const notifyAdminSessionExpired = () => {
  localStorage.removeItem('saveurs_admin_token');
  window.dispatchEvent(new CustomEvent('admin-session-expired'));
};

/** À utiliser sur toute requête admin authentifiée : détecte une session expirée. */
const checkAdminAuthResponse = (res: Response) => {
  if (res.status === 401 || res.status === 403) {
    notifyAdminSessionExpired();
    return false;
  }
  return true;
};

export const api = {
  // Products
  async getProducts(categoryId?: string, search?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId && categoryId !== 'cat-all' && categoryId !== 'all') params.append('category', categoryId);
      if (search) params.append('search', search);

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // Fallback
    }

    const cached = localStorage.getItem(PRODUCTS_KEY);
    let list: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;

    if (categoryId && categoryId !== 'cat-all' && categoryId !== 'all') {
      list = list.filter(p => p.categoryId === categoryId || p.categoryName.toLowerCase() === categoryId.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return list;
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(product),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(PRODUCTS_KEY);
    const list: Product[] = cached ? JSON.parse(cached) : [...INITIAL_PRODUCTS];
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: product.name || 'Nouveau Plat',
      description: product.description || '',
      price: typeof product.price === 'number' ? product.price : 10000,
      categoryId: product.categoryId || 'cat-plats',
      categoryName: product.categoryName || 'Plats',
      image: product.image || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      badge: product.badge || null,
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true,
      preparationTime: product.preparationTime || '15 min',
      spiceLevel: product.spiceLevel || 0,
    };
    list.unshift(newProd);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
    return newProd;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(PRODUCTS_KEY);
    const list: Product[] = cached ? JSON.parse(cached) : [...INITIAL_PRODUCTS];
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
      return list[index];
    }
    throw new Error('Produit non trouvé');
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) return true;
    } catch {
      // fallback
    }
    const cached = localStorage.getItem(PRODUCTS_KEY);
    if (cached) {
      const list: Product[] = JSON.parse(cached);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list.filter(p => p.id !== id)));
    }
    return true;
  },

  /**
   * Supprime TOUS les plats du menu. Action irréversible, réservée à l'admin.
   * Ne touche ni aux catégories, ni aux commandes, ni aux paramètres.
   */
  async resetAllProducts(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    const res = await fetch('/api/admin/reset-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ confirm: 'SUPPRIMER' }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Échec de la réinitialisation (HTTP ${res.status})` };
    }
    localStorage.removeItem(PRODUCTS_KEY);
    return { success: true, deletedCount: data.deletedCount };
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    let serverCats: Category[] | null = null;
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        serverCats = await res.json();
      }
    } catch {
      // fallback to cached
    }

    const cached = localStorage.getItem(CATEGORIES_KEY);
    const localList: Category[] = cached ? JSON.parse(cached) : [...INITIAL_CATEGORIES];

    if (serverCats && Array.isArray(serverCats)) {
      // Preserve any local categories that might not have reached server yet
      const missingInServer = localList.filter(
        (loc) => !serverCats!.some((srv) => srv.id === loc.id || (loc.slug && srv.slug === loc.slug))
      );

      let merged = [...serverCats];
      if (missingInServer.length > 0) {
        merged = [...serverCats, ...missingInServer];
        // Background sync to server with admin headers
        missingInServer.forEach((cat) => {
          fetch('/api/categories', {
            method: 'POST',
            headers: getAdminHeaders(),
            body: JSON.stringify(cat),
          }).catch(() => {});
        });
      }

      // Sort by order
      merged.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(merged));
      return merged;
    }

    return localList;
  },

  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    const rawName = (categoryData.name || 'Nouvelle Catégorie').trim();
    const slug = categoryData.slug?.trim() || rawName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tempId = categoryData.id || `cat-${Date.now()}`;
    const payload: Category = {
      id: tempId,
      name: rawName,
      slug: slug || tempId,
      description: categoryData.description?.trim() || '',
      order: typeof categoryData.order === 'number' ? categoryData.order : 99,
    };

    let resultCategory: Category = payload;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resultCategory = await res.json();
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Erreur serveur création catégorie:', res.status, errJson);
      }
    } catch (err) {
      console.warn('Erreur réseau création catégorie (sauvegarde locale):', err);
    }

    // Always update local storage
    const cached = localStorage.getItem(CATEGORIES_KEY);
    const list: Category[] = cached ? JSON.parse(cached) : [...INITIAL_CATEGORIES];
    const existingIdx = list.findIndex(c => c.id === resultCategory.id || c.slug === resultCategory.slug);
    if (existingIdx !== -1) {
      list[existingIdx] = resultCategory;
    } else {
      list.push(resultCategory);
    }
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));

    // Dispatch global event so all components refresh immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saveurs_categories_updated', { detail: resultCategory }));
    }

    return resultCategory;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    let updatedCat: Category | null = null;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        updatedCat = await res.json();
      }
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(CATEGORIES_KEY);
    const list: Category[] = cached ? JSON.parse(cached) : [...INITIAL_CATEGORIES];
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      const current = list[idx];
      const merged: Category = {
        ...current,
        ...(updatedCat || {}),
        ...updates,
        id,
      };
      list[idx] = merged;
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));

      if (updates.name) {
        const prodsCached = localStorage.getItem(PRODUCTS_KEY);
        if (prodsCached) {
          const prods: Product[] = JSON.parse(prodsCached);
          const updatedProds = prods.map(p => p.categoryId === id ? { ...p, categoryName: updates.name! } : p);
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProds));
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('saveurs_categories_updated', { detail: merged }));
      }

      return merged;
    }

    if (updatedCat) return updatedCat;
    throw new Error('Catégorie non trouvée');
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(CATEGORIES_KEY);
    if (cached) {
      const list: Category[] = JSON.parse(cached);
      const remaining = list.filter(c => c.id !== id);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(remaining));
      const fallback = remaining.find(c => c.id !== 'cat-all') || { id: 'cat-plats', name: 'Plats' };
      const prodsCached = localStorage.getItem(PRODUCTS_KEY);
      if (prodsCached) {
        const prods: Product[] = JSON.parse(prodsCached);
        const updatedProds = prods.map(p => p.categoryId === id ? { ...p, categoryId: fallback.id, categoryName: fallback.name } : p);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProds));
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('saveurs_categories_updated'));
    }

    return true;
  },

  // Orders
  async getOrders(status?: string, search?: string): Promise<Order[]> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'All') params.append('status', status);
      if (search) params.append('search', search);

      const res = await fetch(`/api/orders?${params.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(ORDERS_KEY, JSON.stringify(data));
        return data;
      }
      // Session expirée/invalide : ne PAS basculer silencieusement sur un
      // cache obsolète. Mieux vaut forcer une reconnexion visible que de
      // faire croire que la liste des commandes est à jour.
      if (!checkAdminAuthResponse(res)) {
        throw new Error('Session administrateur expirée. Veuillez vous reconnecter.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Session administrateur')) throw err;
      // Erreur réseau réelle : on tombe sur le cache local en dernier recours.
    }

    const cached = localStorage.getItem(ORDERS_KEY);
    let list: Order[] = cached ? JSON.parse(cached) : INITIAL_ORDERS;
    if (status && status !== 'All') list = list.filter(o => o.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.id.toLowerCase().includes(q) || o.customer.fullName.toLowerCase().includes(q));
    }
    return list;
  },

  async createOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt'>): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (res.ok) return await res.json();

    // Le serveur a répondu mais a refusé la commande : on remonte la vraie
    // erreur. Une commande "réussie" qui n'existe pas réellement chez le
    // restaurant est pire qu'un échec visible — le client doit le savoir
    // et pouvoir réessayer ou contacter le restaurant directement.
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Votre commande n'a pas pu être enregistrée (HTTP ${res.status}). Veuillez réessayer ou nous contacter directement.`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(ORDERS_KEY);
    const list: Order[] = cached ? JSON.parse(cached) : [...INITIAL_ORDERS];
    const order = list.find(o => o.id === id);
    if (order) {
      order.status = status;
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
      return order;
    }
    throw new Error('Commande non trouvée');
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(ORDERS_KEY);
    const list: Order[] = cached ? JSON.parse(cached) : [...INITIAL_ORDERS];
    const index = list.findIndex(o => o.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
      return list[index];
    }
    throw new Error('Commande non trouvée');
  },

  // Customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const res = await fetch('/api/customers', {
        headers: getAdminHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    const cached = localStorage.getItem(CUSTOMERS_KEY);
    return cached ? JSON.parse(cached) : INITIAL_CUSTOMERS;
  },

  // Settings
  async getSettings(): Promise<RestaurantSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
        return data;
      }
    } catch {
      // fallback
    }
    const cached = localStorage.getItem(SETTINGS_KEY);
    return cached ? JSON.parse(cached) : INITIAL_SETTINGS;
  },

  async updateSettings(newSettings: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(newSettings),
      });
      if (res.ok) return await res.json();

      // Le serveur a répondu mais a refusé : on remonte une vraie erreur
      // au lieu de faire croire à une sauvegarde réussie.
      if (res.status === 413) {
        throw new Error(
          "Image trop volumineuse pour être enregistrée. Choisissez un logo plus léger (moins de 2 Mo)."
        );
      }
      const detail = await res.text().catch(() => '');
      throw new Error(`Échec de l'enregistrement (HTTP ${res.status}). ${detail}`);
    } catch (err) {
      // Seule une panne réseau doit basculer en mode hors-ligne
      if (err instanceof TypeError) {
        const cachedOffline = localStorage.getItem(SETTINGS_KEY);
        const currentOffline = cachedOffline ? JSON.parse(cachedOffline) : INITIAL_SETTINGS;
        const updatedOffline = { ...currentOffline, ...newSettings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedOffline));
        return updatedOffline;
      }
      throw err;
    }
  },

  // Notifications
  async testNotification(type: 'email' | 'whatsapp' | 'sms', target?: string): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    try {
      const res = await fetch('/api/admin/test-notification', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ type, target }),
      });
      if (res.ok) {
        return await res.json();
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.error || 'Erreur lors du test de notification' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur réseau lors du test' };
    }
  },

  async getNotificationLogs(): Promise<any[]> {
    try {
      const res = await fetch('/api/admin/notifications-history', {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return [];
  },

  // Admin Auth
  async login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('saveurs_admin_token', data.token);
        return data;
      }
      return { success: false, error: data.error || 'Identifiants invalides' };
    } catch {
      return { success: false, error: 'Serveur injoignable. Vérifiez votre connexion et réessayez.' };
    }
  },

  logout(): void {
    const token = localStorage.getItem('saveurs_admin_token');
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('saveurs_admin_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('saveurs_admin_token');
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const res = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Échec du changement de mot de passe (HTTP ${res.status})` };
    }
    return { success: true };
  },

  // ===================== CUSTOMER CLIENT AUTH & PROFILE =====================
  getCurrentCustomer(): Customer | null {
    try {
      const saved = localStorage.getItem('saveurs_customer_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setCurrentCustomer(customer: Customer | null): void {
    if (customer) {
      localStorage.setItem('saveurs_customer_profile', JSON.stringify(customer));
    } else {
      localStorage.removeItem('saveurs_customer_profile');
    }
  },

  async loginCustomer(identifier: string, password: string): Promise<{ success: boolean; customer?: Customer; orders?: Order[]; error?: string; notFound?: boolean }> {
    const cleanId = identifier.trim();
    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.customer) {
        this.setCurrentCustomer(data.customer);
        return data;
      }
      if (res.status === 404 || data.notFound) {
        return { success: false, notFound: true, error: data.error || 'Compte introuvable' };
      }
      return { success: false, error: data.error || 'Erreur de connexion' };
    } catch {
      // Panne réseau : mode secours local. Le mot de passe n'est pas
      // vérifiable hors-ligne (aucun hash local disponible) — ce repli ne
      // sert qu'en dernier recours quand le serveur est injoignable.
      const cachedCustomers: Customer[] = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || JSON.stringify(INITIAL_CUSTOMERS));
      const norm = cleanId.toLowerCase().replace(/[\s\-\(\)\.]/g, '');
      const found = cachedCustomers.find(c => {
        const cPhone = c.phone.toLowerCase().replace(/[\s\-\(\)\.]/g, '');
        const cEmail = c.email.toLowerCase().trim();
        return (
          (cPhone && (cPhone === norm || cPhone.endsWith(norm) || norm.endsWith(cPhone))) ||
          (cEmail && cEmail === cleanId.toLowerCase())
        );
      });

      if (found) {
        this.setCurrentCustomer(found);
        const allOrders: Order[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || JSON.stringify(INITIAL_ORDERS));
        const orders = allOrders.filter(o => o.customerId === found.id || o.customer.phone === found.phone || (found.email && o.customer.email === found.email));
        return { success: true, customer: found, orders };
      }

      return { success: false, notFound: true, error: 'Compte introuvable. Veuillez créer votre profil client.' };
    }
  },

  async registerCustomer(data: { fullName: string; phone?: string; email?: string; address?: string; district?: string; password: string; securityQuestion: string; securityAnswer: string }): Promise<{ success: boolean; customer?: Customer; orders?: Order[]; error?: string }> {
    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (res.ok && resData.success && resData.customer) {
        this.setCurrentCustomer(resData.customer);
        return resData;
      }
      return { success: false, error: resData.error || "Impossible d'enregistrer le profil." };
    } catch {
      // Local fallback
      const cachedCustomers: Customer[] = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || JSON.stringify(INITIAL_CUSTOMERS));
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() || '',
        email: data.email?.trim() || '',
        address: data.address?.trim() || '',
        district: data.district?.trim() || 'Antanimena',
        orderCount: 0,
        totalSpent: 0,
        lastOrderDate: 'Aucune commande',
        registeredAt: new Date().toISOString().split('T')[0],
      };
      cachedCustomers.unshift(newCust);
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(cachedCustomers));
      this.setCurrentCustomer(newCust);
      return { success: true, customer: newCust, orders: [] };
    }
  },

  /** Étape 1 de la récupération de mot de passe : récupère la question de sécurité. */
  async getSecurityQuestion(identifier: string): Promise<{ success: boolean; question?: string; error?: string }> {
    try {
      const res = await fetch('/api/customer/forgot-password/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (res.ok && data.success) return data;
      return { success: false, error: data.error || 'Compte introuvable.' };
    } catch {
      return { success: false, error: 'Serveur injoignable. Vérifiez votre connexion et réessayez.' };
    }
  },

  /** Étape 2 de la récupération de mot de passe : vérifie la réponse et définit le nouveau mot de passe. */
  async resetPasswordWithSecurityAnswer(identifier: string, answer: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/customer/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, answer, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) return { success: true };
      return { success: false, error: data.error || 'Réponse incorrecte.' };
    } catch {
      return { success: false, error: 'Serveur injoignable. Vérifiez votre connexion et réessayez.' };
    }
  },

  async updateCustomerProfile(id: string, updates: Partial<Customer>): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    try {
      const res = await fetch(`/api/customer/profile/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const resData = await res.json();
      if (res.ok && resData.success && resData.customer) {
        this.setCurrentCustomer(resData.customer);
        return resData;
      }
      // Le serveur a répondu mais a refusé : on remonte son message.
      return { success: false, error: resData?.error || "Impossible d'enregistrer vos coordonnées." };
    } catch {
      // Local fallback (serveur injoignable)
    }

    const cachedCustomers: Customer[] = JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || JSON.stringify(INITIAL_CUSTOMERS));
    const idx = cachedCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      cachedCustomers[idx] = { ...cachedCustomers[idx], ...updates };
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(cachedCustomers));
      this.setCurrentCustomer(cachedCustomers[idx]);
      return { success: true, customer: cachedCustomers[idx] };
    }
    return { success: false, error: 'Client introuvable' };
  },

  async getCustomerOrders(customerId: string, phone?: string, email?: string): Promise<Order[]> {
    try {
      const res = await fetch(`/api/customer/${customerId}/orders`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Local fallback
    }

    const allOrders: Order[] = JSON.parse(localStorage.getItem(ORDERS_KEY) || JSON.stringify(INITIAL_ORDERS));
    return allOrders.filter(o => {
      if (o.customerId === customerId) return true;
      if (phone && o.customer.phone === phone) return true;
      if (email && o.customer.email === email) return true;
      return false;
    });
  },

  // Contact Messages & Reservations
  async getMessages(status?: string, type?: string, search?: string): Promise<ContactMessage[]> {
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (type && type !== 'all') params.append('type', type);
      if (search) params.append('search', search);

      const res = await fetch(`/api/messages?${params.toString()}`, {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(data));
        return data;
      }
      if (!checkAdminAuthResponse(res)) {
        throw new Error('Session administrateur expirée. Veuillez vous reconnecter.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Session administrateur')) throw err;
      // Erreur réseau réelle : on tombe sur le cache local en dernier recours.
    }

    const cached = localStorage.getItem(MESSAGES_KEY);
    let list: ContactMessage[] = cached ? JSON.parse(cached) : INITIAL_MESSAGES;
    if (status && status !== 'all') list = list.filter(m => m.status === status);
    if (type && type !== 'all') list = list.filter(m => m.requestType === type);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async createMessage(messageData: Partial<ContactMessage>): Promise<ContactMessage> {
    let res: Response;
    try {
      res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
    } catch (networkErr) {
      // Vraie panne réseau (site injoignable) : on sauvegarde en local pour ne pas perdre la demande.
      const cached = localStorage.getItem(MESSAGES_KEY);
      const list: ContactMessage[] = cached ? JSON.parse(cached) : [...INITIAL_MESSAGES];
      const newMsg: ContactMessage = {
        id: messageData.id || `MSG-${Date.now().toString().slice(-4)}`,
        name: messageData.name || 'Client',
        email: messageData.email || '',
        phone: messageData.phone || '',
        subject: messageData.subject || 'Demande de contact',
        requestType: messageData.requestType || 'information',
        reservationDate: messageData.reservationDate,
        reservationTime: messageData.reservationTime,
        guestsCount: messageData.guestsCount,
        message: messageData.message || '',
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      list.unshift(newMsg);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
      return newMsg;
    }

    if (!res.ok) {
      // Le serveur a répondu mais a refusé la demande (validation, etc.) :
      // on remonte la vraie erreur plutôt que de faire croire à un envoi réussi.
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Échec de l'envoi du message (HTTP ${res.status})`);
    }

    const created = await res.json();
    const cached = localStorage.getItem(MESSAGES_KEY);
    const list: ContactMessage[] = cached ? JSON.parse(cached) : [...INITIAL_MESSAGES];
    list.unshift(created);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
    return created;
  },

  async updateMessageStatus(id: string, status: 'new' | 'read' | 'treated'): Promise<ContactMessage> {
    try {
      const res = await fetch(`/api/messages/${id}/status`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        const cached = localStorage.getItem(MESSAGES_KEY);
        if (cached) {
          const list: ContactMessage[] = JSON.parse(cached);
          const idx = list.findIndex(m => m.id === id);
          if (idx !== -1) {
            list[idx] = updated;
            localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
          }
        }
        return updated;
      }
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(MESSAGES_KEY);
    const list: ContactMessage[] = cached ? JSON.parse(cached) : [...INITIAL_MESSAGES];
    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
      list[idx].status = status;
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list));
      return list[idx];
    }
    throw new Error('Message non trouvé');
  },

  async deleteMessage(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const cached = localStorage.getItem(MESSAGES_KEY);
        if (cached) {
          const list: ContactMessage[] = JSON.parse(cached);
          localStorage.setItem(MESSAGES_KEY, JSON.stringify(list.filter(m => m.id !== id)));
        }
        return true;
      }
    } catch {
      // fallback
    }

    const cached = localStorage.getItem(MESSAGES_KEY);
    if (cached) {
      const list: ContactMessage[] = JSON.parse(cached);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(list.filter(m => m.id !== id)));
    }
    return true;
  }
};
