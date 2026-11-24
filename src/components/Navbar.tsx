import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

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
      setIsScrolled(window.scrollY > 30);

      const sections = ['accueil', 'menu', 'le-chef', 'contact'];
      const scrollPosition = window.scrollY + 220;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && scrollPosition >= el.offsetTop) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'menu', label: 'La carte' },
    { id: 'le-chef', label: 'Le chef' },
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

  const announcement =
    settings.topBarText ||
    settings.freeDeliveryNotice ||
    `Livraison offerte dès ${formatPrice(settings.freeDeliveryThreshold)}`;

  return (
    <header className="sticky top-0 left-0 right-0 z-40">
      {/* Bandeau d'annonce discret */}
      <div className="bg-white border-b border-hairline text-gold text-[10px] sm:text-[11px] py-1.5 px-4 text-center label-caps truncate select-none">
        {announcement}
        {settings.phone && (
          <span className="hidden md:inline text-ink/60">
            {'  ·  '}
            {settings.phone.split('/')[0]}
          </span>
        )}
      </div>

      {/* Barre principale : liens à gauche, nom au centre, compte et panier à droite */}
      <nav
        id="main-navbar"
        className={`bg-white transition-all duration-300 border-b ${
          isScrolled ? 'py-3 border-hairline shadow-[0_1px_12px_rgba(28,43,74,0.06)]' : 'py-5 sm:py-6 border-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Gauche : liens (bureau) ou menu burger (mobile) */}
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden -ml-2 p-2 text-ink"
              id="mobile-menu-toggle"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" strokeWidth={1.5} /> : <MenuIcon className="w-6 h-6" strokeWidth={1.5} />}
            </button>

            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    id={`nav-link-${item.id}`}
                    className={`label-caps text-[12px] py-1 border-b transition-colors cursor-pointer ${
                      isActive ? 'text-ink border-ink' : 'text-ink/80 border-transparent hover:text-ink hover:border-ink/40'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Centre : logo et nom du restaurant */}
          <a
            href="#accueil"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('accueil');
            }}
            className="flex flex-col items-center text-center focus:outline-none group min-w-0"
            id="nav-logo"
          >
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt=""
                className={`rounded-full object-cover transition-all duration-300 ${
                  isScrolled ? 'w-0 h-0 opacity-0' : 'w-10 h-10 sm:w-12 sm:h-12 mb-1.5 opacity-100'
                }`}
                referrerPolicy="no-referrer"
              />
            )}
            <span
              className={`font-serif italic text-ink leading-none transition-all duration-300 ${
                isScrolled ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
              }`}
            >
              {settings.name}
            </span>
            <span className="hidden sm:block label-caps text-[10px] text-gold mt-1.5 max-w-[22rem] truncate">
              {settings.tagline || 'Cuisine asiatique · Antananarivo'}
            </span>
          </a>

          {/* Droite : compte client et panier */}
          <div className="flex items-center justify-end gap-5 sm:gap-7">
            {isLoggedIn && customer ? (
              <button
                onClick={openProfile}
                id="nav-customer-profile-btn"
                title="Mon profil et mes commandes"
                className="hidden sm:inline label-caps text-[12px] text-gold hover:text-ink transition-colors cursor-pointer"
              >
                {customer.fullName.split(' ')[0]}
              </button>
            ) : (
              <button
                onClick={openLogin}
                id="nav-customer-login-btn"
                title="Connexion client"
                className="hidden sm:inline label-caps text-[12px] text-gold hover:text-ink transition-colors cursor-pointer"
              >
                Connexion
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              id="cart-drawer-trigger"
              className="flex items-center gap-2 label-caps text-[12px] text-gold hover:text-ink transition-colors cursor-pointer group"
              aria-label="Voir le panier"
            >
              <span className="hidden sm:inline">Panier</span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] tracking-normal transition-colors ${
                  itemCount > 0 ? 'bg-gold text-white group-hover:bg-ink' : 'bg-gold/80 text-white'
                }`}
              >
                {itemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-hairline mt-3">
            <div className="flex flex-col items-center py-4">
              {[{ id: 'accueil', label: 'Accueil' }, ...navItems].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`label-caps text-[13px] py-3 w-full text-center ${
                    activeSection === item.id ? 'text-ink' : 'text-ink/70'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="w-16 h-px bg-hairline my-3" />
              {isLoggedIn && customer ? (
                <button onClick={openProfile} className="label-caps text-[13px] py-3 text-gold">
                  Mon profil ({customerOrders.length} cmd)
                </button>
              ) : (
                <button onClick={openLogin} className="label-caps text-[13px] py-3 text-gold">
                  Connexion / Inscription
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
