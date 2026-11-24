import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, X, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

/**
 * En-tête « visuel 2 » : transparent par-dessus la photo d'accueil (texte blanc),
 * puis fond blanc et texte noir dès que l'on fait défiler la page.
 * Logo et nom à gauche, liens en petites capitales à droite.
 */
export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('accueil');
  const { itemCount, setIsCartOpen, formatPrice, settings } = useCart();
  const {
    customer,
    isLoggedIn,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsProfileOpen,
    customerOrders,
  } = useCustomerAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);

      const sections = ['accueil', 'le-chef', 'menu', 'contact'];
      const scrollPosition = window.scrollY + 220;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'le-chef', label: 'Notre maison' },
    { id: 'menu', label: 'La carte' },
    { id: 'contact', label: 'Contact' },
  ];

  const openLogin = () => {
    setIsMobileMenuOpen(false);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openProfile = () => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(true);
  };

  // Transparent uniquement en haut de page et menu mobile fermé
  const solid = isScrolled || isMobileMenuOpen;
  const textColor = solid ? 'text-ink' : 'text-white';

  const announcement =
    settings.topBarText ||
    settings.freeDeliveryNotice ||
    `Livraison offerte dès ${formatPrice(settings.freeDeliveryThreshold)}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      {/* Fin bandeau noir d'annonce */}
      <div className="bg-black text-white/80 text-[10px] sm:text-[11px] py-1.5 px-4 text-center label-caps !font-normal truncate select-none">
        {announcement}
        {settings.phone && <span className="hidden md:inline text-white/50">{'   ·   '}{settings.phone.split('/')[0]}</span>}
      </div>

      <nav
        id="main-navbar"
        className={`transition-all duration-300 ${
          solid ? 'bg-white shadow-[0_1px_0_#E5E5E5] py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-6">
          {/* Logo + nom */}
          <a
            href="#accueil"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('accueil');
            }}
            className={`flex items-center gap-3 min-w-0 ${textColor}`}
            id="nav-logo"
          >
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt={`Logo ${settings.name}`} className="w-9 h-9 rounded-full object-cover bg-white shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 ${solid ? 'bg-ink text-white' : 'bg-white text-ink'}`}>
                {settings.logoText || '味'}
              </span>
            )}
            <span className="font-display uppercase tracking-[0.14em] text-base sm:text-lg truncate">{settings.name}</span>
          </a>

          {/* Liens (bureau) */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  id={`nav-link-${item.id}`}
                  className={`label-caps text-[11px] py-1.5 border-b-2 transition-colors cursor-pointer ${textColor} ${
                    isActive ? (solid ? 'border-ink' : 'border-white') : 'border-transparent opacity-85 hover:opacity-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Compte + panier */}
          <div className={`flex items-center gap-4 sm:gap-5 shrink-0 ${textColor}`}>
            <button
              onClick={isLoggedIn && customer ? openProfile : openLogin}
              id={isLoggedIn && customer ? 'nav-customer-profile-btn' : 'nav-customer-login-btn'}
              title={isLoggedIn && customer ? 'Mon profil et mes commandes' : 'Connexion client'}
              className="hidden sm:flex items-center gap-2 label-caps text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
            >
              <User className="w-4 h-4" strokeWidth={1.75} />
              <span>{isLoggedIn && customer ? customer.fullName.split(' ')[0] : 'Connexion'}</span>
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              id="cart-drawer-trigger"
              className="relative p-1 cursor-pointer hover:opacity-70 transition-opacity"
              aria-label="Voir le panier"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            </button>

            {/* Appel à l'action principal */}
            <button
              onClick={() => (itemCount > 0 ? setIsCartOpen(true) : scrollToSection('menu'))}
              id="cta-commander-btn"
              className="hidden lg:inline-flex items-center bg-accent hover:bg-[#8E1B1B] text-white label-caps text-[11px] px-5 py-2.5 rounded-[3px] transition-colors cursor-pointer"
            >
              {itemCount > 0 ? 'Valider ma commande' : 'Commander'}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1"
              id="mobile-menu-toggle"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <MenuIcon className="w-6 h-6" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-hairline mt-3">
            <div className="flex flex-col py-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`label-caps text-[12px] px-6 py-3.5 text-left border-b border-hairline ${
                    activeSection === item.id ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={isLoggedIn && customer ? openProfile : openLogin} className="label-caps text-[12px] px-6 py-3.5 text-left text-ink">
                {isLoggedIn && customer ? `Mon profil (${customerOrders.length} cmd)` : 'Connexion / Inscription'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
