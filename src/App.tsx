import React, { useState, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ChefSection } from './components/ChefSection';
import { MenuSection } from './components/MenuSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';
import { CustomerProfileModal } from './components/auth/CustomerProfileModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminErrorToast } from './components/admin/AdminErrorToast';
import { api } from './services/api';

function MainLayout() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [isSoupCustomizerOpen, setIsSoupCustomizerOpen] = useState(false);
  const { formatPrice, settings } = useCart();

  // Synchronise le titre, la meta description, l'URL canonique et les
  // données structurées (JSON-LD) avec les vrais paramètres du restaurant.
  // Sans ça, Google indexerait le nom/l'adresse par défaut codés dans
  // index.html plutôt que les informations réellement à jour.
  useEffect(() => {
    if (!settings?.name) return;

    document.title = `${settings.name} — Restaurant Asiatique à Antananarivo | Livraison & Commande en ligne`;

    const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (metaDesc) metaDesc.content = settings.description || `${settings.name} : restaurant asiatique à Antananarivo. Commande en ligne et livraison rapide.`;

    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${settings.name} — Restaurant Asiatique à Antananarivo`;

    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = settings.description || '';

    let canonical = document.querySelector<HTMLLinkElement>('link#canonical-link');
    if (canonical) canonical.href = window.location.origin + '/';

    const jsonLd = document.querySelector<HTMLScriptElement>('script#restaurant-jsonld');
    if (jsonLd) {
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Restaurant',
        name: settings.name,
        servesCuisine: 'Asiatique',
        priceRange: '$$',
        telephone: settings.phone || undefined,
        email: settings.email || undefined,
        image: settings.logoUrl || undefined,
        url: window.location.origin + '/',
        address: {
          '@type': 'PostalAddress',
          streetAddress: settings.address || undefined,
          addressLocality: 'Antananarivo',
          addressCountry: 'MG',
        },
      });
    }
  }, [settings?.name, settings?.description, settings?.address, settings?.phone, settings?.email, settings?.logoUrl]);

  // Remplace le favicon par défaut par le logo du restaurant dès qu'il est disponible.
  // Un logo importé peut peser plusieurs Mo : de nombreux navigateurs ignorent
  // silencieusement un favicon trop lourd. On le redimensionne en petite image
  // légère (64x64) avant de l'appliquer, pour un affichage fiable partout.
  useEffect(() => {
    if (!settings?.logoUrl) return;
    let cancelled = false;

    const applyFavicon = (href: string) => {
      let link = document.querySelector<HTMLLinkElement>("link#app-favicon");
      if (!link) {
        link = document.createElement('link');
        link.id = 'app-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Un SVG est déjà léger : pas besoin de le redimensionner.
    if (settings.logoUrl.startsWith('data:image/svg+xml')) {
      applyFavicon(settings.logoUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Contexte canvas indisponible');
        ctx.drawImage(img, 0, 0, size, size);
        applyFavicon(canvas.toDataURL('image/png'));
      } catch {
        // Image distante non exportable (restriction CORS) : on utilise l'URL telle quelle
        applyFavicon(settings.logoUrl!);
      }
    };
    img.onerror = () => applyFavicon(settings.logoUrl!);
    img.src = settings.logoUrl;

    return () => { cancelled = true; };
  }, [settings?.logoUrl]);

  // Détecte l'accès admin via l'URL /admin-user (aucun bouton visible dans l'interface)
  useEffect(() => {
    const isAuth = api.isAuthenticated();
    setIsAdminLoggedIn(isAuth);

    if (window.location.pathname === '/admin-user') {
      if (isAuth) {
        setIsAdminOpen(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  }, []);

  // Session admin expirée (ex : redémarrage du serveur) détectée par api.ts :
  // on renvoie vers l'écran de connexion au lieu de laisser l'admin croire
  // que les données affichées (commandes, messages...) sont à jour.
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsAdminLoggedIn(false);
      setIsAdminOpen(false);
      setSessionExpiredNotice(true);
      setIsLoginModalOpen(true);
    };
    window.addEventListener('admin-session-expired', handleSessionExpired);
    return () => window.removeEventListener('admin-session-expired', handleSessionExpired);
  }, []);

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn) {
      setIsAdminOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    setIsLoginModalOpen(false);
    setIsAdminOpen(true);
  };

  const handleOpenSoupCustomizer = () => {
    setIsSoupCustomizerOpen(true);
  };

  if (isAdminOpen && isAdminLoggedIn) {
    return (
      <AdminPortal
        onClose={() => {
          setIsAdminOpen(false);
          if (window.location.pathname === '/admin-user') {
            window.history.replaceState({}, '', '/');
          }
        }}
        formatPrice={formatPrice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1F1F1F] flex flex-col font-sans selection:bg-[#C62828] selection:text-white relative">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <Hero onOpenCustomizer={handleOpenSoupCustomizer} isAdmin={isAdminLoggedIn} />
        <ChefSection />
        <MenuSection
          isCustomizerOpen={isSoupCustomizerOpen}
          onOpenCustomizer={() => setIsSoupCustomizerOpen(true)}
          onCloseCustomizer={() => setIsSoupCustomizerOpen(false)}
        />
        <ContactSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating To Top Button */}
      <ScrollToTop />

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Checkout & Tracking Modal */}
      <CheckoutModal />

      {/* Customer Auth & Profile Modals */}
      <CustomerAuthModal />
      <CustomerProfileModal />

      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <AdminLogin
          sessionExpired={sessionExpiredNotice}
          onLoginSuccess={() => {
            setSessionExpiredNotice(false);
            handleLoginSuccess();
          }}
          onClose={() => {
            setIsLoginModalOpen(false);
            setSessionExpiredNotice(false);
            if (window.location.pathname === '/admin-user') {
              window.history.replaceState({}, '', '/');
            }
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <MainLayout />
        <AdminErrorToast />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
