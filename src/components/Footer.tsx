import React from 'react';
import { useCart } from '../context/CartContext';
import { SocialIcon } from './SocialIcons';

export const Footer: React.FC = () => {
  const { settings } = useCart();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const socials = [
    settings.facebookUrl && { platform: 'facebook' as const, href: settings.facebookUrl, label: 'Facebook', size: 15 },
    settings.instagramUrl && { platform: 'instagram' as const, href: settings.instagramUrl, label: 'Instagram', size: 15 },
    settings.tiktokUrl && { platform: 'tiktok' as const, href: settings.tiktokUrl, label: 'TikTok', size: 14 },
    (settings.whatsappUrl || settings.whatsappPhone) && {
      platform: 'whatsapp' as const,
      href: settings.whatsappUrl || `https://wa.me/${(settings.whatsappPhone || settings.phone || '').replace(/[^0-9]/g, '')}`,
      label: 'WhatsApp',
      size: 16,
    },
  ].filter(Boolean) as { platform: 'facebook' | 'instagram' | 'tiktok' | 'whatsapp'; href: string; label: string; size: number }[];

  return (
    <footer className="bg-white border-t border-hairline mt-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        {/* Nom du restaurant */}
        <div className="text-center">
          <div className="font-serif italic text-3xl text-ink">{settings.name}</div>
          <div className="mt-2 label-caps text-[10px] text-gold">
            {settings.tagline || 'Maison culinaire asiatique'}
          </div>
          {settings.description && (
            <p className="mt-6 max-w-xl mx-auto text-sm text-stone-500 font-light leading-relaxed">
              {settings.description}
            </p>
          )}
        </div>

        {/* Trois colonnes à fines bordures */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 border border-hairline md:divide-x divide-y md:divide-y-0 divide-hairline text-center">
          <div className="px-6 py-8">
            <h4 className="label-caps text-[11px] text-ink">Navigation</h4>
            <ul className="mt-4 space-y-2 text-sm font-light text-stone-500">
              {[
                { id: 'accueil', label: 'Accueil' },
                { id: 'menu', label: 'La carte' },
                { id: 'le-chef', label: 'Le chef' },
                { id: 'contact', label: 'Contact & accès' },
              ].map((l) => (
                <li key={l.id}>
                  <button onClick={() => scrollToSection(l.id)} className="hover:text-ink transition-colors cursor-pointer">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-8">
            <h4 className="label-caps text-[11px] text-ink">Horaires</h4>
            <p className="mt-4 text-sm font-light text-stone-500 whitespace-pre-line">{settings.openingHours}</p>
            <p className="mt-3 text-xs italic text-stone-400">Livraison à domicile et plats à emporter.</p>
          </div>

          <div className="px-6 py-8">
            <h4 className="label-caps text-[11px] text-ink">Contact</h4>
            <p className="mt-4 text-sm font-light text-stone-500">{settings.address}</p>
            <p className="mt-1 text-sm font-light text-stone-500">{settings.phone}</p>

            {socials.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    title={s.label}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-full border border-hairline text-ink flex items-center justify-center hover:bg-ink hover:text-white hover:border-ink transition-colors"
                  >
                    <SocialIcon platform={s.platform} size={s.size} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 text-center label-caps text-[10px] text-stone-400">
          © {new Date().getFullYear()} {settings.name} · Tous droits réservés
        </div>
      </div>
    </footer>
  );
};
