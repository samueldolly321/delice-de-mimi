import { BadgeDef, Product, RestaurantSettings } from '../types';

/** Étiquettes d'origine : utilisées tant que l'admin n'a rien modifié. */
export const DEFAULT_BADGES: BadgeDef[] = [
  { id: 'Populaire', label: 'Populaire', bg: '#c62828', color: '#ffffff', filter: true, filterLabel: 'Populaires' },
  { id: 'Nouveau', label: 'Nouveau', bg: '#2e7d32', color: '#ffffff', filter: true, filterLabel: 'Nouveautés' },
  { id: 'Chef', label: 'Spécialité du chef', bg: '#c9a050', color: '#111111', filter: false, filterLabel: '' },
  { id: 'Promotion', label: 'Promotion', bg: '#ef6c00', color: '#ffffff', filter: false, filterLabel: '' },
];

/** Complète une couleur courte (#fff) en couleur longue (#ffffff), sinon renvoie la couleur par défaut. */
export function normalizeHex(value: unknown, fallback: string): string {
  const v = typeof value === 'string' ? value.trim() : '';
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return ('#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]).toLowerCase();
  return fallback;
}

/** Étiquettes en vigueur (liste de l'admin, sinon la liste d'origine). */
export function resolveBadges(settings?: Partial<RestaurantSettings> | null): BadgeDef[] {
  const list = settings?.home?.badges;
  return Array.isArray(list) && list.length > 0 ? list : DEFAULT_BADGES;
}

/** Étiquette d'un plat, ou null si le plat n'en a pas (ou si elle a été supprimée). */
export function findBadge(badges: BadgeDef[], id?: string | null): BadgeDef | null {
  if (!id) return null;
  return badges.find((b) => b.id === id) || null;
}

/** Texte affiché sur le plat : la note du plat (ex. « -20 % ») remplace le nom de l'étiquette. */
export function badgeText(badge: BadgeDef, product: Pick<Product, 'promoNote'>): string {
  return (product.promoNote || '').trim() || badge.label;
}

/** Nouvel identifiant d'étiquette à partir de son nom. */
export function badgeIdFromLabel(label: string, existing: string[]): string {
  const slug =
    label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'etiquette';
  let id = `b-${slug}`;
  let n = 2;
  while (existing.includes(id)) id = `b-${slug}-${n++}`;
  return id;
}
