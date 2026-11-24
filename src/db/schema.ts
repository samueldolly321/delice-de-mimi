import { pgTable, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Catégories du Menu (Soupes, Mine Sao, Vapeurs & Nems, Spécialités Wok, Boissons & Desserts)
 */
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Plats & Produits culinaires
 */
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default('').notNull(),
  price: integer('price').notNull(), // en Ariary (Ar)
  categoryId: text('category_id').references(() => categories.id),
  categoryName: text('category_name').notNull(),
  image: text('image').notNull(),
  badge: text('badge'), // 'Populaire' | 'Nouveau' | 'Chef' | 'Promotion' | null
  promoNote: text('promo_note'),
  isAvailable: boolean('is_available').default(true).notNull(),
  preparationTime: text('preparation_time').default('15 min'),
  spiceLevel: integer('spice_level').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Clients & Comptes utilisateurs
 */
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  district: text('district'),
  // Mot de passe haché (bcrypt). Nullable : les comptes créés avant
  // l'introduction de ce champ n'en ont pas encore — voir verifyOrSetCustomerPassword.
  passwordHash: text('password_hash'),
  // Question/réponse de sécurité pour la récupération de mot de passe oublié.
  // La réponse n'est jamais stockée en clair, uniquement son empreinte bcrypt.
  securityQuestion: text('security_question'),
  securityAnswerHash: text('security_answer_hash'),
  orderCount: integer('order_count').default(0).notNull(),
  totalSpent: integer('total_spent').default(0).notNull(),
  lastOrderDate: timestamp('last_order_date'),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
});

/**
 * Commandes passées
 */
export const orders = pgTable('orders', {
  id: text('id').primaryKey(), // ex: CMD-1024
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  customerAddress: text('customer_address').notNull(),
  customerDistrict: text('customer_district').default('Antananarivo'),
  customerInstructions: text('customer_instructions'),
  itemsJson: jsonb('items_json').notNull(), // Détail des plats, garnitures, quantités
  subtotal: integer('subtotal').notNull(),
  deliveryFee: integer('delivery_fee').default(0).notNull(),
  total: integer('total').notNull(),
  deliveryType: text('delivery_type').notNull(), // 'delivery' | 'takeaway'
  paymentMethod: text('payment_method').notNull(), // 'cash_on_delivery' | 'pay_on_site' | 'mobile_money'
  status: text('status').default('Nouvelle').notNull(), // 'Nouvelle' | 'Confirmée' | 'En préparation' | 'Prête' | 'En livraison' | 'Livrée' | 'Annulée'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  estimatedDelivery: text('estimated_delivery'),
  loyaltyReward: text('loyalty_reward'), // 'free_delivery' | 'free_soup' | 'free_delivery_and_soup' | null
});

/**
 * Configuration & Paramètres du restaurant, identité, Facturation N°8, Diaporama & Chef
 */
export const restaurantSettings = pgTable('restaurant_settings', {
  id: text('id').primaryKey().default('default'),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  topBarText: text('top_bar_text'),
  footerTagline: text('footer_tagline'),
  footerCopyrightSuffix: text('footer_copyright_suffix'),
  loyaltyEnabled: boolean('loyalty_enabled').default(true).notNull(),
  loyaltyFreeDeliveryEvery: integer('loyalty_free_delivery_every').default(5),
  loyaltyFreeSoupEvery: integer('loyalty_free_soup_every').default(10),
  loyaltyFreeSoupName: text('loyalty_free_soup_name').default('Soupe basique'),
  logoText: text('logo_text').default('味').notNull(),
  logoUrl: text('logo_url'),
  address: text('address').notNull(),
  googleMapsUrl: text('google_maps_url'),
  phone: text('phone').notNull(),
  whatsappPhone: text('whatsapp_phone'),
  email: text('email').notNull(),
  openingHours: text('opening_hours').notNull(),
  deliveryFee: integer('delivery_fee').default(4000).notNull(),
  freeDeliveryThreshold: integer('free_delivery_threshold').default(50000).notNull(),
  freeDeliveryNotice: text('free_delivery_notice').default('Livraison offerte dès 50 000 Ar'),
  facebookUrl: text('facebook_url').default(''),
  instagramUrl: text('instagram_url').default(''),
  tiktokUrl: text('tiktok_url').default(''),
  whatsappUrl: text('whatsapp_url').default(''),
  currency: text('currency').default('Ar').notNull(),
  isOrderingEnabled: boolean('is_ordering_enabled').default(true).notNull(),
  // Mentions obligatoires Facture N° 8 Madagascar
  nifNumber: text('nif_number').default('3000845219'),
  statNumber: text('stat_number').default('56101 11 2021 0 10582'),
  rcsNumber: text('rcs_number').default('RCS Antananarivo 2021 B 00458'),
  invoiceNotice: text('invoice_notice').default('Merci de votre fidélité ! Bon appétit et à très bientôt !'),
  // Notifications de commandes (Email & Téléphone / WhatsApp)
  notificationEmail: text('notification_email').default('contact@saveursdasie.mg'),
  notificationPhone: text('notification_phone').default('+261342088899'),
  notifyEmailEnabled: boolean('notify_email_enabled').default(true),
  notifyWhatsappEnabled: boolean('notify_whatsapp_enabled').default(true),
  notifySoundEnabled: boolean('notify_sound_enabled').default(true),
  // Données dynamiques des slides hero et de la section chef
  slidesJson: jsonb('slides_json'),
  chefJson: jsonb('chef_json'),
  // Textes/images des sections d'accueil et garnitures de la soupe (modifiables par l'admin)
  homeJson: jsonb('home_json'),
  toppingsJson: jsonb('toppings_json'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Messages de contact & demandes de réservation
 */
export const contactMessages = pgTable('contact_messages', {
  id: text('id').primaryKey(), // ex: MSG-102
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  phone: text('phone'),
  subject: text('subject').notNull(),
  requestType: text('request_type').notNull().default('information'), // 'reservation' | 'order_special' | 'information' | 'other'
  reservationDate: text('reservation_date'),
  reservationTime: text('reservation_time'),
  guestsCount: integer('guests_count'),
  message: text('message').notNull(),
  status: text('status').default('new').notNull(), // 'new' | 'read' | 'treated'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Compteurs applicatifs persistants (numérotation des commandes, des messages...)
 * Évite de repartir de zéro à chaque redémarrage du serveur.
 */
export const appCounters = pgTable('app_counters', {
  key: text('key').primaryKey(), // ex: 'orderCounter', 'messageCounter'
  value: integer('value').notNull(),
});

/**
 * Comptes administrateur du back-office.
 * Le mot de passe n'est JAMAIS stocké en clair : uniquement son empreinte bcrypt.
 */
export const adminUsers = pgTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
