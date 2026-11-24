import React from 'react';
import { Leaf, ChefHat, Bike, Soup } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DEFAULT_HERO_SLIDES } from './Hero';
import { FadeIn } from './common/FadeIn';

/**
 * Bandeau en trois panneaux : photo | panneau sombre avec texte et bouton | photo.
 * Met en avant la soupe à composer.
 */
export const SoupBand: React.FC<{ onOpenCustomizer: () => void }> = ({ onOpenCustomizer }) => {
  const { settings } = useCart();
  const img = (i: number) => (settings?.slides && settings.slides[i]?.image) || DEFAULT_HERO_SLIDES[i].image;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3">
      <div className="hidden md:block relative min-h-[420px] overflow-hidden">
        <img src={img(2)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>

      <div className="relative min-h-[420px] overflow-hidden flex items-center justify-center text-center px-8 py-16">
        <img src={img(0)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 max-w-sm">
          <h2 className="font-sans font-semibold uppercase text-white text-3xl sm:text-4xl tracking-[0.22em]">
            L'art de la soupe
          </h2>
          <p className="mt-5 text-[15px] text-white/85 leading-relaxed">
            Bouillon mijoté 12 heures, nouilles artisanales et raviolis demi-lune. Composez votre bol avec les garnitures de
            votre choix.
          </p>
          <button
            type="button"
            onClick={onOpenCustomizer}
            id="open-soup-customizer-banner-btn"
            className="btn-outline mt-8 text-white hover:bg-white hover:text-ink hover:border-white"
          >
            Composer ma soupe
          </button>
        </div>
      </div>

      <div className="hidden md:block relative min-h-[420px] overflow-hidden">
        <img src={img(1)} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    </section>
  );
};

const SERVICES = [
  { icon: Leaf, title: 'Produits frais', text: 'Ingrédients sélectionnés chaque matin auprès des producteurs locaux.' },
  { icon: ChefHat, title: 'Fait maison', text: 'Pâtes pétries, nems dorés et bouillons mijotés selon la tradition.' },
  { icon: Soup, title: 'Sur place ou à emporter', text: 'Préparé minute, servi chaud et soigné, à récupérer quand vous voulez.' },
  { icon: Bike, title: 'Livraison rapide', text: 'Livraison express à domicile partout à Antananarivo.' },
];

/** Section « Nos engagements » : icônes dorées dans des cercles, titres en capitales, petit trait. */
export const Services: React.FC = () => (
  <section className="bg-white py-24 md:py-28">
    <div className="max-w-[1180px] mx-auto px-6 sm:px-10 text-center">
      <h2 className="section-title text-xl sm:text-2xl">Nos engagements</h2>
      <p className="mt-8 max-w-xl mx-auto text-[15px] text-stone-500 leading-relaxed">
        Une cuisine asiatique généreuse, préparée avec soin du marché jusqu'à votre table.
      </p>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {SERVICES.map((s, i) => (
          <FadeIn key={s.title} delay={i * 0.08}>
            <div className="mx-auto w-28 h-28 rounded-full border-[3px] border-stone-300/80 flex items-center justify-center">
              <s.icon className="w-11 h-11 text-gold" strokeWidth={1.25} />
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
