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
    <footer className="bg-[#111111] text-white/70">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="font-display uppercase tracking-[0.14em] text-xl text-white">{settings.name}</div>
            {settings.description && <p className="mt-5 text-sm leading-[1.8]">{settings.description}</p>}
          </div>

          <div>
            <h4 className="label-caps text-[12px] text-white">Navigation</h4>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                { id: 'accueil', label: 'Accueil' },
                { id: 'le-chef', label: 'Notre maison' },
                { id: 'menu', label: 'La carte' },
                { id: 'contact', label: 'Contact & accès' },
              ].map((l) => (
                <li key={l.id}>
                  <button onClick={() => scrollToSection(l.id)} className="hover:text-white transition-colors cursor-pointer">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="label-caps text-[12px] text-white">Horaires</h4>
            <p className="mt-6 text-sm leading-[1.8] whitespace-pre-line">{settings.openingHours}</p>
            <p className="mt-3 text-xs text-white/50">Livraison à domicile et plats à emporter.</p>
          </div>

          <div>
            <h4 className="label-caps text-[12px] text-white">Contact</h4>
            <p className="mt-6 text-sm leading-[1.8]">{settings.address}</p>
            <p className="mt-1 text-sm">{settings.phone}</p>
            {socials.length > 0 && (
              <div className="mt-6 flex items-center gap-2">
                {socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    title={s.label}
                    aria-label={s.label}
                    className="w-9 h-9 bg-white/10 text-white flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <SocialIcon platform={s.platform} size={s.size} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-center label-caps !font-normal text-[10px] text-white/40">
          © {new Date().getFullYear()} {settings.name} · Tous droits réservés
        </div>
      </div>
    </footer>
  );
};
