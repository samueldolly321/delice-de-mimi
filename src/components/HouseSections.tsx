import React from 'react';
import { useCart } from '../context/CartContext';
import { DEFAULT_HERO_SLIDES } from './Hero';
import { FadeIn } from './common/FadeIn';
import { ServiceIcon } from './common/ServiceIcon';
import { resolveHomeContent } from '../data/homeContent';

/**
 * Bandeau en trois panneaux : photo | panneau sombre avec texte et bouton | photo.
 * Met en avant la soupe à composer. Textes et photos modifiables dans l'administration
 * (Paramètres → Page d'accueil) ; sans photo choisie, celles du diaporama sont utilisées.
 */
export const SoupBand: React.FC<{ onOpenCustomizer: () => void }> = ({ onOpenCustomizer }) => {
  const { settings } = useCart();
  const home = resolveHomeContent(settings);
  const slideImg = (i: number) => (settings?.slides && settings.slides[i]?.image) || DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].image;
  const slideAlt = (i: number) =>
    (settings?.slides && (settings.slides[i]?.imageAlt || settings.slides[i]?.title)) || DEFAULT_HERO_SLIDES[i % DEFAULT_HERO_SLIDES.length].imageAlt || '';

  const left = home.soupBandImageLeft || slideImg(2);
  const center = home.soupBandImageCenter || slideImg(0);
  const right = home.soupBandImageRight || slideImg(1);

  return (
    <section className="grid grid-cols-1 md:grid-cols-3">
      <div className="hidden md:block relative min-h-[420px] overflow-hidden">
        <img src={left} alt={home.soupBandImageLeft ? home.soupBandTitle : slideAlt(2)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>

      <div className="relative min-h-[420px] overflow-hidden flex items-center justify-center text-center px-8 py-16">
        <img src={center} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 max-w-sm">
          <h2 className="font-sans font-semibold uppercase text-white text-3xl sm:text-4xl tracking-[0.22em]">
            {home.soupBandTitle}
          </h2>
          <p className="mt-5 text-[15px] text-white/85 leading-relaxed whitespace-pre-line">{home.soupBandText}</p>
          <button
            type="button"
            onClick={onOpenCustomizer}
            id="open-soup-customizer-banner-btn"
            className="btn-outline mt-8 text-white hover:bg-white hover:text-ink hover:border-white"
          >
            {home.soupBandButton}
          </button>
        </div>
      </div>

      <div className="hidden md:block relative min-h-[420px] overflow-hidden">
        <img src={right} alt={home.soupBandImageRight ? home.soupBandTitle : slideAlt(1)} className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    </section>
  );
};

/** Section « Nos engagements » : icônes dorées dans des cercles, titres en capitales, petit trait. */
export const Services: React.FC = () => {
  const { settings } = useCart();
  const home = resolveHomeContent(settings);
  const count = home.services.length;
  const cols = count >= 4 ? 'lg:grid-cols-4' : count === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <section className="bg-white py-24 md:py-28">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10 text-center">
        <h2 className="section-title text-xl sm:text-2xl">{home.servicesTitle}</h2>
        <p className="mt-8 max-w-xl mx-auto text-[15px] text-stone-500 leading-relaxed">{home.servicesIntro}</p>

        <div className={`mt-16 grid grid-cols-1 sm:grid-cols-2 ${cols} gap-12`}>
          {home.services.map((s, i) => (
            <FadeIn key={`${s.title}-${i}`} delay={i * 0.08}>
              <div className="mx-auto w-28 h-28 rounded-full border-[3px] border-stone-300/80 flex items-center justify-center">
                <ServiceIcon name={s.icon} className="w-11 h-11 text-gold" strokeWidth={1.25} />
              </div>
              <h3 className="mt-8 label-caps text-[12px] text-ink">{s.title}</h3>
              <p className="mt-3 text-sm text-stone-500 leading-relaxed max-w-[15rem] mx-auto">{s.text}</p>
              <span className="dash mt-5 mx-auto" />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
