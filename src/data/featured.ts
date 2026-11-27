import { FeaturedImageFocus, FeaturedImageRatio, FeaturedSettings, Product, RestaurantSettings } from '../types';

/** Réglages d'origine du bloc « Notre coup de cœur ». */
export const DEFAULT_FEATURED: Required<FeaturedSettings> = {
  enabled: true,
  productId: '',
  sectionTitle: 'Notre coup de cœur',
  sectionIntro: '',
  label: 'Le plat du moment',
  badge: 'Recommandé par le chef',
  title: '',
  text: '',
  highlights: '',
  image: '',
  imageFit: 'cover',
  imageRatio: '4-3',
  imageFocus: 'center',
  oldPrice: 0,
  showPrice: true,
  showMeta: true,
  button: '',
  button2: 'Voir toute la carte',
  imageSide: 'left',
  background: 'white',
};

export const FEATURED_RATIOS: Record<FeaturedImageRatio, { label: string; css: string }> = {
  '1-1': { label: 'Carré (1:1)', css: '1 / 1' },
  '4-3': { label: 'Paysage (4:3)', css: '4 / 3' },
  '3-2': { label: 'Paysage (3:2)', css: '3 / 2' },
  '16-9': { label: 'Large (16:9)', css: '16 / 9' },
  '4-5': { label: 'Portrait (4:5)', css: '4 / 5' },
  '3-4': { label: 'Portrait (3:4)', css: '3 / 4' },
};

export const FEATURED_FOCUSES: Record<FeaturedImageFocus, string> = {
  center: 'Centre',
  top: 'Haut',
  bottom: 'Bas',
  left: 'Gauche',
  right: 'Droite',
};

/** Réglages enregistrés, complétés par les valeurs d'origine. */
export function resolveFeatured(settings?: Partial<RestaurantSettings> | null): Required<FeaturedSettings> {
  const saved = settings?.home?.featured || {};
  const merged = { ...DEFAULT_FEATURED };
  (Object.keys(DEFAULT_FEATURED) as (keyof FeaturedSettings)[]).forEach((key) => {
    const v = saved[key];
    if (v !== undefined && v !== null) (merged as Record<string, unknown>)[key] = v;
  });
  if (!FEATURED_RATIOS[merged.imageRatio]) merged.imageRatio = '4-3';
  if (!FEATURED_FOCUSES[merged.imageFocus]) merged.imageFocus = 'center';
  return merged;
}

/** Plat choisi, sinon un plat « Spécialité du chef », sinon « Populaire », sinon le premier plat. */
export function pickFeaturedProduct(products: Product[], productId?: string): Product | null {
  if (products.length === 0) return null;
  if (productId) {
    const chosen = products.find((p) => p.id === productId);
    if (chosen) return chosen;
  }
  return (
    products.find((p) => p.badge === 'Chef' && p.isAvailable) ||
    products.find((p) => p.badge === 'Populaire' && p.isAvailable) ||
    products.find((p) => p.isAvailable) ||
    products[0]
  );
}

/**
 * Demande à Unsplash une image plus grande et plus nette (les photos de démonstration
 * sont souvent en 800 px). Les autres images (importées) sont renvoyées telles quelles.
 */
export function sharperImage(url: string, width: number, height?: number): string {
  if (!/^https:\/\/images\.unsplash\.com\//.test(url)) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    if (height) {
      u.searchParams.set('h', String(height));
      u.searchParams.set('fit', 'crop');
    } else {
      u.searchParams.delete('h');
    }
    u.searchParams.set('q', '85');
    u.searchParams.set('auto', 'format');
    return u.toString();
  } catch {
    return url;
  }
}

/** Jeu d'images Unsplash pour srcset (écrans haute densité), vide pour les autres images. */
export function sharperSrcSet(url: string, widths: number[], ratio?: number): string {
  if (!/^https:\/\/images\.unsplash\.com\//.test(url)) return '';
  return widths.map((w) => `${sharperImage(url, w, ratio ? Math.round(w / ratio) : undefined)} ${w}w`).join(', ');
}
