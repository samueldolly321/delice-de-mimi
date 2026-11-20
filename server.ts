import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { ProductBadge, Product, OrderItem, Customer } from './src/types';
import * as store from './src/db/store';
import {
  sendOrderNotifications,
  sendContactMessageNotification,
  sendTestNotification,
  getNotificationLogs,
} from './src/server/notifications';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crée le compte admin initial (à partir du .env) s'il n'en existe encore aucun en base.
  await store.ensureAdminBootstrap();

  // ===================== 1. SECURITY HEADERS & BODY LIMIT =====================
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Limit body size to prevent memory exhaustion / DoS payloads.
  // Les images sont importées en base64 (data URL) : une limite trop
  // basse rejette silencieusement les mises à jour de paramètres/plats.
  app.use(express.json({ limit: '25mb' }));

  // ===================== 2. RATE LIMITING MIDDLEWARE =====================
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  const rateLimit = (maxRequests: number, windowMs: number, customMessage?: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : '') || req.ip || req.socket.remoteAddress || 'client';
      const key = `${req.path}_${ip}`;
      const now = Date.now();
      const existing = rateLimitStore.get(key);

      if (!existing || now > existing.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (existing.count >= maxRequests) {
        return res.status(429).json({
          error: customMessage || 'Trop de requêtes. Veuillez patienter avant de réessayer.',
        });
      }

      existing.count++;
      next();
    };
  };

  // ===================== 2b. SESSIONS CLIENTS (jetons signés) =====================
  // Jeton remis à la connexion / inscription : « <base64url(idClient.expiration)>.<signature HMAC> ».
  // Sans état côté serveur : il reste valable après un redémarrage. La clé de
  // signature vient de CUSTOMER_TOKEN_SECRET, sinon elle est dérivée des secrets
  // du .env (impossible à deviner sans eux).
  const CUSTOMER_TOKEN_TTL_MS = 30 * 24 * 3600 * 1000; // 30 jours
  const customerTokenKey = crypto
    .createHash('sha256')
    .update('delice-mimi-session-client:' + (process.env.CUSTOMER_TOKEN_SECRET || process.env.DATABASE_URL || process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString('hex')))
    .digest();
  const signCustomerPayload = (payload: string) => crypto.createHmac('sha256', customerTokenKey).update(payload).digest('base64url');

  const createCustomerToken = (customerId: string): string => {
    const payload = Buffer.from(`${customerId}.${Date.now() + CUSTOMER_TOKEN_TTL_MS}`).toString('base64url');
    return `${payload}.${signCustomerPayload(payload)}`;
  };

  /** Renvoie l'identifiant du client si le jeton est authentique et non expiré. */
  const verifyCustomerToken = (token: unknown): string | null => {
    if (typeof token !== 'string' || token.length > 300) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = Buffer.from(signCustomerPayload(payload));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const dot = decoded.lastIndexOf('.');
    const customerId = decoded.slice(0, dot);
    const exp = Number(decoded.slice(dot + 1));
    if (!customerId || !Number.isFinite(exp) || exp < Date.now()) return null;
    return customerId;
  };

  const customerIdFromRequest = (req: Request) => verifyCustomerToken(req.headers['x-customer-token']);

  /** Réservé au client connecté, et uniquement pour son propre compte (:id). */
  const requireCustomerSelf = (req: Request, res: Response, next: NextFunction) => {
    const customerId = customerIdFromRequest(req);
    if (!customerId || customerId !== req.params.id) {
      return res.status(401).json({ success: false, sessionExpired: true, error: 'Votre session a expiré. Veuillez vous reconnecter.' });
    }
    next();
  };

  // ===================== 3. ADMIN AUTHENTICATION TOKENS =====================
  // Map token -> email de l'admin connecté (utile pour la route de changement de mot de passe)
  const validAdminTokens = new Map<string, string>();

  const requireAdminAuth = (req: Request & { adminEmail?: string }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Accès non autorisé : Jeton d\'authentification administrateur manquant.',
      });
    }

    const token = authHeader.split(' ')[1];
    const email = validAdminTokens.get(token);

    if (!email) {
      return res.status(403).json({
        error: 'Accès refusé : Session administrateur expirée ou invalide.',
      });
    }

    req.adminEmail = email;
    next();
  };

  // Wrapper pour propager proprement les erreurs des handlers async vers Express
  const asyncHandler =
    (fn: (req: Request, res: Response) => Promise<unknown>) =>
    (req: Request, res: Response) => {
      Promise.resolve(fn(req, res)).catch(err => {
        console.error(`[Erreur] ${req.method} ${req.path}:`, err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erreur serveur interne. Veuillez réessayer.' });
        }
      });
    };

  // ===================== 4. INPUT SANITIZATION UTILITIES =====================
  const sanitizeText = (val: unknown, maxLen = 300): string => {
    if (typeof val !== 'string') return '';
    return val
      .replace(/[<>]/g, '') // Strip brackets to eliminate HTML/script injection
      .trim()
      .slice(0, maxLen);
  };

  /**
   * Sanitisation dédiée aux images.
   * Accepte soit une URL http(s), soit une data URL base64 (import depuis le PC).
   * Ne tronque PAS et ne supprime pas les caractères < > (nécessaires aux SVG).
   */
  const sanitizeImage = (val: unknown, maxLen = 15_000_000): string => {
    if (typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (trimmed === '') return '';

    if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/i.test(trimmed)) {
      return trimmed.slice(0, maxLen);
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.replace(/[<>"]/g, '').slice(0, 2000);
    }
    if (/^\/[^/]/.test(trimmed)) {
      return trimmed.replace(/[<>"]/g, '').slice(0, 2000);
    }
    return '';
  };

  const validateBadge = (val: any): ProductBadge => {
    if (val === 'Populaire' || val === 'Nouveau' || val === 'Chef' || val === 'Promotion') return val;
    return null;
  };

  // Health check — indique aussi si la base PostgreSQL est réellement branchée
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), database: store.isDatabaseConnected() ? 'postgresql' : 'json-file-fallback' });
  });

  // ===================== PRODUCTS API =====================
  app.get('/api/products', asyncHandler(async (req: Request, res: Response) => {
    const { category, search, availableOnly } = req.query;
    const list = await store.getProducts({
      category: typeof category === 'string' ? category : undefined,
      search: typeof search === 'string' ? sanitizeText(search, 100) : undefined,
      availableOnly: availableOnly === 'true',
    });
    res.json(list);
  }));

  app.post('/api/products', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const body = req.body;
    const priceNum = typeof body.price === 'number' ? body.price : Number(body.price);
    const validPrice = !isNaN(priceNum) && priceNum >= 0 ? priceNum : 10000;

    const newProduct = await store.createProduct({
      name: sanitizeText(body.name, 120) || 'Nouveau Plat',
      description: sanitizeText(body.description, 1000) || '',
      price: validPrice,
      categoryId: sanitizeText(body.categoryId, 50) || 'cat-plats',
      categoryName: sanitizeText(body.categoryName, 80) || 'Plats',
      image: sanitizeImage(body.image) || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      badge: validateBadge(body.badge),
      promoNote: sanitizeText(body.promoNote, 100) || undefined,
      isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
      preparationTime: sanitizeText(body.preparationTime, 30) || '15 min',
      spiceLevel: typeof body.spiceLevel === 'number' && body.spiceLevel >= 0 && body.spiceLevel <= 3 ? body.spiceLevel : 0,
    });
    res.status(201).json(newProduct);
  }));

  app.put('/api/products/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body;
    const safeUpdates: Partial<Product> = {};
    if (body.name !== undefined) safeUpdates.name = sanitizeText(body.name, 120);
    if (body.description !== undefined) safeUpdates.description = sanitizeText(body.description, 1000);
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (!isNaN(p) && p >= 0) safeUpdates.price = p;
    }
    if (body.categoryId !== undefined) safeUpdates.categoryId = sanitizeText(body.categoryId, 50);
    if (body.categoryName !== undefined) safeUpdates.categoryName = sanitizeText(body.categoryName, 80);
    if (body.image !== undefined) {
      const img = sanitizeImage(body.image);
      if (img) safeUpdates.image = img;
    }
    if (body.badge !== undefined) safeUpdates.badge = validateBadge(body.badge);
    if (body.promoNote !== undefined) safeUpdates.promoNote = sanitizeText(body.promoNote, 100);
    if (body.isAvailable !== undefined) safeUpdates.isAvailable = Boolean(body.isAvailable);
    if (body.preparationTime !== undefined) safeUpdates.preparationTime = sanitizeText(body.preparationTime, 30);
    if (body.spiceLevel !== undefined) {
      const s = Number(body.spiceLevel);
      if (!isNaN(s) && s >= 0 && s <= 3) safeUpdates.spiceLevel = s as 0 | 1 | 2 | 3;
    }

    const updated = await store.updateProduct(id, safeUpdates);
    if (!updated) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(updated);
  }));

  app.delete('/api/products/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    await store.deleteProduct(req.params.id);
    res.json({ success: true, message: 'Produit supprimé' });
  }));

  // Remise à zéro complète du menu (supprime tous les plats).
  // Les catégories, commandes, clients et paramètres restent intacts.
  app.post('/api/admin/reset-products', requireAdminAuth, rateLimit(3, 60000, 'Trop de tentatives de réinitialisation. Veuillez patienter.'), asyncHandler(async (req: Request, res: Response) => {
    if (req.body?.confirm !== 'SUPPRIMER') {
      return res.status(400).json({ error: 'Confirmation requise. Veuillez confirmer cette action irréversible.' });
    }
    const count = await store.resetAllProducts();
    res.json({ success: true, deletedCount: count });
  }));

  // ===================== CATEGORIES API =====================
  app.get('/api/categories', asyncHandler(async (_req: Request, res: Response) => {
    res.json(await store.getCategories());
  }));

  app.post('/api/categories', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const rawName = sanitizeText(req.body.name, 80);
    if (!rawName) {
      return res.status(400).json({ error: 'Le nom de la catégorie est obligatoire' });
    }
    const slug = (sanitizeText(req.body.slug, 80) || rawName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await store.getCategories();
    const newCategory = await store.createCategory({
      id: sanitizeText(req.body.id, 50) || `cat-${Date.now()}`,
      name: rawName,
      slug: slug || `cat-${Date.now()}`,
      description: sanitizeText(req.body.description, 300) || '',
      order: typeof req.body.order === 'number' ? req.body.order : existing.length,
    });
    res.status(201).json(newCategory);
  }));

  app.put('/api/categories/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) updates.name = sanitizeText(req.body.name, 80);
    if (req.body.slug !== undefined) updates.slug = sanitizeText(req.body.slug, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    if (req.body.description !== undefined) updates.description = sanitizeText(req.body.description, 300);
    if (typeof req.body.order === 'number') updates.order = req.body.order;

    const updated = await store.updateCategory(id, updates);
    if (!updated) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json(updated);
  }));

  app.delete('/api/categories/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (id === 'cat-all' || id === 'all') {
      return res.status(400).json({ error: 'Impossible de supprimer la catégorie principale Tous' });
    }
    const result = await store.deleteCategory(id);
    res.json({ success: true, reallocatedTo: result?.reallocatedTo });
  }));

  // ===================== ORDERS API =====================
  app.get('/api/orders', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { status, search } = req.query;
    const list = await store.getOrders({
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? sanitizeText(search, 100) : undefined,
    });
    res.json(list);
  }));

  app.get('/api/orders/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const order = await store.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  }));

  // Public: Order placement with rate limiting & sanitization
  app.post('/api/orders', rateLimit(25, 60000, 'Trop de commandes passées récemment. Veuillez patienter.'), asyncHandler(async (req: Request, res: Response) => {
    const { customer, items, deliveryType, paymentMethod, subtotal, deliveryFee, total, customerId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Le panier ne peut pas être vide.' });
    }
    if (!customer || !customer.fullName || (!customer.phone && !customer.email)) {
      return res.status(400).json({ error: 'Données de commande incomplètes (Nom et téléphone ou email requis)' });
    }

    const safeCustomer = {
      fullName: sanitizeText(customer.fullName, 100),
      phone: sanitizeText(customer.phone, 30),
      email: sanitizeText(customer.email, 100),
      address: sanitizeText(customer.address, 200),
      district: sanitizeText(customer.district, 80),
      // Le formulaire de commande envoie « instructions » (« notes » gardé pour compatibilité).
      instructions: sanitizeText(customer.instructions ?? customer.notes, 500),
    };

    const safeItems: OrderItem[] = items.map((it: any) => ({
      productId: sanitizeText(it.productId || it.product?.id, 50) || `prod-${Date.now()}`,
      name: sanitizeText(it.name || it.product?.name, 120) || 'Plat',
      price: typeof it.price === 'number' && it.price >= 0 ? it.price : (typeof it.product?.price === 'number' && it.product.price >= 0 ? it.product.price : 0),
      quantity: typeof it.quantity === 'number' && it.quantity > 0 ? Math.min(it.quantity, 100) : 1,
      image: sanitizeText(it.image || it.product?.image, 500) || undefined,
      toppings: Array.isArray(it.toppings) ? it.toppings.map((t: any) => sanitizeText(t, 50)) : undefined,
    }));

    const settings = await store.getSettings();
    const safeSubtotal = typeof subtotal === 'number' && subtotal >= 0 ? subtotal : 0;
    const safeDeliveryFee = typeof deliveryFee === 'number' && deliveryFee >= 0 ? deliveryFee : settings.deliveryFee;
    // Le total est recalculé côté serveur (jamais repris tel quel du client) ;
    // le programme de fidélité (livraison/soupe offertes) est ensuite appliqué
    // par store.createOrder lui-même, à partir du nombre réel de commandes du client.
    const safeTotal = safeSubtotal + safeDeliveryFee;

    const newOrder = await store.createOrder({
      customer: safeCustomer,
      items: safeItems,
      subtotal: safeSubtotal,
      deliveryFee: safeDeliveryFee,
      total: safeTotal,
      deliveryType: deliveryType === 'takeaway' ? 'takeaway' : 'delivery',
      paymentMethod: paymentMethod === 'orange_money' || paymentMethod === 'mvola' ? paymentMethod : 'cash_on_delivery',
      // Rattachement à un compte par identifiant : seulement avec une session valide
      // (sinon, rattachement par téléphone / email comme avant).
      requestedCustomerId: (() => {
        const sessionId = customerIdFromRequest(req);
        return sessionId && (!customerId || sessionId === customerId) ? sessionId : undefined;
      })(),
    });

    let notifResult: Awaited<ReturnType<typeof sendOrderNotifications>> | null = null;
    try {
      notifResult = await sendOrderNotifications(newOrder, settings);
    } catch (notifErr) {
      console.error("[Notification] Erreur lors de l'envoi de la notification de commande:", notifErr);
    }

    res.status(201).json({
      ...newOrder,
      notification: notifResult
        ? {
            emailStatus: notifResult.emailStatus,
            phoneStatus: notifResult.phoneStatus,
            whatsappUrl: notifResult.whatsappUrl,
            recipientEmail: notifResult.emailRecipient,
            recipientPhone: notifResult.phoneRecipient,
          }
        : undefined,
    });
  }));

  app.put('/api/orders/:id/status', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const updated = await store.updateOrderStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(updated);
  }));

  app.put('/api/orders/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const updated = await store.updateOrder(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(updated);
  }));

  // ===================== CUSTOMER AUTH & PROFILE API =====================
  app.post('/api/customer/login', rateLimit(15, 60000, 'Trop de tentatives de connexion client.'), asyncHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre numéro de téléphone ou votre adresse email.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre mot de passe (au moins 6 caractères).' });
    }

    const exists = await store.findCustomerByIdentifier(identifier);
    if (!exists) {
      return res.status(404).json({
        success: false,
        notFound: true,
        error: 'Aucun compte trouvé avec cet identifiant. Veuillez créer votre profil client pour commander.',
      });
    }

    const result = await store.verifyOrSetCustomerPassword(identifier, password);
    if (!result || result.wrongPassword) {
      return res.status(401).json({ success: false, error: 'Mot de passe incorrect.' });
    }

    const customerOrders = await store.getCustomerOrders(result.customer.id);
    res.json({ success: true, customer: result.customer, orders: customerOrders, token: createCustomerToken(result.customer.id) });
  }));

  app.post('/api/customer/register', rateLimit(10, 60000, 'Trop de créations de comptes.'), asyncHandler(async (req: Request, res: Response) => {
    const { fullName, phone, email, address, district, password, securityQuestion, securityAnswer } = req.body;
    const safeName = sanitizeText(fullName, 100);
    const safePhone = sanitizeText(phone, 30);
    const safeEmail = sanitizeText(email, 100);
    const safeAddress = sanitizeText(address, 200);
    const safeDistrict = sanitizeText(district, 80);
    const safeQuestion = sanitizeText(securityQuestion, 150);
    const safeAnswer = sanitizeText(securityAnswer, 100);

    if (!safeName) return res.status(400).json({ success: false, error: 'Veuillez renseigner votre nom complet.' });
    if (!safePhone && !safeEmail) return res.status(400).json({ success: false, error: 'Veuillez renseigner au moins un numéro de téléphone ou une adresse email.' });
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Veuillez choisir un mot de passe d\'au moins 6 caractères.' });
    }
    if (!safeQuestion || !safeAnswer) {
      return res.status(400).json({ success: false, error: 'Veuillez choisir une question de sécurité et y répondre (pour la récupération de mot de passe).' });
    }

    if (safePhone && (await store.findCustomerByIdentifier(safePhone))) {
      return res.status(409).json({ success: false, error: 'Un compte avec ce numéro de téléphone existe déjà. Veuillez vous connecter.' });
    }
    if (safeEmail && (await store.findCustomerByIdentifier(safeEmail))) {
      return res.status(409).json({ success: false, error: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.' });
    }

    const newCustomer = await store.createCustomer({
      fullName: safeName,
      phone: safePhone,
      email: safeEmail,
      address: safeAddress,
      district: safeDistrict || 'Antanimena',
      orderCount: 0,
      totalSpent: 0,
      lastOrderDate: 'Aucune commande',
      registeredAt: new Date().toISOString().split('T')[0],
    });

    const passwordHash = await bcrypt.hash(String(password), 12);
    await store.setCustomerPasswordHash(newCustomer.id, passwordHash);

    const answerHash = await bcrypt.hash(safeAnswer.trim().toLowerCase(), 12);
    await store.setCustomerSecurityQA(newCustomer.id, safeQuestion, answerHash);

    res.status(201).json({ success: true, customer: newCustomer, orders: [], token: createCustomerToken(newCustomer.id) });
  }));

  // Étape 1 : récupérer la question de sécurité (sans jamais révéler la réponse)
  app.post('/api/customer/forgot-password/question', rateLimit(10, 60000, 'Trop de tentatives. Veuillez patienter.'), asyncHandler(async (req: Request, res: Response) => {
    const { identifier } = req.body;
    if (!identifier || !String(identifier).trim()) {
      return res.status(400).json({ success: false, error: 'Veuillez saisir votre numéro de téléphone ou votre adresse email.' });
    }
    const result = await store.getCustomerSecurityQuestion(identifier);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Aucun compte trouvé avec cet identifiant, ou aucune question de sécurité n\'y est définie. Contactez le restaurant directement.' });
    }
    res.json({ success: true, question: result.question });
  }));

  // Étape 2 : vérifier la réponse et définir un nouveau mot de passe
  app.post('/api/customer/forgot-password/reset', rateLimit(8, 60000, 'Trop de tentatives. Veuillez patienter.'), asyncHandler(async (req: Request, res: Response) => {
    const { identifier, answer, newPassword } = req.body;
    if (!identifier || !answer) {
      return res.status(400).json({ success: false, error: 'Veuillez répondre à la question de sécurité.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }
    const result = await store.resetCustomerPasswordWithSecurityAnswer(identifier, String(answer), String(newPassword));
    if (!result.success) {
      return res.status(401).json({ success: false, error: result.error || 'Réponse incorrecte.' });
    }
    res.json({ success: true });
  }));

  app.put('/api/customer/profile/:id', requireCustomerSelf, asyncHandler(async (req: Request, res: Response) => {
    const updates: Partial<Customer> = {};
    if (req.body.fullName) updates.fullName = sanitizeText(req.body.fullName, 100);
    if (req.body.phone) updates.phone = sanitizeText(req.body.phone, 30);
    if (req.body.email) updates.email = sanitizeText(req.body.email, 100);
    if (req.body.address) updates.address = sanitizeText(req.body.address, 200);
    if (req.body.district) updates.district = sanitizeText(req.body.district, 80);

    const updated = await store.updateCustomerProfile(req.params.id, updates);
    if (!updated) return res.status(404).json({ success: false, error: 'Profil client introuvable' });
    res.json({ success: true, customer: updated });
  }));

  app.get('/api/customer/:id/orders', requireCustomerSelf, asyncHandler(async (req: Request, res: Response) => {
    const cust = await store.getCustomerById(req.params.id);
    if (!cust) return res.status(404).json({ error: 'Client introuvable' });
    res.json(await store.getCustomerOrders(req.params.id));
  }));

  // ===================== AUTH API =====================
  app.post('/api/auth/login', rateLimit(10, 60000, 'Trop de tentatives de connexion administrateur. Veuillez patienter une minute.'), asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const submittedEmail = (email || '').trim().toLowerCase();

    if (!submittedEmail || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis.' });
    }

    const verified = await store.verifyAdminPassword(submittedEmail, password);
    if (!verified) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides.' });
    }

    const token = `adm_${crypto.randomBytes(24).toString('hex')}`;
    validAdminTokens.set(token, verified.email);
    return res.json({ success: true, token, user: { email: verified.email, role: 'SuperAdmin' } });
  }));

  app.put('/api/admin/password', requireAdminAuth, rateLimit(5, 60000, 'Trop de tentatives. Veuillez patienter.'), asyncHandler(async (req: Request & { adminEmail?: string }, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Mot de passe actuel et nouveau mot de passe requis.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
    }

    const changed = await store.changeAdminPassword(req.adminEmail!, currentPassword, newPassword);
    if (!changed) {
      return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect.' });
    }
    res.json({ success: true });
  }));

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      validAdminTokens.delete(authHeader.split(' ')[1]);
    }
    res.json({ success: true });
  });

  // ===================== CUSTOMERS API (PROTECTED) =====================
  app.get('/api/customers', requireAdminAuth, asyncHandler(async (_req: Request, res: Response) => {
    res.json(await store.getCustomers());
  }));

  app.get('/api/customers/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const cust = await store.getCustomerById(req.params.id);
    if (!cust) return res.status(404).json({ error: 'Client non trouvé' });
    res.json(cust);
  }));

  // ===================== SETTINGS API =====================
  app.get('/api/settings', asyncHandler(async (_req: Request, res: Response) => {
    res.json(await store.getSettings());
  }));

  app.put('/api/settings', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const b = req.body;
    const safeUpdates: Record<string, unknown> = {};

    if (b.name !== undefined) safeUpdates.name = sanitizeText(b.name, 100);
    if (b.tagline !== undefined) safeUpdates.tagline = sanitizeText(b.tagline, 200);
    if (b.description !== undefined) safeUpdates.description = sanitizeText(b.description, 1000);
    if (b.topBarText !== undefined) safeUpdates.topBarText = sanitizeText(b.topBarText, 150);
    if (b.footerTagline !== undefined) safeUpdates.footerTagline = sanitizeText(b.footerTagline, 150);
    if (b.footerCopyrightSuffix !== undefined) safeUpdates.footerCopyrightSuffix = sanitizeText(b.footerCopyrightSuffix, 150);
    if (b.loyaltyEnabled !== undefined) safeUpdates.loyaltyEnabled = Boolean(b.loyaltyEnabled);
    if (b.loyaltyFreeDeliveryEvery !== undefined) {
      const n = Number(b.loyaltyFreeDeliveryEvery);
      if (!isNaN(n) && n >= 2 && n <= 100) safeUpdates.loyaltyFreeDeliveryEvery = Math.round(n);
    }
    if (b.loyaltyFreeSoupEvery !== undefined) {
      const n = Number(b.loyaltyFreeSoupEvery);
      if (!isNaN(n) && n >= 2 && n <= 100) safeUpdates.loyaltyFreeSoupEvery = Math.round(n);
    }
    if (b.loyaltyFreeSoupName !== undefined) safeUpdates.loyaltyFreeSoupName = sanitizeText(b.loyaltyFreeSoupName, 80);
    if (b.logoText !== undefined) safeUpdates.logoText = sanitizeText(b.logoText, 20);
    if (b.logoUrl !== undefined) safeUpdates.logoUrl = sanitizeImage(b.logoUrl);
    if (b.address !== undefined) safeUpdates.address = sanitizeText(b.address, 200);
    if (b.googleMapsUrl !== undefined) safeUpdates.googleMapsUrl = sanitizeText(b.googleMapsUrl, 500);
    if (b.phone !== undefined) safeUpdates.phone = sanitizeText(b.phone, 50);
    if (b.whatsappPhone !== undefined) safeUpdates.whatsappPhone = sanitizeText(b.whatsappPhone, 50);
    if (b.email !== undefined) safeUpdates.email = sanitizeText(b.email, 100);
    if (b.openingHours !== undefined) safeUpdates.openingHours = sanitizeText(b.openingHours, 150);
    if (b.deliveryFee !== undefined) {
      const df = Number(b.deliveryFee);
      if (!isNaN(df) && df >= 0) safeUpdates.deliveryFee = df;
    }
    if (b.freeDeliveryThreshold !== undefined) {
      const fdt = Number(b.freeDeliveryThreshold);
      if (!isNaN(fdt) && fdt >= 0) safeUpdates.freeDeliveryThreshold = fdt;
    }
    if (b.freeDeliveryNotice !== undefined) safeUpdates.freeDeliveryNotice = sanitizeText(b.freeDeliveryNotice, 200);
    if (b.facebookUrl !== undefined) safeUpdates.facebookUrl = sanitizeText(b.facebookUrl, 500);
    if (b.instagramUrl !== undefined) safeUpdates.instagramUrl = sanitizeText(b.instagramUrl, 500);
    if (b.tiktokUrl !== undefined) safeUpdates.tiktokUrl = sanitizeText(b.tiktokUrl, 500);
    if (b.whatsappUrl !== undefined) safeUpdates.whatsappUrl = sanitizeText(b.whatsappUrl, 500);
    if (b.currency !== undefined) safeUpdates.currency = sanitizeText(b.currency, 10);
    if (b.isOrderingEnabled !== undefined) safeUpdates.isOrderingEnabled = Boolean(b.isOrderingEnabled);
    if (b.nifNumber !== undefined) safeUpdates.nifNumber = sanitizeText(b.nifNumber, 50);
    if (b.statNumber !== undefined) safeUpdates.statNumber = sanitizeText(b.statNumber, 50);
    if (b.rcsNumber !== undefined) safeUpdates.rcsNumber = sanitizeText(b.rcsNumber, 50);
    if (b.invoiceNotice !== undefined) safeUpdates.invoiceNotice = sanitizeText(b.invoiceNotice, 300);
    if (b.notificationEmail !== undefined) safeUpdates.notificationEmail = sanitizeText(b.notificationEmail, 100);
    if (b.notificationPhone !== undefined) safeUpdates.notificationPhone = sanitizeText(b.notificationPhone, 50);
    if (b.notifyEmailEnabled !== undefined) safeUpdates.notifyEmailEnabled = Boolean(b.notifyEmailEnabled);
    if (b.notifyWhatsappEnabled !== undefined) safeUpdates.notifyWhatsappEnabled = Boolean(b.notifyWhatsappEnabled);
    if (b.notifySoundEnabled !== undefined) safeUpdates.notifySoundEnabled = Boolean(b.notifySoundEnabled);
    if (Array.isArray(b.slides)) safeUpdates.slides = b.slides;
    if (b.chef && typeof b.chef === 'object') safeUpdates.chef = b.chef;

    const updated = await store.updateSettings(safeUpdates);
    res.json(updated);
  }));

  app.post('/api/admin/test-notification', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { type, target } = req.body;
    if (!type || (type !== 'email' && type !== 'whatsapp' && type !== 'sms')) {
      return res.status(400).json({ error: 'Type de notification invalide (email, whatsapp ou sms requis)' });
    }
    const settings = await store.getSettings();
    const destination = target || (type === 'email' ? settings.notificationEmail : settings.notificationPhone);
    if (!destination) {
      return res.status(400).json({ error: 'Veuillez préciser une adresse email ou un numéro de téléphone cible.' });
    }
    try {
      const result = await sendTestNotification(type, destination, settings);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Erreur lors du test de notification' });
    }
  }));

  app.get('/api/admin/notifications-history', requireAdminAuth, (_req: Request, res: Response) => {
    res.json(getNotificationLogs());
  });

  // ===================== CONTACT & MESSAGES API =====================
  app.get('/api/messages', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const { status, type, search } = req.query;
    const list = await store.getMessages({
      status: typeof status === 'string' ? status : undefined,
      type: typeof type === 'string' ? type : undefined,
      search: typeof search === 'string' ? sanitizeText(search, 100) : undefined,
    });
    res.json(list);
  }));

  const handleCreateMessage = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, phone, subject, message, requestType, reservationDate, reservationTime, guestsCount } = req.body;

    const safeName = sanitizeText(name, 100);
    const safeEmail = sanitizeText(email, 100);
    const safePhone = sanitizeText(phone, 30);
    const safeSubject = sanitizeText(subject, 150);
    const safeMessage = sanitizeText(message, 3000);

    if (!safeName) return res.status(400).json({ error: 'Le nom complet est obligatoire' });
    if (!safeEmail && !safePhone) return res.status(400).json({ error: 'Veuillez renseigner au moins un numéro de téléphone ou un email' });
    if (!safeMessage) return res.status(400).json({ error: 'Le message est obligatoire' });

    const newMsg = await store.createMessage({
      name: safeName,
      email: safeEmail,
      phone: safePhone,
      subject: safeSubject || 'Demande de contact',
      requestType: requestType === 'reservation' || requestType === 'order_special' || requestType === 'other' ? requestType : (safeSubject.toLowerCase().includes('réservation') ? 'reservation' : 'information'),
      reservationDate: reservationDate ? sanitizeText(reservationDate, 30) : undefined,
      reservationTime: reservationTime ? sanitizeText(reservationTime, 20) : undefined,
      guestsCount: guestsCount && !isNaN(Number(guestsCount)) ? Math.min(Math.max(Number(guestsCount), 1), 200) : undefined,
      message: safeMessage,
    });

    try {
      const settings = await store.getSettings();
      await sendContactMessageNotification(newMsg, settings);
    } catch (notifErr) {
      console.error("[Notification] Erreur lors de l'envoi de la notification de message:", notifErr);
    }

    res.status(201).json(newMsg);
  });

  const messageRateLimiter = rateLimit(12, 60000, "Trop de messages envoyés. Veuillez patienter avant d'envoyer un nouveau message.");
  app.post('/api/messages', messageRateLimiter, handleCreateMessage);
  app.post('/api/contact', messageRateLimiter, handleCreateMessage);

  app.put('/api/messages/:id/status', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const updated = await store.updateMessageStatus(req.params.id, req.body.status);
    if (!updated) return res.status(404).json({ error: 'Message non trouvé' });
    res.json(updated);
  }));

  app.put('/api/messages/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    const updated = await store.updateMessage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Message non trouvé' });
    res.json(updated);
  }));

  app.delete('/api/messages/:id', requireAdminAuth, asyncHandler(async (req: Request, res: Response) => {
    await store.deleteMessage(req.params.id);
    res.json({ success: true, message: 'Message supprimé' });
  }));

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Delice Mimi server running on http://localhost:${PORT}`);
  });
}

startServer();
