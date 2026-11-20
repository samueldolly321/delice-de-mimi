import { getDb, schema } from './index';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_SETTINGS,
} from '../data/seedData';

async function seed() {
  console.log('🌱 Début de l’initialisation de la base de données PostgreSQL...');

  const db = getDb();
  if (!db) {
    console.error('❌ Impossible de se connecter à PostgreSQL. Vérifiez votre variable DATABASE_URL dans .env');
    process.exit(1);
  }

  try {
    // 1. Catégories
    console.log('📦 Insertion des catégories...');
    for (const cat of INITIAL_CATEGORIES) {
      if (cat.id === 'cat-all') continue;
      await db
        .insert(schema.categories)
        .values({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          sortOrder: cat.order,
        })
        // Ne remplit que si la catégorie n'existe pas encore — ne jamais
        // écraser une catégorie déjà créée ou modifiée depuis l'admin.
        .onConflictDoNothing({ target: schema.categories.id });
    }

    // 2. Produits
    console.log('🍜 Insertion des plats et produits...');
    for (const prod of INITIAL_PRODUCTS) {
      await db
        .insert(schema.products)
        .values({
          id: prod.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          categoryId: prod.categoryId,
          categoryName: prod.categoryName,
          image: prod.image,
          badge: prod.badge || null,
          isAvailable: prod.isAvailable,
          preparationTime: prod.preparationTime || '15 min',
          spiceLevel: prod.spiceLevel || 0,
        })
        // Idem : un plat déjà présent (prix ou photo modifiés en admin)
        // ne doit jamais être réinitialisé par un nouveau seed.
        .onConflictDoNothing({ target: schema.products.id });
    }

    // 3. Clients
    console.log('👥 Insertion des clients...');
    for (const cust of INITIAL_CUSTOMERS) {
      await db
        .insert(schema.customers)
        .values({
          id: cust.id,
          fullName: cust.fullName,
          phone: cust.phone,
          email: cust.email || '',
          address: cust.address,
          district: cust.district || 'Antananarivo',
          orderCount: cust.orderCount,
          totalSpent: cust.totalSpent,
          lastOrderDate: new Date(),
        })
        .onConflictDoNothing({ target: schema.customers.id });
    }

    // 4. Commandes
    console.log('🧾 Insertion des commandes initiales...');
    for (const order of INITIAL_ORDERS) {
      await db
        .insert(schema.orders)
        .values({
          id: order.id,
          customerId: order.customerId || null,
          customerName: order.customer.fullName,
          customerPhone: order.customer.phone,
          customerEmail: order.customer.email,
          customerAddress: order.customer.address,
          customerDistrict: order.customer.district || 'Antananarivo',
          customerInstructions: order.customer.instructions || '',
          itemsJson: order.items as any,
          subtotal: order.subtotal,
          deliveryFee: order.deliveryFee,
          total: order.total,
          deliveryType: order.deliveryType,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: new Date(order.createdAt),
          estimatedDelivery: order.estimatedDelivery || '',
        })
        .onConflictDoNothing({ target: schema.orders.id });
    }

    // 5. Paramètres du restaurant
    console.log('⚙️ Insertion des paramètres et de la Facturation N°8...');
    await db
      .insert(schema.restaurantSettings)
      .values({
        id: 'default',
        name: INITIAL_SETTINGS.name,
        tagline: INITIAL_SETTINGS.tagline,
        description: INITIAL_SETTINGS.description,
        logoText: INITIAL_SETTINGS.logoText,
        logoUrl: INITIAL_SETTINGS.logoUrl || null,
        address: INITIAL_SETTINGS.address,
        phone: INITIAL_SETTINGS.phone,
        whatsappPhone: INITIAL_SETTINGS.whatsappPhone || null,
        email: INITIAL_SETTINGS.email,
        openingHours: INITIAL_SETTINGS.openingHours,
        deliveryFee: INITIAL_SETTINGS.deliveryFee,
        freeDeliveryThreshold: INITIAL_SETTINGS.freeDeliveryThreshold,
        freeDeliveryNotice: INITIAL_SETTINGS.freeDeliveryNotice || 'Livraison offerte dès 50 000 Ar',
        facebookUrl: INITIAL_SETTINGS.facebookUrl,
        instagramUrl: INITIAL_SETTINGS.instagramUrl,
        tiktokUrl: INITIAL_SETTINGS.tiktokUrl,
        whatsappUrl: INITIAL_SETTINGS.whatsappUrl || null,
        currency: INITIAL_SETTINGS.currency,
        isOrderingEnabled: INITIAL_SETTINGS.isOrderingEnabled,
        nifNumber: INITIAL_SETTINGS.nifNumber || '3000845219',
        statNumber: INITIAL_SETTINGS.statNumber || '56101 11 2021 0 10582',
        rcsNumber: INITIAL_SETTINGS.rcsNumber || 'RCS Antananarivo 2021 B 00458',
        invoiceNotice: INITIAL_SETTINGS.invoiceNotice || 'Merci de votre fidélité ! Bon appétit et à très bientôt !',
        slidesJson: INITIAL_SETTINGS.slides as any,
        chefJson: INITIAL_SETTINGS.chef as any,
      })
      // Un "seed" remplit une base VIDE — il ne doit jamais écraser une
      // configuration déjà personnalisée depuis l'administration.
      // Si la ligne 'default' existe déjà, on ne touche à rien.
      .onConflictDoNothing({ target: schema.restaurantSettings.id });

    console.log('✅ Base de données PostgreSQL initialisée avec succès avec Drizzle ORM !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l’initialisation de la base de données :', error);
    process.exit(1);
  }
}

seed();
