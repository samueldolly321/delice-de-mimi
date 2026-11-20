import React from 'react';
import { ChefHat, Phone, MapPin, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SocialIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const { settings } = useCart();

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#1A1818] text-stone-300 pt-16 pb-12 border-t border-[#332A2A] relative overflow-hidden">
      {/* Decorative subtle lantern/gold ambient glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#C62828]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-stone-800">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.name}
                  className="w-11 h-11 rounded-full object-cover shadow-md border-2 border-[#FFE082]/40"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#C62828] text-[#F4C542] flex items-center justify-center font-serif text-xl font-bold shadow-md border border-[#FFE082]/30">
                  {settings.logoText || '味'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold text-white tracking-wide">
                  {settings.name}
                </span>
                <span className="text-[10px] tracking-widest uppercase font-semibold text-[#F4C542]">
                  {settings.tagline || 'Maison Culinaire Asiatique'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white leading-relaxed max-w-sm">
              {settings.description}
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider text-[#F4C542]">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => scrollToSection('accueil')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('le-chef')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Le Chef & Philosophie
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('menu')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Notre Menu
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact & Accès
                </button>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider text-[#F4C542]">
              Horaires
            </h4>
            <div className="space-y-2 text-xs text-white">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C62828] mt-0.5 shrink-0" />
                <span>{settings.openingHours}</span>
              </div>
              <p className="text-[11px] text-white pt-1">
                Livraison à domicile et plats à emporter garantis chauds et soignés.
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider text-[#F4C542]">
              Contact
            </h4>
            <div className="space-y-2.5 text-xs text-white">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C62828] mt-0.5 shrink-0" />
                <span>{settings.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#F4C542] shrink-0" />
                <span>{settings.phone}</span>
              </div>
            </div>

            {(settings.facebookUrl || settings.instagramUrl || settings.tiktokUrl || settings.whatsappUrl || settings.whatsappPhone) && (
              <div className="flex items-center gap-2 pt-1">
                {settings.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Facebook"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-lg bg-stone-800/90 hover:bg-[#1877F2] text-white flex items-center justify-center transition-all hover:scale-105 shadow-xs border border-stone-700"
                  >
                    <SocialIcon platform="facebook" size={15} />
                  </a>
                )}
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Instagram"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-lg bg-stone-800/90 hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] text-white flex items-center justify-center transition-all hover:scale-105 shadow-xs border border-stone-700"
                  >
                    <SocialIcon platform="instagram" size={15} />
                  </a>
                )}
                {settings.tiktokUrl && (
                  <a
                    href={settings.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="TikTok"
                    aria-label="TikTok"
                    className="w-8 h-8 rounded-lg bg-stone-800/90 hover:bg-black hover:text-[#00f2fe] text-white flex items-center justify-center transition-all hover:scale-105 shadow-xs border border-stone-700"
                  >
                    <SocialIcon platform="tiktok" size={14} />
                  </a>
                )}
                {(settings.whatsappUrl || settings.whatsappPhone) && (
                  <a
                    href={settings.whatsappUrl || `https://wa.me/${(settings.whatsappPhone || settings.phone || '').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-lg bg-stone-800/90 hover:bg-[#25D366] text-white flex items-center justify-center transition-all hover:scale-105 shadow-xs border border-stone-700"
                  >
                    <SocialIcon platform="whatsapp" size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar with Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white">
          <div>
            © 2026 — <strong className="text-white font-semibold">{settings.name}</strong>. Tous droits réservés.
          </div>
          <div className="text-[11px] text-white">
            Fait avec passion • Cuisine authentique fait maison
          </div>
        </div>
      </div>
    </footer>
  );
};
