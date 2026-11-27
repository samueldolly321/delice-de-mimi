import React, { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { FadeIn } from './common/FadeIn';
import { FEATURED_RATIOS, pickFeaturedProduct, resolveFeatured, sharperImage, sharperSrcSet } from '../data/featured';

interface FeaturedSectionProps {
  /** Ouvre le composeur de soupe (plat personnalisable). */
  onOpenCustomizer?: () => void;
}

/**
 * Bloc « Notre coup de cœur » : un plat mis en avant au-dessus de la carte.
 * Tout se règle dans Administration → Réglages → Produit vedette.
 * Chaque élément apparaît en fondu vers le haut, l'un après l'autre.
 */
export const FeaturedSection: React.FC<FeaturedSectionProps> = ({ onOpenCustomizer }) => {
  const { settings, addToCart, formatPrice } = useCart();
  const f = resolveFeatured(settings);
  const [products, setProducts] = useState<Product[]>([]);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const load = () => api.getProducts().then(setProducts).catch(() => undefined);
    load();
    window.addEventListener('saveurs_products_updated', load);
    return () => window.removeEventListener('saveurs_products_updated', load);
  }, []);

  const product = pickFeaturedProduct(products, f.productId);
  if (!f.enabled || !product) return null;

  const title = f.title.trim() || product.name;
  const text = f.text.trim() || product.description;
  const highlights = f.highlights
    .split('\n')
    .map((h) => h.trim())
    .filter(Boolean);
  const meta = f.showMeta
    ? [
        product.categoryName,
        product.preparationTime,
        product.spiceLevel ? (product.spiceLevel === 1 ? 'Doux' : 'Épicé') : '',
      ].filter(Boolean)
    : [];
  const rawImage = f.image || product.image;
  const isCover = f.imageFit === 'cover';
  const ratio = FEATURED_RATIOS[f.imageRatio];
  const [rw, rh] = ratio.css.split('/').map((n) => Number(n.trim()));
  const ratioNum = isCover ? rw / rh : undefined;
  const src = sharperImage(rawImage, 1400, ratioNum ? Math.round(1400 / ratioNum) : undefined);
  const srcSet = sharperSrcSet(rawImage, [800, 1200, 1800], ratioNum);

  const dark = f.background === 'dark';
  const bg = dark ? 'bg-ink text-white' : f.background === 'paper' ? 'bg-paper' : 'bg-white';
  const muted = dark ? 'text-white/75' : 'text-stone-500';

  const handleAdd = () => {
    if (product.isCustomizable) {
      onOpenCustomizer?.();
      return;
    }
    addToCart(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  // Délai en cascade : 0,12 s entre chaque élément
  let step = 0;
  const next = () => (step++) * 0.12;

  return (
    <section id="vedette" className={`${bg} py-24 md:py-28 scroll-mt-24`}>
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10">
        {f.sectionTitle && (
          <FadeIn delay={next()}>
            <h2 className={`section-title text-xl sm:text-2xl ${dark ? '!text-white before:!border-white/25 after:!border-white/25' : ''}`}>
              {f.sectionTitle}
            </h2>
          </FadeIn>
        )}
        {f.sectionIntro && (
          <FadeIn delay={next()}>
            <p className={`mt-8 max-w-xl mx-auto text-center text-[15px] leading-relaxed whitespace-pre-line ${muted}`}>
              {f.sectionIntro}
            </p>
          </FadeIn>
        )}

        <div className={`${f.sectionTitle || f.sectionIntro ? 'mt-14 md:mt-16' : ''} grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center`}>
          <FadeIn delay={next()} className={f.imageSide === 'right' ? 'lg:order-2' : ''}>
            <div
              className={`group relative overflow-hidden ${isCover ? (dark ? 'bg-[#222]' : 'bg-stone-200') : ''}`}
              style={isCover ? { aspectRatio: ratio.css } : undefined}
            >
              <img
                src={src}
                srcSet={srcSet || undefined}
                sizes="(max-width: 1024px) 100vw, 600px"
                alt={title}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                style={isCover ? { objectPosition: f.imageFocus } : undefined}
                className={`w-full transition-transform duration-[900ms] ease-out group-hover:scale-105 ${
                  isCover ? 'h-full object-cover' : 'h-auto max-h-[82vh] object-contain'
                } ${product.isAvailable ? '' : 'grayscale opacity-60'}`}
              />
              {f.badge && (
                <span className="absolute top-0 left-0 bg-accent text-white label-caps text-[10px] px-3.5 py-2">{f.badge}</span>
              )}
            </div>
          </FadeIn>

          <div>
            {f.label && (
              <FadeIn delay={next()}>
                <span className="label-caps text-[12px] text-accent">{f.label}</span>
              </FadeIn>
            )}
            <FadeIn delay={next()}>
              <h3 className="mt-3.5 font-display uppercase tracking-[0.04em] leading-[1.1] text-[clamp(30px,3.6vw,44px)]">{title}</h3>
            </FadeIn>
            {text && (
              <FadeIn delay={next()}>
                <p className={`mt-5 text-[15px] leading-[1.8] whitespace-pre-line ${muted}`}>{text}</p>
              </FadeIn>
            )}

            {highlights.length > 0 && (
              <div className="mt-6 grid gap-3" role="list">
                {highlights.map((h, i) => (
                  <FadeIn key={i} delay={next()}>
                    <div role="listitem" className="flex items-start gap-3 text-[14px]">
                      <Check className="w-[18px] h-[18px] mt-0.5 text-accent shrink-0" strokeWidth={2} />
                      <span>{h}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}

            {meta.length > 0 && (
              <FadeIn delay={next()}>
                <p className={`mt-5 text-[12px] uppercase tracking-[0.08em] ${dark ? 'text-white/50' : 'text-stone-400'}`}>{meta.join(' · ')}</p>
              </FadeIn>
            )}

            {f.showPrice && (
              <FadeIn delay={next()}>
                <p className="mt-7 flex items-baseline flex-wrap gap-3.5">
                  <strong className="font-display font-medium text-[32px] tracking-[0.03em] text-accent">{formatPrice(product.price)}</strong>
                  {f.oldPrice > product.price && (
                    <del className={`text-base ${dark ? 'text-white/50' : 'text-stone-400'}`}>{formatPrice(f.oldPrice)}</del>
                  )}
                </p>
              </FadeIn>
            )}

            <FadeIn delay={next()}>
              <div className="mt-8 flex flex-wrap gap-3.5">
                {product.isAvailable ? (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className={`btn-solid w-full sm:w-auto ${justAdded ? '!bg-emerald-700' : '!bg-accent hover:!bg-[#8E1B1B]'}`}
                  >
                    {justAdded ? (
                      <>
                        <Check className="w-4 h-4" /> Ajouté au panier
                      </>
                    ) : (
                      <>
                        {!product.isCustomizable && <Plus className="w-4 h-4" />}
                        {f.button.trim() || (product.isCustomizable ? 'Composer ma soupe' : 'Ajouter au panier')}
                      </>
                    )}
                  </button>
                ) : (
                  <span className="btn-solid !bg-stone-300 !text-stone-600 !cursor-not-allowed">Épuisé</span>
                )}
                {f.button2 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                    className={`btn-outline w-full sm:w-auto ${dark ? 'text-white hover:bg-white hover:text-ink' : 'text-ink hover:bg-ink hover:text-white hover:border-ink'}`}
                  >
                    {f.button2}
                  </button>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};
