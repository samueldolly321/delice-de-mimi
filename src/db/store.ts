/**
 * Couche d'accès aux données de l'application.
 *
 * Utilise PostgreSQL (via Drizzle) quand DATABASE_URL est configuré et
 * accessible. Si aucune base n'est configurée, bascule automatiquement
 * sur un fichier JSON local (.data_store.json) — pour ne jamais bloquer
 * le développement local sans base de données.
 *
 * Le serveur (server.ts) n'appelle jamais Drizzle ni le fichier JSON
 * directement : il passe toujours par les fonctions exportées ici.
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { eq, desc, sql } from 'drizzle-orm';
import { getDb, schema } from './index';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
  INITIAL_MESSAGES,
} from '../data/seedData';
import {
  Product,
  ProductBadge,
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Customer,
  RestaurantSettings,
  ContactMessage,
  DeliveryType,
  PaymentMethod,
} from '../types';
import { isFreeDeliveryBySubtotal } from '../utils/delivery';

const db = getDb();

export const isDatabaseConnected = () => db !== null;

// ============================================================================
//  MODE SECOURS : fichier JSON local (utilisé uniquement si aucune base
//  PostgreSQL n'est configurée ou joignable au démarrage)
// ============================================================================

const DATA_FILE = path.join(process.cwd(), '.data_store.json');

let fileProducts: Product[] = [...INITIAL_PRODUCTS];
let fileCategories: Category[] = [...INITIAL_CATEGORIES];
let fileOrders: Order[] = [...INITIAL_ORDERS];
let fileCustomers: Customer[] = [...INITIAL_CUSTOMERS];
let fileSettings: RestaurantSettings = { ...INITIAL_SETTINGS };
let fileMessages: ContactMessage[] = [...INITIAL_MESSAGES];
let fileOrderCounter = 1025;
let fileMessageCounter = 102;
let fileAdminUser: { id: string; email: string; passwordHash: string } | null = null;

const loadFileStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) fileCategories = parsed.categories;
      if (Array.isArray(parsed.products) && parsed.products.length > 0) fileProducts = parsed.products;
      if (Array.isArray(parsed.orders)) fileOrders = parsed.orders;
      if (Array.isArray(parsed.customers)) fileCustomers = parsed.customers;
      if (parsed.settings) fileSettings = { ...INITIAL_SETTINGS, ...parsed.settings };
      if (Array.isArray(parsed.messages)) fileMessages = parsed.messages;
      if (parsed.orderCounter) fileOrderCounter = parsed.orderCounter;
      if (parsed.messageCounter) fileMessageCounter = parsed.messageCounter;
      if (parsed.adminUser) fileAdminUser = parsed.adminUser;
    }
  } catch (e) {
    console.error('Erreur chargement store JSON local:', e);
  }
};

const persistFileStore = () => {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          categories: fileCategories,
          products: fileProducts,
          orders: fileOrders,
          customers: fileCustomers,
          settings: fileSettings,
          messages: fileMessages,
          orderCounter: fileOrderCounter,
          messageCounter: fileMessageCounter,
          adminUser: fileAdminUser,
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch (e) {
    console.error('Erreur sauvegarde store JSON local:', e);
  }
};

if (!db) {
  console.warn(
    '⚠️  Aucune connexion PostgreSQL active (DATABASE_URL absent ou invalide). ' +
    'Le serveur fonctionne en mode secours avec un fichier JSON local (.data_store.json). ' +
    'Consultez INSTALLATION_LOCALE.md pour connecter votre base.'
  );
  loadFileStore();
} else {
  console.log('✅ Connecté à PostgreSQL — les données sont persistées dans la base.');
}

// ============================================================================
//  UTILITAIRES DE CONVERSION (ligne de base <-> type applicatif)
// ============================================================================

const toDateOnly = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().split('T')[0];
};

const rowToProduct = (row: typeof schema.products.$inferSelect): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  categoryId: row.categoryId || '',
  categoryName: row.categoryName,
  image: row.image,
  badge: (row.badge as ProductBadge) || null,
  promoNote: row.promoNote || undefined,
  isAvailable: row.isAvailable,
  preparationTime: row.preparationTime || '15 min',
  spiceLevel: row.spiceLevel ?? 0,
});

const rowToCategory = (row: typeof schema.categories.$inferSelect): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description || '',
  order: row.sortOrder,
});

const rowToCustomer = (row: typeof schema.customers.$inferSelect): Customer => ({
  id: row.id,
  fullName: row.fullName,
  phone: row.phone,
  email: row.email || '',
  address: row.address || '',
  district: row.district || '',
  orderCount: row.orderCount,
  totalSpent: row.totalSpent,
  lastOrderDate: row.lastOrderDate ? toDateOnly(row.lastOrderDate) : 'Aucune commande',
  registeredAt: toDateOnly(row.registeredAt),
});

const rowToOrder = (row: typeof schema.orders.$inferSelect): Order => ({
  id: row.id,
  customerId: row.customerId || undefined,
  customer: {
    fullName: row.customerName,
    phone: row.customerPhone,
    email: row.customerEmail || '',
    address: row.customerAddress,
    district: row.customerDistrict || 'Antananarivo',
    instructions: row.customerInstructions || undefined,
  },
  items: (row.itemsJson as OrderItem[]) || [],
  subtotal: row.subtotal,
  deliveryFee: row.deliveryFee,
  total: row.total,
  deliveryType: row.deliveryType as DeliveryType,
  paymentMethod: row.paymentMethod as PaymentMethod,
  status: row.status as OrderStatus,
  createdAt: row.createdAt.toISOString(),
  estimatedDelivery: row.estimatedDelivery || undefined,
  loyaltyReward: (row.loyaltyReward as Order['loyaltyReward']) || undefined,
});

const rowToSettings = (row: typeof schema.restaurantSettings.$inferSelect): RestaurantSettings => ({
  name: row.name,
  tagline: row.tagline,
  description: row.description,
  topBarText: row.topBarText || undefined,
  footerTagline: row.footerTagline || undefined,
  footerCopyrightSuffix: row.footerCopyrightSuffix || undefined,
  loyaltyEnabled: row.loyaltyEnabled ?? true,
  loyaltyFreeDeliveryEvery: row.loyaltyFreeDeliveryEvery ?? 5,
  loyaltyFreeSoupEvery: row.loyaltyFreeSoupEvery ?? 10,
  loyaltyFreeSoupName: row.loyaltyFreeSoupName || 'Soupe basique',
  logoText: row.logoText,
  logoUrl: row.logoUrl || undefined,
  address: row.address,
  googleMapsUrl: row.googleMapsUrl || undefined,
  phone: row.phone,
  whatsappPhone: row.whatsappPhone || undefined,
  email: row.email,
  openingHours: row.openingHours,
  deliveryFee: row.deliveryFee,
  freeDeliveryThreshold: row.freeDeliveryThreshold,
  freeDeliveryNotice: row.freeDeliveryNotice || undefined,
  facebookUrl: row.facebookUrl || '',
  instagramUrl: row.instagramUrl || '',
  tiktokUrl: row.tiktokUrl || '',
  whatsappUrl: row.whatsappUrl || undefined,
  currency: row.currency,
  isOrderingEnabled: row.isOrderingEnabled,
  nifNumber: row.nifNumber || undefined,
  statNumber: row.statNumber || undefined,
  rcsNumber: row.rcsNumber || undefined,
  invoiceNotice: row.invoiceNotice || undefined,
  slides: (row.slidesJson as RestaurantSettings['slides']) || undefined,
  chef: (row.chefJson as RestaurantSettings['chef']) || undefined,
  home: (row.homeJson as RestaurantSettings['home']) || undefined,
  soupToppings: (row.toppingsJson as RestaurantSettings['soupToppings']) || undefined,
  notificationEmail: row.notificationEmail || undefined,
  notificationPhone: row.notificationPhone || undefined,
  notifyEmailEnabled: row.notifyEmailEnabled ?? true,
  notifyWhatsappEnabled: row.notifyWhatsappEnabled ?? true,
  notifySoundEnabled: row.notifySoundEnabled ?? true,
});

const rowToMessage = (row: typeof schema.contactMessages.$inferSelect): ContactMessage => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone || undefined,
  subject: row.subject,
  requestType: row.requestType as ContactMessage['requestType'],
  reservationDate: row.reservationDate || undefined,
  reservationTime: row.reservationTime || undefined,
  guestsCount: row.guestsCount || undefined,
  message: row.message,
  status: row.status as ContactMessage['status'],
  createdAt: row.createdAt.toISOString(),
});

// ============================================================================
//  COMPTEURS (numérotation CMD-xxxx / MSG-xxx)
// ============================================================================

async function nextCounter(key: 'orderCounter' | 'messageCounter'): Promise<number> {
  if (db) {
    const defaultStart = key === 'orderCounter' ? 1025 : 102;

    // Crée la ligne du compteur si elle n'existe pas encore (sans jamais
    // écraser une valeur déjà existante).
    await db.insert(schema.appCounters).values({ key, value: defaultStart }).onConflictDoNothing();

    // Incrément atomique : PostgreSQL verrouille la ligne le temps de cette
    // seule requête UPDATE. Deux commandes arrivant en même temps ne peuvent
    // donc jamais recevoir le même numéro, contrairement à un schéma
    // "lire la valeur, puis l'écrire" en deux étapes séparées.
    const [row] = await db
      .update(schema.appCounters)
      .set({ value: sql`${schema.appCounters.value} + 1` })
      .where(eq(schema.appCounters.key, key))
      .returning({ value: schema.appCounters.value });

    return row.value - 1; // La valeur réservée pour CETTE commande/message
  }
  if (key === 'orderCounter') return fileOrderCounter++;
  return fileMessageCounter++;
}

// ============================================================================
//  PRODUITS
// ============================================================================

export async function getProducts(filters: { category?: string; search?: string; availableOnly?: boolean }): Promise<Product[]> {
  if (db) {
    const rows = await db.query.products.findMany();
    let list = rows.map(rowToProduct);
    if (filters.category && filters.category !== 'all' && filters.category !== 'cat-all') {
      list = list.filter((p: Product) => p.categoryId === filters.category || p.categoryName.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p: Product) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    if (filters.availableOnly) {
      list = list.filter((p: Product) => p.isAvailable);
    }
    return list;
  }

  let list = [...fileProducts];
  if (filters.category && filters.category !== 'all' && filters.category !== 'cat-all') {
    list = list.filter(p => p.categoryId === filters.category || p.categoryName.toLowerCase() === filters.category!.toLowerCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (filters.availableOnly) {
    list = list.filter(p => p.isAvailable);
  }
  return list;
}

export async function createProduct(input: Omit<Product, 'id'>): Promise<Product> {
  const id = `prod-${Date.now()}`;
  if (db) {
    const [row] = await db.insert(schema.products).values({ id, ...input }).returning();
    return rowToProduct(row);
  }
  const newProduct: Product = { id, ...input };
  fileProducts.unshift(newProduct);
  persistFileStore();
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (db) {
    const [row] = await db.update(schema.products).set(updates).where(eq(schema.products.id, id)).returning();
    return row ? rowToProduct(row) : null;
  }
  const index = fileProducts.findIndex(p => p.id === id);
  if (index === -1) return null;
  fileProducts[index] = { ...fileProducts[index], ...updates, id };
  persistFileStore();
  return fileProducts[index];
}

export async function deleteProduct(id: string): Promise<void> {
  if (db) {
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return;
  }
  fileProducts = fileProducts.filter(p => p.id !== id);
  persistFileStore();
}

/**
 * Supprime TOUS les plats (remise à zéro du menu).
 * Les catégories, commandes, clients et paramètres ne sont pas touchés.
 * Renvoie le nombre de plats supprimés.
 */
export async function resetAllProducts(): Promise<number> {
  if (db) {
    const deleted = await db.delete(schema.products).returning({ id: schema.products.id });
    return deleted.length;
  }
  const count = fileProducts.length;
  fileProducts = [];
  persistFileStore();
  return count;
}

// ============================================================================
//  CATÉGORIES
// ============================================================================

export async function getCategories(): Promise<Category[]> {
  if (db) {
    const rows = await db.query.categories.findMany();
    return rows.map(rowToCategory).sort((a: Category, b: Category) => a.order - b.order);
  }
  return [...fileCategories].sort((a: Category, b: Category) => a.order - b.order);
}

export async function createCategory(input: Category): Promise<Category> {
  if (db) {
    const [row] = await db
      .insert(schema.categories)
      .values({ id: input.id, name: input.name, slug: input.slug, description: input.description || '', sortOrder: input.order })
      .returning();
    return rowToCategory(row);
  }
  fileCategories.push(input);
  persistFileStore();
  return input;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  if (db) {
    const values: Record<string, unknown> = {};
    if (updates.name !== undefined) values.name = updates.name;
    if (updates.slug !== undefined) values.slug = updates.slug;
    if (updates.description !== undefined) values.description = updates.description;
    if (updates.order !== undefined) values.sortOrder = updates.order;
    const [row] = await db.update(schema.categories).set(values).where(eq(schema.categories.id, id)).returning();
    if (!row) return null;
    // Synchronise categoryName sur les plats si le nom a changé
    if (updates.name !== undefined) {
      await db.update(schema.products).set({ categoryName: updates.name }).where(eq(schema.products.categoryId, id));
    }
    return rowToCategory(row);
  }

  const index = fileCategories.findIndex(c => c.id === id);
  if (index === -1) return null;
  const oldName = fileCategories[index].name;
  fileCategories[index] = { ...fileCategories[index], ...updates, id };
  if (updates.name && updates.name !== oldName) {
    fileProducts = fileProducts.map(p => (p.categoryId === id ? { ...p, categoryName: updates.name! } : p));
  }
  persistFileStore();
  return fileCategories[index];
}

export async function deleteCategory(id: string): Promise<{ reallocatedTo: string } | null> {
  if (db) {
    const all = await db.query.categories.findMany();
    const fallbackRow = all.find((c: typeof schema.categories.$inferSelect) => c.id !== id && c.id !== 'cat-all');
    const fallback = fallbackRow ? rowToCategory(fallbackRow) : { id: 'cat-plats', name: 'Plats' };

    await db.update(schema.products).set({ categoryId: fallback.id, categoryName: fallback.name }).where(eq(schema.products.categoryId, id));
    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    return { reallocatedTo: fallback.name };
  }

  const fallback = fileCategories.find(c => c.id !== id && c.id !== 'cat-all') || { id: 'cat-plats', name: 'Plats' };
  fileCategories = fileCategories.filter(c => c.id !== id);
  fileProducts = fileProducts.map(p => (p.categoryId === id ? { ...p, categoryId: fallback.id, categoryName: fallback.name } : p));
  persistFileStore();
  return { reallocatedTo: fallback.name };
}

// ============================================================================
//  CLIENTS
// ============================================================================

const normalizeIdentifier = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  return trimmed.replace(/[\s\-()\.]/g, '');
};

export async function getCustomers(): Promise<Customer[]> {
  if (db) {
    const rows = await db.query.customers.findMany();
    return rows.map(rowToCustomer);
  }
  return [...fileCustomers];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  if (db) {
    const row = await db.query.customers.findFirst({ where: eq(schema.customers.id, id) });
    return row ? rowToCustomer(row) : null;
  }
  return fileCustomers.find(c => c.id === id) || null;
}

export async function findCustomerByIdentifier(identifier: string): Promise<Customer | null> {
  const norm = normalizeIdentifier(identifier);
  if (!norm) return null;

  const all = db ? (await db.query.customers.findMany()).map(rowToCustomer) : fileCustomers;
  return (
    all.find((c: Customer) => {
      const cPhoneNorm = normalizeIdentifier(c.phone);
      const cEmailNorm = normalizeIdentifier(c.email);
      return (
        (cPhoneNorm && (cPhoneNorm === norm || cPhoneNorm.endsWith(norm) || norm.endsWith(cPhoneNorm))) ||
        (cEmailNorm && cEmailNorm === norm)
      );
    }) || null
  );
}

export async function createCustomer(input: Omit<Customer, 'id'>): Promise<Customer> {
  const id = `cust-${Date.now()}`;
  if (db) {
    const [row] = await db
      .insert(schema.customers)
      .values({
        id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email || null,
        address: input.address || null,
        district: input.district || null,
        orderCount: input.orderCount,
        totalSpent: input.totalSpent,
        lastOrderDate: input.lastOrderDate && input.lastOrderDate !== 'Aucune commande' ? new Date(input.lastOrderDate) : null,
      })
      .returning();
    return rowToCustomer(row);
  }
  const newCustomer: Customer = { id, ...input };
  fileCustomers.push(newCustomer);
  persistFileStore();
  return newCustomer;
}

/** Définit (ou remplace) le mot de passe haché d'un client — jamais le mot de passe en clair. */
export async function setCustomerPasswordHash(customerId: string, passwordHash: string): Promise<void> {
  if (db) {
    await db.update(schema.customers).set({ passwordHash }).where(eq(schema.customers.id, customerId));
    return;
  }
  const cust = fileCustomers.find(c => c.id === customerId) as (Customer & { passwordHash?: string }) | undefined;
  if (cust) {
    cust.passwordHash = passwordHash;
    persistFileStore();
  }
}

/** Définit la question/réponse de sécurité d'un client — la réponse n'est jamais stockée en clair. */
export async function setCustomerSecurityQA(customerId: string, question: string, answerHash: string): Promise<void> {
  if (db) {
    await db.update(schema.customers).set({ securityQuestion: question, securityAnswerHash: answerHash }).where(eq(schema.customers.id, customerId));
    return;
  }
  const cust = fileCustomers.find(c => c.id === customerId) as (Customer & { securityQuestion?: string; securityAnswerHash?: string }) | undefined;
  if (cust) {
    cust.securityQuestion = question;
    cust.securityAnswerHash = answerHash;
    persistFileStore();
  }
}

/**
 * Renvoie la question de sécurité d'un client (sans jamais exposer la réponse).
 * null si le compte n'existe pas OU n'a pas encore de question définie.
 */
export async function getCustomerSecurityQuestion(identifier: string): Promise<{ question: string } | null> {
  const norm = normalizeIdentifier(identifier);
  if (!norm) return null;

  if (db) {
    const rows = await db.query.customers.findMany();
    const match = rows.find(r => {
      const p = normalizeIdentifier(r.phone);
      const e = normalizeIdentifier(r.email || '');
      return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
    });
    return match?.securityQuestion ? { question: match.securityQuestion } : null;
  }

  const match = fileCustomers.find(c => {
    const p = normalizeIdentifier(c.phone);
    const e = normalizeIdentifier(c.email);
    return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
  }) as (Customer & { securityQuestion?: string }) | undefined;
  return match?.securityQuestion ? { question: match.securityQuestion } : null;
}

/**
 * Réinitialise le mot de passe d'un client après vérification de sa réponse
 * de sécurité (comparaison insensible à la casse et aux espaces superflus).
 */
export async function resetCustomerPasswordWithSecurityAnswer(
  identifier: string,
  answer: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const norm = normalizeIdentifier(identifier);
  if (!norm) return { success: false, error: 'Identifiant invalide.' };
  const normalizedAnswer = answer.trim().toLowerCase();

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  if (db) {
    const rows = await db.query.customers.findMany();
    const match = rows.find(r => {
      const p = normalizeIdentifier(r.phone);
      const e = normalizeIdentifier(r.email || '');
      return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
    });
    if (!match) return { success: false, error: 'Compte introuvable.' };
    if (!match.securityAnswerHash) return { success: false, error: 'Aucune question de sécurité définie sur ce compte.' };

    const valid = await bcrypt.compare(normalizedAnswer, match.securityAnswerHash);
    if (!valid) return { success: false, error: 'Réponse incorrecte.' };

    await db.update(schema.customers).set({ passwordHash: newHash }).where(eq(schema.customers.id, match.id));
    return { success: true };
  }

  const match = fileCustomers.find(c => {
    const p = normalizeIdentifier(c.phone);
    const e = normalizeIdentifier(c.email);
    return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
  }) as (Customer & { securityAnswerHash?: string; passwordHash?: string }) | undefined;
  if (!match) return { success: false, error: 'Compte introuvable.' };
  if (!match.securityAnswerHash) return { success: false, error: 'Aucune question de sécurité définie sur ce compte.' };

  const valid = await bcrypt.compare(normalizedAnswer, match.securityAnswerHash);
  if (!valid) return { success: false, error: 'Réponse incorrecte.' };

  match.passwordHash = newHash;
  persistFileStore();
  return { success: true };
}

/**
 * Vérifie le mot de passe d'un client identifié par téléphone ou email.
 *
 * - Compte introuvable → null
 * - Compte trouvé mais sans mot de passe encore défini (créé avant
 *   l'introduction de cette fonctionnalité) → le mot de passe fourni est
 *   enregistré comme mot de passe définitif de ce compte (rattachement
 *   unique), et la connexion est acceptée.
 * - Compte avec mot de passe déjà défini → vérification stricte (bcrypt).
 */
export async function verifyOrSetCustomerPassword(
  identifier: string,
  password: string
): Promise<{ customer: Customer; wrongPassword?: boolean } | null> {
  const norm = normalizeIdentifier(identifier);
  if (!norm) return null;

  if (db) {
    const rows = await db.query.customers.findMany();
    const match = rows.find(r => {
      const p = normalizeIdentifier(r.phone);
      const e = normalizeIdentifier(r.email || '');
      return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
    });
    if (!match) return null;

    if (!match.passwordHash) {
      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await db.update(schema.customers).set({ passwordHash: hash }).where(eq(schema.customers.id, match.id));
      return { customer: rowToCustomer(match) };
    }

    const valid = await bcrypt.compare(password, match.passwordHash);
    return { customer: rowToCustomer(match), wrongPassword: !valid };
  }

  const match = fileCustomers.find(c => {
    const p = normalizeIdentifier(c.phone);
    const e = normalizeIdentifier(c.email);
    return (p && (p === norm || p.endsWith(norm) || norm.endsWith(p))) || (e && e === norm);
  }) as (Customer & { passwordHash?: string }) | undefined;
  if (!match) return null;

  if (!match.passwordHash) {
    match.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    persistFileStore();
    return { customer: { ...match } };
  }

  const valid = await bcrypt.compare(password, match.passwordHash);
  return { customer: { ...match }, wrongPassword: !valid };
}

export async function updateCustomerProfile(id: string, updates: Partial<Customer>): Promise<Customer | null> {
  if (db) {
    const values: Record<string, unknown> = {};
    if (updates.fullName !== undefined) values.fullName = updates.fullName;
    if (updates.phone !== undefined) values.phone = updates.phone;
    if (updates.email !== undefined) values.email = updates.email;
    if (updates.address !== undefined) values.address = updates.address;
    if (updates.district !== undefined) values.district = updates.district;
    const [row] = await db.update(schema.customers).set(values).where(eq(schema.customers.id, id)).returning();
    return row ? rowToCustomer(row) : null;
  }
  const index = fileCustomers.findIndex(c => c.id === id);
  if (index === -1) return null;
  fileCustomers[index] = { ...fileCustomers[index], ...updates, id };
  persistFileStore();
  return fileCustomers[index];
}

/** Incrémente les statistiques d'un client existant après une nouvelle commande. */
async function bumpCustomerStats(customerId: string, orderTotal: number, safeAddress: string, safeDistrict: string): Promise<void> {
  if (db) {
    const existing = await db.query.customers.findFirst({ where: eq(schema.customers.id, customerId) });
    if (!existing) return;
    const values: Record<string, unknown> = {
      orderCount: existing.orderCount + 1,
      totalSpent: existing.totalSpent + orderTotal,
      lastOrderDate: new Date(),
    };
    if (safeAddress && (!existing.address || existing.address.includes('À emporter'))) values.address = safeAddress;
    if (safeDistrict && !existing.district) values.district = safeDistrict;
    await db.update(schema.customers).set(values).where(eq(schema.customers.id, customerId));
    return;
  }
  const cust = fileCustomers.find(c => c.id === customerId);
  if (!cust) return;
  cust.orderCount = (cust.orderCount || 0) + 1;
  cust.totalSpent = (cust.totalSpent || 0) + orderTotal;
  cust.lastOrderDate = toDateOnly(new Date());
  if (safeAddress && (!cust.address || cust.address.includes('À emporter'))) cust.address = safeAddress;
  if (safeDistrict && !cust.district) cust.district = safeDistrict;
}

// ============================================================================
//  COMMANDES
// ============================================================================

export async function getOrders(filters: { status?: string; search?: string }): Promise<Order[]> {
  const all = db ? (await db.query.orders.findMany({ orderBy: [desc(schema.orders.createdAt)] })).map(rowToOrder) : [...fileOrders];
  let list = all;
  if (filters.status && filters.status !== 'All') {
    list = list.filter((o: Order) => o.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((o: Order) => o.id.toLowerCase().includes(q) || o.customer.fullName.toLowerCase().includes(q) || (o.customer.phone && o.customer.phone.toLowerCase().includes(q)));
  }
  return list;
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (db) {
    const row = await db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
    return row ? rowToOrder(row) : null;
  }
  return fileOrders.find(o => o.id === id) || null;
}

interface CreateOrderInput {
  customer: Order['customer'];
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  requestedCustomerId?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const orderNum = await nextCounter('orderCounter');
  const orderId = `CMD-${orderNum}`;

  let matchedCustomer = input.requestedCustomerId ? await getCustomerById(input.requestedCustomerId) : null;
  if (!matchedCustomer && input.customer.phone) matchedCustomer = await findCustomerByIdentifier(input.customer.phone);
  if (!matchedCustomer && input.customer.email) matchedCustomer = await findCustomerByIdentifier(input.customer.email);

  const estimatedDelivery = input.deliveryType === 'takeaway' ? '20-25 min' : '35-45 min';

  // ---- Programme de fidélité ----
  // Calculé côté serveur uniquement (jamais depuis les données envoyées par le
  // client) pour ne pas pouvoir être falsifié. Basé sur le nombre de
  // commandes déjà passées par CE client, avant la commande en cours.
  let finalItems = [...input.items];
  let finalDeliveryFee = input.deliveryFee;
  let finalTotal = input.total;
  let loyaltyReward: Order['loyaltyReward'] = undefined;

  if (matchedCustomer) {
    const loyaltySettings = await getSettings();
    if (loyaltySettings.loyaltyEnabled !== false) {
      const upcomingOrderNumber = matchedCustomer.orderCount + 1;
      const freeDeliveryEvery = loyaltySettings.loyaltyFreeDeliveryEvery || 5;
      const freeSoupEvery = loyaltySettings.loyaltyFreeSoupEvery || 10;

      // Les frais exacts sont fixés plus tard par l'équipe : la récompense
      // s'applique à toute livraison, sauf si elle est déjà offerte par le seuil.
      const getsFreeDelivery =
        freeDeliveryEvery > 0 &&
        upcomingOrderNumber % freeDeliveryEvery === 0 &&
        input.deliveryType === 'delivery' &&
        !isFreeDeliveryBySubtotal(input.subtotal, loyaltySettings);
      const getsFreeSoup = freeSoupEvery > 0 && upcomingOrderNumber % freeSoupEvery === 0;

      if (getsFreeDelivery) {
        finalTotal -= finalDeliveryFee;
        finalDeliveryFee = 0;
      }
      if (getsFreeSoup) {
        const soupName = loyaltySettings.loyaltyFreeSoupName || 'Soupe basique';
        finalItems = [...finalItems, { productId: 'loyalty-free-soup', name: `${soupName} (Fidélité — Offerte)`, price: 0, quantity: 1 }];
      }

      if (getsFreeDelivery && getsFreeSoup) loyaltyReward = 'free_delivery_and_soup';
      else if (getsFreeDelivery) loyaltyReward = 'free_delivery';
      else if (getsFreeSoup) loyaltyReward = 'free_soup';
    }
  }

  let finalCustomerId: string;
  if (matchedCustomer) {
    await bumpCustomerStats(matchedCustomer.id, finalTotal, input.customer.address, input.customer.district);
    finalCustomerId = matchedCustomer.id;
  } else {
    const newCust = await createCustomer({
      fullName: input.customer.fullName,
      phone: input.customer.phone || '',
      email: input.customer.email || '',
      address: input.customer.address || '',
      district: input.customer.district || 'Antanimena',
      orderCount: 1,
      totalSpent: finalTotal,
      lastOrderDate: toDateOnly(new Date()),
      registeredAt: toDateOnly(new Date()),
    });
    finalCustomerId = newCust.id;
  }

  if (db) {
    const [row] = await db
      .insert(schema.orders)
      .values({
        id: orderId,
        customerId: finalCustomerId,
        customerName: input.customer.fullName,
        customerPhone: input.customer.phone,
        customerEmail: input.customer.email || null,
        customerAddress: input.customer.address,
        customerDistrict: input.customer.district || 'Antananarivo',
        customerInstructions: input.customer.instructions || null,
        itemsJson: finalItems as any,
        subtotal: Math.round(input.subtotal),
        deliveryFee: Math.round(finalDeliveryFee),
        total: Math.round(finalTotal),
        deliveryType: input.deliveryType,
        paymentMethod: input.paymentMethod,
        status: 'Nouvelle',
        estimatedDelivery,
        loyaltyReward: loyaltyReward || null,
      })
      .returning();
    return rowToOrder(row);
  }

  const newOrder: Order = {
    id: orderId,
    customerId: finalCustomerId,
    customer: input.customer,
    items: finalItems,
    subtotal: input.subtotal,
    deliveryFee: finalDeliveryFee,
    total: finalTotal,
    deliveryType: input.deliveryType,
    paymentMethod: input.paymentMethod,
    status: 'Nouvelle',
    createdAt: new Date().toISOString(),
    estimatedDelivery,
    loyaltyReward,
  };
  fileOrders.unshift(newOrder);
  persistFileStore();
  return newOrder;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (db) {
    const [row] = await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, id)).returning();
    return row ? rowToOrder(row) : null;
  }
  const order = fileOrders.find(o => o.id === id);
  if (!order) return null;
  order.status = status;
  persistFileStore();
  return order;
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
  if (db) {
    const values: Record<string, unknown> = {};
    if (updates.status !== undefined) values.status = updates.status;
    if (updates.estimatedDelivery !== undefined) values.estimatedDelivery = updates.estimatedDelivery;
    if (updates.deliveryFee !== undefined) {
      // Total toujours recalculé : sous-total des plats + frais de livraison.
      const existing = await db.query.orders.findFirst({ where: eq(schema.orders.id, id) });
      if (!existing) return null;
      const fee = Math.max(0, Math.round(Number(updates.deliveryFee) || 0));
      values.deliveryFee = fee;
      values.total = existing.subtotal + fee;
    }
    if (Object.keys(values).length === 0) return getOrderById(id);
    const [row] = await db.update(schema.orders).set(values).where(eq(schema.orders.id, id)).returning();
    return row ? rowToOrder(row) : null;
  }
  const index = fileOrders.findIndex(o => o.id === id);
  if (index === -1) return null;
  const current = fileOrders[index];
  if (updates.status !== undefined) current.status = updates.status;
  if (updates.estimatedDelivery !== undefined) current.estimatedDelivery = updates.estimatedDelivery;
  if (updates.deliveryFee !== undefined) {
    current.deliveryFee = Math.max(0, Math.round(Number(updates.deliveryFee) || 0));
    current.total = current.subtotal + current.deliveryFee;
  }
  persistFileStore();
  return fileOrders[index];
}

export async function getCustomerOrders(customerId: string): Promise<Order[]> {
  const cust = await getCustomerById(customerId);
  if (!cust) return [];
  const all = db ? (await db.query.orders.findMany()).map(rowToOrder) : fileOrders;
  return all.filter(
    (o: Order) =>
      o.customerId === customerId ||
      (cust.phone && o.customer.phone && normalizeIdentifier(o.customer.phone) === normalizeIdentifier(cust.phone)) ||
      (cust.email && o.customer.email && normalizeIdentifier(o.customer.email) === normalizeIdentifier(cust.email))
  );
}

// ============================================================================
//  PARAMÈTRES DU RESTAURANT
// ============================================================================

export async function getSettings(): Promise<RestaurantSettings> {
  if (db) {
    const row = await db.query.restaurantSettings.findFirst({ where: eq(schema.restaurantSettings.id, 'default') });
    if (row) return rowToSettings(row);
    // Aucune ligne encore : on l'initialise avec les valeurs par défaut
    const [created] = await db
      .insert(schema.restaurantSettings)
      .values({ id: 'default', ...(toSettingsRow(INITIAL_SETTINGS) as Omit<typeof schema.restaurantSettings.$inferInsert, 'id'>) })
      .onConflictDoNothing()
      .returning();
    return created ? rowToSettings(created) : INITIAL_SETTINGS;
  }
  return { ...fileSettings };
}

function toSettingsRow(s: Partial<RestaurantSettings>) {
  const row: Record<string, unknown> = {};
  if (s.name !== undefined) row.name = s.name;
  if (s.tagline !== undefined) row.tagline = s.tagline;
  if (s.description !== undefined) row.description = s.description;
  if (s.topBarText !== undefined) row.topBarText = s.topBarText;
  if (s.footerTagline !== undefined) row.footerTagline = s.footerTagline;
  if (s.footerCopyrightSuffix !== undefined) row.footerCopyrightSuffix = s.footerCopyrightSuffix;
  if (s.loyaltyEnabled !== undefined) row.loyaltyEnabled = s.loyaltyEnabled;
  if (s.loyaltyFreeDeliveryEvery !== undefined) row.loyaltyFreeDeliveryEvery = s.loyaltyFreeDeliveryEvery;
  if (s.loyaltyFreeSoupEvery !== undefined) row.loyaltyFreeSoupEvery = s.loyaltyFreeSoupEvery;
  if (s.loyaltyFreeSoupName !== undefined) row.loyaltyFreeSoupName = s.loyaltyFreeSoupName;
  if (s.logoText !== undefined) row.logoText = s.logoText;
  if (s.logoUrl !== undefined) row.logoUrl = s.logoUrl;
  if (s.address !== undefined) row.address = s.address;
  if (s.googleMapsUrl !== undefined) row.googleMapsUrl = s.googleMapsUrl;
  if (s.phone !== undefined) row.phone = s.phone;
  if (s.whatsappPhone !== undefined) row.whatsappPhone = s.whatsappPhone;
  if (s.email !== undefined) row.email = s.email;
  if (s.openingHours !== undefined) row.openingHours = s.openingHours;
  if (s.deliveryFee !== undefined) row.deliveryFee = s.deliveryFee;
  if (s.freeDeliveryThreshold !== undefined) row.freeDeliveryThreshold = s.freeDeliveryThreshold;
  if (s.freeDeliveryNotice !== undefined) row.freeDeliveryNotice = s.freeDeliveryNotice;
  if (s.facebookUrl !== undefined) row.facebookUrl = s.facebookUrl;
  if (s.instagramUrl !== undefined) row.instagramUrl = s.instagramUrl;
  if (s.tiktokUrl !== undefined) row.tiktokUrl = s.tiktokUrl;
  if (s.whatsappUrl !== undefined) row.whatsappUrl = s.whatsappUrl;
  if (s.currency !== undefined) row.currency = s.currency;
  if (s.isOrderingEnabled !== undefined) row.isOrderingEnabled = s.isOrderingEnabled;
  if (s.nifNumber !== undefined) row.nifNumber = s.nifNumber;
  if (s.statNumber !== undefined) row.statNumber = s.statNumber;
  if (s.rcsNumber !== undefined) row.rcsNumber = s.rcsNumber;
  if (s.invoiceNotice !== undefined) row.invoiceNotice = s.invoiceNotice;
  if (s.notificationEmail !== undefined) row.notificationEmail = s.notificationEmail;
  if (s.notificationPhone !== undefined) row.notificationPhone = s.notificationPhone;
  if (s.notifyEmailEnabled !== undefined) row.notifyEmailEnabled = s.notifyEmailEnabled;
  if (s.notifyWhatsappEnabled !== undefined) row.notifyWhatsappEnabled = s.notifyWhatsappEnabled;
  if (s.notifySoundEnabled !== undefined) row.notifySoundEnabled = s.notifySoundEnabled;
  if (s.slides !== undefined) row.slidesJson = s.slides;
  if (s.chef !== undefined) row.chefJson = s.chef;
  if (s.home !== undefined) row.homeJson = s.home;
  if (s.soupToppings !== undefined) row.toppingsJson = s.soupToppings;
  return row;
}

export async function updateSettings(updates: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
  if (db) {
    await getSettings(); // s'assure que la ligne 'default' existe
    const [row] = await db
      .update(schema.restaurantSettings)
      .set(toSettingsRow(updates))
      .where(eq(schema.restaurantSettings.id, 'default'))
      .returning();
    return rowToSettings(row);
  }
  fileSettings = { ...fileSettings, ...updates };
  persistFileStore();
  return fileSettings;
}

// ============================================================================
//  MESSAGES DE CONTACT
// ============================================================================

export async function getMessages(filters: { status?: string; type?: string; search?: string }): Promise<ContactMessage[]> {
  const all = db ? (await db.query.contactMessages.findMany({ orderBy: [desc(schema.contactMessages.createdAt)] })).map(rowToMessage) : [...fileMessages];
  let list = all;
  if (filters.status && filters.status !== 'all') list = list.filter((m: ContactMessage) => m.status === filters.status);
  if (filters.type && filters.type !== 'all') list = list.filter((m: ContactMessage) => m.requestType === filters.type);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (m: ContactMessage) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function createMessage(input: Omit<ContactMessage, 'id' | 'status' | 'createdAt'>): Promise<ContactMessage> {
  const num = await nextCounter('messageCounter');
  const id = `MSG-${num}`;
  if (db) {
    const [row] = await db
      .insert(schema.contactMessages)
      .values({
        id,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        subject: input.subject,
        requestType: input.requestType,
        reservationDate: input.reservationDate || null,
        reservationTime: input.reservationTime || null,
        guestsCount: input.guestsCount || null,
        message: input.message,
        status: 'new',
      })
      .returning();
    return rowToMessage(row);
  }
  const newMsg: ContactMessage = { id, ...input, status: 'new', createdAt: new Date().toISOString() };
  fileMessages.unshift(newMsg);
  persistFileStore();
  return newMsg;
}

export async function updateMessageStatus(id: string, status: ContactMessage['status']): Promise<ContactMessage | null> {
  if (db) {
    const [row] = await db.update(schema.contactMessages).set({ status }).where(eq(schema.contactMessages.id, id)).returning();
    return row ? rowToMessage(row) : null;
  }
  const index = fileMessages.findIndex(m => m.id === id);
  if (index === -1) return null;
  fileMessages[index].status = status;
  persistFileStore();
  return fileMessages[index];
}

export async function updateMessage(id: string, updates: Partial<ContactMessage>): Promise<ContactMessage | null> {
  if (db) {
    const values: Record<string, unknown> = {};
    if (updates.status !== undefined) values.status = updates.status;
    if (updates.subject !== undefined) values.subject = updates.subject;
    if (updates.message !== undefined) values.message = updates.message;
    const [row] = await db.update(schema.contactMessages).set(values).where(eq(schema.contactMessages.id, id)).returning();
    return row ? rowToMessage(row) : null;
  }
  const index = fileMessages.findIndex(m => m.id === id);
  if (index === -1) return null;
  fileMessages[index] = { ...fileMessages[index], ...updates, id };
  persistFileStore();
  return fileMessages[index];
}

export async function deleteMessage(id: string): Promise<void> {
  if (db) {
    await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, id));
    return;
  }
  fileMessages = fileMessages.filter(m => m.id !== id);
  persistFileStore();
}

// ============================================================================
//  COMPTE ADMINISTRATEUR (mot de passe haché — jamais stocké en clair)
// ============================================================================

const BCRYPT_ROUNDS = 12;

/**
 * S'assure qu'un compte admin existe. Si aucun compte n'existe encore et
 * que ADMIN_EMAIL/ADMIN_PASSWORD sont fournis (au premier démarrage), crée
 * le compte initial à partir de ces variables d'environnement — le mot de
 * passe est haché immédiatement, jamais conservé en clair. Une fois le
 * compte créé, les variables d'environnement ne sont plus utilisées :
 * la base (ou le fichier JSON) devient la seule source de vérité, et le
 * mot de passe peut ensuite être changé depuis l'administration.
 */
export async function ensureAdminBootstrap(): Promise<void> {
  const existing = await getAdminUserCount();
  if (existing > 0) return;

  const bootstrapEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD || '';
  if (!bootstrapEmail || !bootstrapPassword) {
    console.warn('[Auth] Aucun compte admin en base et ADMIN_EMAIL/ADMIN_PASSWORD absents du .env — la connexion admin sera impossible tant qu\'un compte n\'est pas créé.');
    return;
  }

  const passwordHash = await bcrypt.hash(bootstrapPassword, BCRYPT_ROUNDS);
  await createAdminUser(bootstrapEmail, passwordHash);
  console.log(`[Auth] Compte admin initial créé pour ${bootstrapEmail} (à partir du .env). Vous pouvez maintenant changer ce mot de passe depuis l'administration.`);
}

async function getAdminUserCount(): Promise<number> {
  if (db) {
    const rows = await db.query.adminUsers.findMany();
    return rows.length;
  }
  return fileAdminUser ? 1 : 0;
}

async function createAdminUser(email: string, passwordHash: string): Promise<void> {
  if (db) {
    await db.insert(schema.adminUsers).values({ id: `admin-${Date.now()}`, email, passwordHash }).onConflictDoNothing();
    return;
  }
  fileAdminUser = { id: `admin-${Date.now()}`, email, passwordHash };
  persistFileStore();
}

/**
 * Vérifie un couple email/mot de passe. Ne renvoie jamais le hash.
 */
export async function verifyAdminPassword(email: string, plainPassword: string): Promise<{ id: string; email: string } | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (db) {
    const row = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, normalizedEmail) });
    if (!row) return null;
    const valid = await bcrypt.compare(plainPassword, row.passwordHash);
    return valid ? { id: row.id, email: row.email } : null;
  }

  if (!fileAdminUser || fileAdminUser.email !== normalizedEmail) return null;
  const valid = await bcrypt.compare(plainPassword, fileAdminUser.passwordHash);
  return valid ? { id: fileAdminUser.id, email: fileAdminUser.email } : null;
}

/**
 * Change le mot de passe admin après vérification de l'ancien mot de passe.
 * Renvoie false si l'email n'existe pas ou si l'ancien mot de passe est incorrect.
 */
export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const verified = await verifyAdminPassword(email, currentPassword);
  if (!verified) return false;

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  if (db) {
    await db.update(schema.adminUsers).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(schema.adminUsers.email, verified.email));
    return true;
  }

  if (fileAdminUser) {
    fileAdminUser.passwordHash = newHash;
    persistFileStore();
  }
  return true;
}
