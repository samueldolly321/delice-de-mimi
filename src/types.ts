export type OrderStatus = 
  | 'Nouvelle' 
  | 'Confirmée' 
  | 'En préparation' 
  | 'Prête' 
  | 'En livraison' 
  | 'Livrée' 
  | 'Annulée';

/** Identifiant d'étiquette : Populaire, Nouveau, Chef, Promotion ou une étiquette créée dans l'admin. */
export type ProductBadge = string | null;

/** Étiquette de plat (modifiable dans Réglages → Étiquettes). */
export interface BadgeDef {
  id: string;
  label: string;
  /** Couleur de fond (#rrggbb). */
  bg: string;
  /** Couleur du texte (#rrggbb). */
  color: string;
  /** Afficher un onglet de filtre dans la carte. */
  filter: boolean;
  /** Nom de l'onglet (vide = nom de l'étiquette). */
  filterLabel?: string;
}

export type FeaturedImageFit = 'cover' | 'contain';
export type FeaturedImageRatio = '1-1' | '4-3' | '3-2' | '16-9' | '3-4' | '4-5';
export type FeaturedImageFocus = 'center' | 'top' | 'bottom' | 'left' | 'right';

/** Bloc « Notre coup de cœur » : un plat mis en avant au-dessus de la carte. */
export interface FeaturedSettings {
  enabled?: boolean;
  /** Plat mis en avant ('' = choix automatique : Spécialité du chef, sinon Populaire). */
  productId?: string;
  sectionTitle?: string;
  sectionIntro?: string;
  label?: string;
  badge?: string;
  /** Vide = nom du plat. */
  title?: string;
  /** Vide = description du plat. */
  text?: string;
  /** Points forts, un par ligne. */
  highlights?: string;
  /** Vide = photo du plat. */
  image?: string;
  imageFit?: FeaturedImageFit;
  imageRatio?: FeaturedImageRatio;
  imageFocus?: FeaturedImageFocus;
  /** Ancien prix barré (0 = aucun). */
  oldPrice?: number;
  showPrice?: boolean;
  showMeta?: boolean;
  /** Vide = « Ajouter au panier » (ou « Composer ma soupe »). */
  button?: string;
  button2?: string;
  imageSide?: 'left' | 'right';
  background?: 'white' | 'paper' | 'dark';
}

export interface SoupTopping {
  id: string;
  name: string;
  price: number;
  icon?: string;
  image?: string;
  description?: string;
  /** false = garniture masquée et refusée à la commande (rupture de stock). */
  isAvailable?: boolean;
}

/** Icônes proposées pour les engagements de la page d'accueil. */
export type ServiceIconName = 'leaf' | 'chef' | 'soup' | 'bike' | 'clock' | 'heart' | 'star' | 'utensils' | 'award' | 'phone';

export interface HomeServiceItem {
  icon: ServiceIconName;
  title: string;
  text: string;
}

/**
 * Textes et images de la page d'accueil modifiables depuis l'administration.
 * Tout champ vide reprend la valeur par défaut (DEFAULT_HOME_CONTENT).
 */
export interface HomeContent {
  // Section « Notre maison »
  aboutTitle?: string;
  aboutLabel?: string;
  aboutButton?: string;
  philosophyLabel?: string;
  philosophyImage?: string;
  // Bandeau soupe (3 panneaux)
  soupBandTitle?: string;
  soupBandText?: string;
  soupBandButton?: string;
  soupBandImageLeft?: string;
  soupBandImageCenter?: string;
  soupBandImageRight?: string;
  // Section carte
  menuTitle?: string;
  menuSubtitle?: string;
  // Section engagements
  servicesTitle?: string;
  servicesIntro?: string;
  services?: HomeServiceItem[];
  // Section contact
  contactTitle?: string;
  contactIntro?: string;
  /** Afficher la carte Google Maps dans la section Contact (vrai par défaut). */
  mapShow?: boolean;
  /** Code « Intégrer une carte » de Google Maps (ou son adresse src). Vide = carte d'après l'adresse. */
  mapEmbed?: string;
  /** Bloc « Notre coup de cœur ». */
  featured?: FeaturedSettings;
  /** Étiquettes des plats (vide = étiquettes d'origine). */
  badges?: BadgeDef[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in Ariary (Ar)
  categoryId: string;
  categoryName: string;
  image: string;
  badge?: ProductBadge;
  promoNote?: string;
  isAvailable: boolean;
  isCustomizable?: boolean;
  preparationTime?: string;
  spiceLevel?: number; // 0 to 3
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  toppings?: string[];
}

export interface CustomerInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  instructions?: string;
}

export type DeliveryType = 'delivery' | 'takeaway' | 'pickup';
export type PaymentMethod = 'cash_on_delivery' | 'pay_on_site' | 'mobile_money';

export interface Order {
  id: string; // e.g. "CMD-1024"
  customerId?: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery?: string;
  /** Récompense fidélité appliquée automatiquement à cette commande, le cas échéant. */
  loyaltyReward?: 'free_delivery' | 'free_soup' | 'free_delivery_and_soup';
  notification?: {
    emailStatus?: 'sent' | 'simulated' | 'failed' | 'disabled';
    phoneStatus?: 'sent' | 'ready' | 'failed' | 'disabled';
    whatsappUrl?: string;
    recipientEmail?: string;
    recipientPhone?: string;
  };
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  district?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  registeredAt?: string;
}

export interface HeroSlide {
  id: number;
  title?: string;
  tag?: string;
  badgeText?: string;
  titlePrefix?: string;
  titleHighlight?: string;
  description: string;
  dishName?: string;
  dishPrice?: string;
  image: string;
  imageAlt?: string;
  actionText: string;
  actionTarget?: 'customizer' | 'menu';
}

export interface ChefInfo {
  name: string;
  title: string;
  subtitle: string;
  badge: string;
  imageUrl: string;
  storyTitle: string;
  storyText: string;
  philosophyQuote: string;
  philosophyAuthor: string;
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
}

export interface RestaurantSettings {
  name: string;
  tagline: string;
  description: string;
  topBarText?: string;
  footerTagline?: string;
  footerCopyrightSuffix?: string;
  // Programme de fidélité
  loyaltyEnabled?: boolean;
  loyaltyFreeDeliveryEvery?: number; // ex: 5 → livraison offerte toutes les 5 commandes
  loyaltyFreeSoupEvery?: number; // ex: 10 → soupe basique offerte toutes les 10 commandes
  loyaltyFreeSoupName?: string;
  logoText: string;
  logoUrl?: string;
  address: string;
  googleMapsUrl?: string;
  phone: string;
  whatsappPhone?: string;
  email: string;
  openingHours: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  freeDeliveryNotice?: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  whatsappUrl?: string;
  currency: string;
  isOrderingEnabled: boolean;
  // Paramètres Facturation N° 8
  nifNumber?: string;
  statNumber?: string;
  rcsNumber?: string;
  invoiceNotice?: string;
  // Sliders & Histoire du Chef
  slides?: HeroSlide[];
  /** Textes et images des sections de la page d'accueil. */
  home?: HomeContent;
  /** Garnitures de la soupe personnalisable (noms, prix, photos). */
  soupToppings?: SoupTopping[];
  chef?: ChefInfo;
  // Notifications de commandes (Email & Téléphone / WhatsApp)
  notificationEmail?: string;
  notificationPhone?: string;
  notifyEmailEnabled?: boolean;
  notifyWhatsappEnabled?: boolean;
  notifySoundEnabled?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedToppings?: SoupTopping[];
  unitPrice?: number;
  customNotes?: string;
}

export type MessageRequestType = 'reservation' | 'order_special' | 'information' | 'other';
export type MessageStatus = 'new' | 'read' | 'treated';

export interface ContactMessage {
  id: string; // e.g. "MSG-101"
  name: string;
  email: string;
  phone?: string;
  subject: string;
  requestType: MessageRequestType;
  reservationDate?: string;
  reservationTime?: string;
  guestsCount?: number;
  message: string;
  status: MessageStatus;
  createdAt: string;
}
