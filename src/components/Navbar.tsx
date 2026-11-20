import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Phone, User, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('accueil');
  const { itemCount, subtotal, setIsCartOpen, formatPrice, settings } = useCart();
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
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

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
    { id: 'accueil', label: 'Accueil' },
    { id: 'le-chef', label: 'Le Chef' },
    { id: 'menu', label: 'Menu' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 transition-shadow duration-300">
      {/* Top Announcement Bar - Reste toujours visible lors du scroll */}
      <div className="bg-[#1F1F1F] text-[#FFE082] text-[11px] sm:text-xs py-1.5 px-3 sm:px-4 border-b border-[#333] flex items-center justify-between font-medium select-none">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">{settings.topBarText || 'Cuisine ouverte • Choisissez | Commandez | Se régaler.'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/80 shrink-0">
            <span className="flex items-center gap-1.5 text-xs text-[#FFE082]">
              <Phone className="w-3.5 h-3.5 text-[#F4C542]" />
              {settings.phone.split('/')[0]}
            </span>
            <span className="text-white/40">|</span>
            <span className="text-xs">
              {settings.freeDeliveryNotice || `Livraison offerte dès ${formatPrice(settings.freeDeliveryThreshold)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        id="main-navbar"
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-2.5 sm:py-3 border-b border-stone-200'
            : 'bg-white/90 backdrop-blur-sm py-3 sm:py-4 border-b border-stone-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#accueil"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('accueil');
            }}
            className="flex items-center gap-3 group focus:outline-none"
            id="nav-logo"
          >
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-md shadow-[#C62828]/20 border-2 border-[#C62828]/30 group-hover:scale-105 transition-transform"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#C62828] text-[#F4C542] flex items-center justify-center font-serif text-xl font-bold shadow-md shadow-[#C62828]/20 border border-[#FFE082]/40 group-hover:scale-105 transition-transform">
                {settings.logoText || '味'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1F1F1F] group-hover:text-[#C62828] transition-colors leading-tight">
                {settings.name}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#8E1B1B]">
                Cuisine Chinoise & Asiatique
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links with animated left-to-right bottom bar */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  id={`nav-link-${item.id}`}
                  className="relative py-1.5 text-sm font-semibold transition-colors cursor-pointer group flex flex-col items-center"
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isActive
                        ? 'text-[#C62828] font-bold'
                        : 'text-[#1F1F1F] group-hover:text-[#C62828]'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Trait en bas : actif ou tracé de gauche vers la droite au hover */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2.5px] w-full bg-[#C62828] rounded-full transition-transform duration-300 ease-out origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Customer Account Button */}
            {isLoggedIn && customer ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                id="nav-customer-profile-btn"
                title="Mon Profil Client & Mes Commandes"
                className="p-1.5 sm:px-3 sm:py-2 rounded-xl bg-white hover:bg-amber-50/70 border border-[#E8DCB8] text-[#1F1F1F] flex items-center gap-2 transition-all shadow-2xs group cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#C62828] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-stone-900 truncate max-w-[100px]">
                    {customer.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">
                    {customerOrders.length > 0 ? `${customerOrders.length} cmd` : 'Profil'}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                id="nav-customer-login-btn"
                title="Connexion Client"
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-[#C62828]/40 text-stone-700 hover:text-[#C62828] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <User className="w-4 h-4 text-[#C62828]" />
                <span className="hidden sm:inline">Connexion</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              id="cart-drawer-trigger"
              className="relative p-2.5 rounded-xl bg-white hover:bg-amber-50/50 border border-[#E8DCB8] text-[#1F1F1F] flex items-center gap-2 transition-all hover:border-[#C62828]/30 shadow-xs cursor-pointer group"
              aria-label="Voir le panier"
            >
              <ShoppingBag className="w-5 h-5 text-[#C62828] group-hover:scale-110 transition-transform" />
              {itemCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#C62828] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {itemCount}
                  </span>
                  <span className="hidden sm:inline text-xs font-semibold text-[#1F1F1F]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              ) : (
                <span className="hidden sm:inline text-xs font-medium text-stone-500">Panier</span>
              )}
            </button>

            {/* Primary CTA "Commander" */}
            <button
              onClick={() => {
                if (itemCount > 0) {
                  setIsCartOpen(true);
                } else {
                  scrollToSection('menu');
                }
              }}
              id="cta-commander-btn"
              className="hidden sm:flex bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl shadow-md shadow-[#C62828]/25 transition-all transform active:scale-95 items-center justify-center cursor-pointer"
            >
              <span>Commander</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#1F1F1F] lg:hidden hover:bg-black/5"
              id="mobile-menu-toggle"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl">
            <div className="flex flex-col space-y-2 pt-2">
              <button
                onClick={() => scrollToSection('accueil')}
                className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  activeSection === 'accueil'
                    ? 'text-[#C62828] font-bold bg-stone-50 border-b-2 border-[#C62828]'
                    : 'text-[#1F1F1F] hover:bg-stone-50'
                }`}
              >
                Accueil
              </button>
              <button
                onClick={() => scrollToSection('le-chef')}
                className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  activeSection === 'le-chef'
                    ? 'text-[#C62828] font-bold bg-stone-50 border-b-2 border-[#C62828]'
                    : 'text-[#1F1F1F] hover:bg-stone-50'
                }`}
              >
                Le Chef & Histoire
              </button>
              <button
                onClick={() => scrollToSection('menu')}
                className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  activeSection === 'menu'
                    ? 'text-[#C62828] font-bold bg-stone-50 border-b-2 border-[#C62828]'
                    : 'text-[#1F1F1F] hover:bg-stone-50'
                }`}
              >
                <span>Notre Menu</span>
                <span className="text-[11px] bg-[#C62828] text-white px-2 py-0.5 rounded-full font-bold">
                  Spécialités
                </span>
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-left px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  activeSection === 'contact'
                    ? 'text-[#C62828] font-bold bg-stone-50 border-b-2 border-[#C62828]'
                    : 'text-[#1F1F1F] hover:bg-stone-50'
                }`}
              >
                Contact & Accès
              </button>
              {/* Customer Mobile Link */}
              {isLoggedIn && customer ? (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                  className="text-left px-3 py-2.5 rounded-xl bg-amber-100/50 border border-amber-200 text-stone-900 font-bold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#C62828]" />
                    <span>Mon Profil ({customer.fullName})</span>
                  </div>
                  <span className="text-xs bg-[#C62828] text-white px-2 py-0.5 rounded-full font-semibold">
                    {customerOrders.length} cmd
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-left px-3 py-2.5 rounded-xl bg-white border border-[#EBDCC5] text-stone-800 font-bold flex items-center gap-2 hover:bg-amber-50"
                >
                  <User className="w-4 h-4 text-[#C62828]" />
                  <span>Connexion / Inscription Client</span>
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
