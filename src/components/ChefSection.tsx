import React from 'react';
import { useCart } from '../context/CartContext';
import { DEFAULT_CHEF_INFO } from '../data/seedData';
import { FadeIn } from './common/FadeIn';
import { DEFAULT_HERO_SLIDES } from './Hero';

/**
 * Section « Notre maison » (visuel 2) : titre encadré de traits fins,
 * colonne de texte à gauche et deux cartes photo à droite
 * (le chef, puis sa philosophie), chacune avec un petit trait sous le texte.
 */
export const ChefSection: React.FC = () => {
  const { settings } = useCart();
  const chef = settings?.chef || DEFAULT_CHEF_INFO;

  const dishImage =
    (settings?.slides && settings.slides[1]?.image) || DEFAULT_HERO_SLIDES[1].image;

  const stats = [
    { value: chef.stat1Value || DEFAULT_CHEF_INFO.stat1Value, label: chef.stat1Label || DEFAULT_CHEF_INFO.stat1Label },
    { value: chef.stat2Value || DEFAULT_CHEF_INFO.stat2Value, label: chef.stat2Label || DEFAULT_CHEF_INFO.stat2Label },
    { value: chef.stat3Value || DEFAULT_CHEF_INFO.stat3Value, label: chef.stat3Label || DEFAULT_CHEF_INFO.stat3Label },
  ];

  return (
    <section id="le-chef" className="bg-white py-24 md:py-28 scroll-mt-24">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10">
        <h2 className="section-title text-xl sm:text-2xl">Notre maison</h2>

        <div className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
          {/* Texte */}
          <FadeIn>
            <span className="label-caps !font-normal text-[12px] text-stone-500">Notre histoire</span>
            <h3 className="mt-3 text-3xl sm:text-[34px] font-extrabold uppercase tracking-[0.04em] leading-[1.15] text-ink">
              {chef.storyTitle || DEFAULT_CHEF_INFO.storyTitle}
            </h3>
            <p className="mt-6 text-[15px] text-stone-500 leading-[1.8] whitespace-pre-line">
              {chef.storyText || DEFAULT_CHEF_INFO.storyText}
            </p>
            <button
              type="button"
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-outline mt-8 text-ink hover:bg-ink hover:text-white hover:border-ink"
            >
              Découvrir la carte
            </button>
          </FadeIn>

          {/* Carte : le chef */}
          <FadeIn delay={0.1}>
            <div className="aspect-[3/2] overflow-hidden">
              <img
                src={chef.imageUrl || DEFAULT_CHEF_INFO.imageUrl}
                alt={chef.name || DEFAULT_CHEF_INFO.name}
                className="w-full h-full object-cover object-[center_30%] hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_CHEF_INFO.imageUrl;
                }}
              />
            </div>
            <h4 className="mt-8 label-caps text-[13px] text-ink">
              {chef.name || DEFAULT_CHEF_INFO.name} · {chef.title || DEFAULT_CHEF_INFO.title}
            </h4>
            <p className="mt-3 text-[15px] text-stone-500 leading-[1.7]">{chef.subtitle || DEFAULT_CHEF_INFO.subtitle}</p>
            <span className="dash mt-6" />
          </FadeIn>

          {/* Carte : la philosophie */}
          <FadeIn delay={0.2}>
            <div className="aspect-[3/2] overflow-hidden">
              <img
                src={dishImage}
                alt="Une spécialité de la maison"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="mt-8 label-caps text-[13px] text-ink">Notre philosophie</h4>
            <p className="mt-3 text-[15px] text-stone-500 leading-[1.7] italic">
              {chef.philosophyQuote || DEFAULT_CHEF_INFO.philosophyQuote}
              <span className="not-italic block mt-1 text-[12px] text-stone-400">
                — {chef.philosophyAuthor || DEFAULT_CHEF_INFO.philosophyAuthor}
              </span>
            </p>
            <span className="dash mt-6" />
          </FadeIn>
        </div>

        {/* Chiffres clés */}
        <div className="mt-20 grid grid-cols-3 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-display text-4xl sm:text-5xl text-ink">{s.value}</div>
              <div className="mt-2 label-caps text-[10px] sm:text-[11px] text-stone-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
