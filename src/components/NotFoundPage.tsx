import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { LegalFooter } from './LegalPages';
import { DEFAULT_HERO_SLIDES } from './Hero';

/** Page 404 personnalisée : photo, message clair et deux chemins pour repartir. */
export const NotFoundPage: React.FC = () => {
  const { settings } = useCart();
  const image = (settings?.slides && settings.slides[0]?.image) || DEFAULT_HERO_SLIDES[0].image;

  useEffect(() => {
    document.title = `Page introuvable | ${settings.name}`;
    // Les moteurs de recherche ne doivent pas indexer cette page.
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (robots) robots.content = 'noindex, follow';
  }, [settings.name]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[560px]">
        <img src={image} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 text-center px-6 max-w-xl">
          <div className="font-display text-white text-[110px] sm:text-[150px] leading-none tracking-[0.08em]">404</div>
          <h1 className="mt-4 font-sans font-semibold uppercase text-white text-xl sm:text-2xl tracking-[0.2em]">
            Ce plat n'est pas à la carte
          </h1>
          <p className="mt-5 text-[15px] text-white/80 leading-relaxed">
            La page que vous cherchez n'existe pas ou a été déplacée. Pas d'inquiétude : notre cuisine, elle, est
            toujours ouverte.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/#menu" className="btn-outline bg-white text-ink border-white hover:bg-accent hover:text-white hover:border-accent">
              Voir la carte
            </a>
            <a href="/" className="btn-outline text-white hover:bg-white hover:text-ink hover:border-white">
              Retour à l'accueil
            </a>
          </div>
        </div>
      </main>
      <LegalFooter />
    </div>
  );
};
