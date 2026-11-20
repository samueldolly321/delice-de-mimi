import React from 'react';
import { ChefHat, HeartHandshake, Flame, Quote } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { DEFAULT_CHEF_INFO } from '../data/seedData';
import { FadeIn } from './common/FadeIn';

export const ChefSection: React.FC = () => {
  const { settings } = useCart();
  const chef = settings?.chef || DEFAULT_CHEF_INFO;

  return (
    <section id="le-chef" className="py-20 md:py-28 bg-white border-y border-stone-200 relative overflow-hidden">
      {/* Subtle oriental bamboo/cloud background accent */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-radial from-[#F4C542]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Illustrations culinaires décoratives en fond */}
      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute -left-8 top-10 w-48 h-48 text-[#C62828] opacity-[0.12] pointer-events-none rotate-[-12deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Crevette stylisée */}
        <path d="M20 65 C15 50, 25 30, 45 25 C60 21, 72 28, 75 40 C77 47, 73 52, 66 52 C70 44, 65 36, 55 35 C42 33, 32 42, 30 55 C29 62, 33 68, 40 70 L38 76 L32 74 L30 68 C24 70, 20 69, 20 65 Z" />
        <circle cx="68" cy="34" r="2.2" fill="currentColor" stroke="none" />
        <path d="M50 30 L46 22 M56 31 L54 22 M62 33 L62 24" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute right-0 top-4 w-56 h-56 text-[#8E1B1B] opacity-[0.10] pointer-events-none rotate-[8deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Nouilles Mine Sao dans un wok */}
        <path d="M12 62 C12 78, 28 88, 50 88 C72 88, 88 78, 88 62" />
        <path d="M8 60 C8 56, 12 54, 50 54 C88 54, 92 56, 92 60 C92 64, 88 66, 50 66 C12 66, 8 64, 8 60 Z" />
        <path d="M25 40 C30 48, 24 56, 30 60" />
        <path d="M40 34 C45 44, 37 52, 44 60" />
        <path d="M55 34 C60 44, 52 52, 59 60" />
        <path d="M70 40 C75 48, 68 56, 74 60" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute left-1/4 bottom-0 w-40 h-40 text-[#F4C542] opacity-[0.14] pointer-events-none rotate-[6deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Bol de soupe fumante */}
        <path d="M15 55 C15 72, 30 82, 50 82 C70 82, 85 72, 85 55 Z" />
        <path d="M10 55 L90 55" />
        <path d="M38 20 C34 26, 40 30, 36 38" />
        <path d="M50 16 C46 22, 52 26, 48 36" />
        <path d="M62 20 C58 26, 64 30, 60 38" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute right-8 bottom-4 w-36 h-36 text-[#C62828] opacity-[0.10] pointer-events-none rotate-[-6deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Baguettes croisées */}
        <path d="M20 85 L78 22" />
        <path d="M22 22 L80 85" strokeDasharray="0" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden xl:block absolute left-6 bottom-16 w-32 h-32 text-[#8E1B1B] opacity-[0.10] pointer-events-none rotate-[10deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Nem doré (rouleau de printemps) */}
        <rect x="22" y="38" width="56" height="24" rx="12" />
        <path d="M30 38 L30 62 M70 38 L70 62" />
        <path d="M40 30 C42 34, 46 36, 50 36 C54 36, 58 34, 60 30" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden xl:block absolute right-1/3 top-6 w-28 h-28 text-[#F4C542] opacity-[0.12] pointer-events-none rotate-[-4deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Théière asiatique */}
        <path d="M22 50 C22 68, 36 78, 50 78 C64 78, 78 68, 78 50 L74 46 L26 46 Z" />
        <path d="M78 54 C88 54, 92 46, 84 42" />
        <path d="M40 40 C40 30, 44 24, 50 24 C56 24, 60 30, 60 40" />
        <circle cx="50" cy="20" r="3" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute -right-4 bottom-24 w-36 h-36 text-[#C62828] opacity-[0.10] pointer-events-none rotate-[4deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Panier vapeur en bambou (dim sum) */}
        <path d="M28 48 C28 36, 37 30, 50 30 C63 30, 72 36, 72 48" />
        <rect x="22" y="48" width="56" height="11" rx="2" />
        <rect x="24" y="61" width="52" height="11" rx="2" />
        <rect x="26" y="74" width="48" height="9" rx="2" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 w-24 h-24 text-[#8E1B1B] opacity-[0.10] pointer-events-none rotate-[-15deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Piment */}
        <path d="M32 22 C26 20, 20 22, 17 27" />
        <path d="M32 22 C24 34, 25 54, 38 68 C48 79, 64 76, 67 62 C71 44, 56 26, 32 22 Z" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden xl:block absolute right-8 top-1/3 w-28 h-28 text-[#F4C542] opacity-[0.11] pointer-events-none rotate-[8deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Bol de riz avec baguettes plantées */}
        <path d="M18 52 C18 68, 32 80, 50 80 C68 80, 82 68, 82 52 Z" />
        <path d="M14 52 L86 52" />
        <path d="M40 46 L34 14" />
        <path d="M56 46 L64 12" />
        <circle cx="44" cy="42" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="52" cy="40" r="2.4" fill="currentColor" stroke="none" />
        <circle cx="48" cy="46" r="2.4" fill="currentColor" stroke="none" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute right-1/4 bottom-32 w-32 h-32 text-[#C62828] opacity-[0.09] pointer-events-none rotate-[6deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Canard laqué suspendu */}
        <ellipse cx="42" cy="56" rx="24" ry="17" />
        <circle cx="72" cy="38" r="10" />
        <path d="M81 36 L91 38 L81 41 Z" />
        <path d="M72 28 L72 18" />
        <path d="M30 72 L26 86 M42 74 L40 88 M54 72 L58 86" />
      </svg>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Professional Photo of Chef in Kitchen */}
          <div className="lg:col-span-5 relative">
          <FadeIn>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative border with golden accents */}
              <div className="absolute -inset-3 rounded-3xl border-2 border-dashed border-[#F4C542]/70 rotate-1 -z-10" />
              
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white border border-[#FFE082]/80">
                <img
                  src={chef.imageUrl || DEFAULT_CHEF_INFO.imageUrl}
                  alt={chef.name}
                  className="w-full h-[600px] object-cover object-center hover:scale-102 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_CHEF_INFO.imageUrl;
                  }}
                />

                {/* Chef name plaque */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-6 text-white">
                  <div className="flex items-center gap-2 text-[#FFE082] text-xs font-semibold uppercase tracking-wider">
                    <ChefHat className="w-4 h-4 text-[#F4C542]" />
                    <span>{chef.title || DEFAULT_CHEF_INFO.title}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mt-1">
                    {chef.name || DEFAULT_CHEF_INFO.name}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1">
                    {chef.subtitle || DEFAULT_CHEF_INFO.subtitle}
                  </p>
                </div>
              </div>

              {/* Floating Quote Stamp */}
              <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full bg-[#C62828] text-white flex flex-col items-center justify-center shadow-lg border-2 border-[#FFE082] rotate-12">
                <span className="font-serif text-lg font-bold text-[#F4C542]">心</span>
                <span className="text-[8px] tracking-wider uppercase font-medium">{chef.badge || 'Passion'}</span>
              </div>
            </div>
          </FadeIn>
          </div>

          {/* Right Column: Story, Philosophy & Stats */}
          <div className="lg:col-span-7 space-y-6">
          <FadeIn delay={0.15}>
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C62828]/10 border border-[#C62828]/20 text-[#8E1B1B] text-xs font-bold tracking-wider uppercase">
              <span>NOTRE HISTOIRE</span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F1F1F] tracking-tight leading-tight">
              {chef.storyTitle || DEFAULT_CHEF_INFO.storyTitle}
            </h2>

            {/* Main Text */}
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed whitespace-pre-line">
              {chef.storyText || DEFAULT_CHEF_INFO.storyText}
            </p>

            {/* Philosophy quote */}
            <div className="relative bg-white/80 p-5 sm:p-6 rounded-2xl border-l-4 border-[#C62828] shadow-xs">
              <Quote className="w-6 h-6 text-[#F4C542] mb-2 opacity-80" />
              <p className="text-sm sm:text-base italic text-stone-800">
                {chef.philosophyQuote || DEFAULT_CHEF_INFO.philosophyQuote}
              </p>
              <div className="mt-3 text-xs font-bold text-[#8E1B1B] uppercase tracking-wider">
                — {chef.philosophyAuthor || DEFAULT_CHEF_INFO.philosophyAuthor}
              </div>
            </div>

            {/* Statistics in small modern blocks */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-[#EBDCC5] text-center shadow-2xs">
                <span className="block font-serif text-2xl sm:text-3xl font-extrabold text-[#C62828]">
                  {chef.stat1Value || DEFAULT_CHEF_INFO.stat1Value}
                </span>
                <span className="block text-xs sm:text-sm font-semibold text-stone-700 mt-1">
                  {chef.stat1Label || DEFAULT_CHEF_INFO.stat1Label}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#EBDCC5] text-center shadow-2xs">
                <span className="block font-serif text-2xl sm:text-3xl font-extrabold text-[#C62828]">
                  {chef.stat2Value || DEFAULT_CHEF_INFO.stat2Value}
                </span>
                <span className="block text-xs sm:text-sm font-semibold text-stone-700 mt-1">
                  {chef.stat2Label || DEFAULT_CHEF_INFO.stat2Label}
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#EBDCC5] text-center shadow-2xs">
                <span className="block font-serif text-2xl sm:text-3xl font-extrabold text-[#C62828]">
                  {chef.stat3Value || DEFAULT_CHEF_INFO.stat3Value}
                </span>
                <span className="block text-xs sm:text-sm font-semibold text-stone-700 mt-1">
                  {chef.stat3Label || DEFAULT_CHEF_INFO.stat3Label}
                </span>
              </div>
            </div>
          </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};
