import React from 'react';
import { useCart } from '../context/CartContext';
import { DEFAULT_CHEF_INFO } from '../data/seedData';
import { FadeIn } from './common/FadeIn';

/**
 * Section « Le chef » : grande photo pleine largeur avec le nom en serif
 * et le titre en italique, puis l'histoire en colonne centrée et les
 * chiffres clés dans une rangée à fines bordures.
 */
export const ChefSection: React.FC = () => {
  const { settings } = useCart();
  const chef = settings?.chef || DEFAULT_CHEF_INFO;

  const name = chef.name || DEFAULT_CHEF_INFO.name;
  const title = chef.title || DEFAULT_CHEF_INFO.title;

  const stats = [
    { value: chef.stat1Value || DEFAULT_CHEF_INFO.stat1Value, label: chef.stat1Label || DEFAULT_CHEF_INFO.stat1Label },
    { value: chef.stat2Value || DEFAULT_CHEF_INFO.stat2Value, label: chef.stat2Label || DEFAULT_CHEF_INFO.stat2Label },
    { value: chef.stat3Value || DEFAULT_CHEF_INFO.stat3Value, label: chef.stat3Label || DEFAULT_CHEF_INFO.stat3Label },
  ];

  const scrollToStory = () => {
    document.getElementById('chef-histoire')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="le-chef" className="bg-white scroll-mt-32">
      {/* Photo pleine largeur avec nom et titre */}
      <div className="relative w-full h-[70vh] min-h-[460px] max-h-[760px] overflow-hidden">
        <img
          src={chef.imageUrl || DEFAULT_CHEF_INFO.imageUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_CHEF_INFO.imageUrl;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" />

        <div className="relative z-10 h-full flex flex-col items-center justify-end text-center px-6 pb-16 sm:pb-20">
          <FadeIn>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white leading-none drop-shadow-lg">{name}</h2>
            <p className="mt-3 font-serif italic text-2xl sm:text-3xl lg:text-4xl text-white/95 drop-shadow-lg">
              {title}
            </p>
            <button
              type="button"
              onClick={scrollToStory}
              className="btn-outline mt-8 text-white bg-black/20 hover:bg-white hover:text-ink"
            >
              Son histoire
            </button>
          </FadeIn>
        </div>
      </div>

      {/* Histoire */}
      <div id="chef-histoire" className="max-w-3xl mx-auto px-6 pt-20 md:pt-24 pb-16 text-center scroll-mt-32">
        <FadeIn>
          <span className="label-caps text-[11px] text-gold">Notre histoire</span>
          <h3 className="mt-4 font-serif text-3xl sm:text-4xl text-ink leading-tight">
            {chef.storyTitle || DEFAULT_CHEF_INFO.storyTitle}
          </h3>
          <p className="mt-7 text-base sm:text-lg text-stone-600 font-light leading-relaxed whitespace-pre-line">
            {chef.storyText || DEFAULT_CHEF_INFO.storyText}
          </p>

          {(chef.subtitle || DEFAULT_CHEF_INFO.subtitle) && (
            <p className="mt-4 text-sm text-stone-400 italic">{chef.subtitle || DEFAULT_CHEF_INFO.subtitle}</p>
          )}

          <blockquote className="mt-12 font-serif italic text-xl sm:text-2xl text-cocoa leading-relaxed">
            « {chef.philosophyQuote || DEFAULT_CHEF_INFO.philosophyQuote} »
          </blockquote>
          <div className="mt-4 label-caps text-[10px] text-gold">
            {chef.philosophyAuthor || DEFAULT_CHEF_INFO.philosophyAuthor}
          </div>
        </FadeIn>
      </div>

      {/* Chiffres clés */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-3 border border-hairline divide-x divide-hairline">
          {stats.map((s, i) => (
            <div key={i} className="py-10 px-3 text-center">
              <div className="font-serif text-3xl sm:text-4xl text-ink">{s.value}</div>
              <div className="mt-2 label-caps text-[9px] sm:text-[10px] text-stone-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
