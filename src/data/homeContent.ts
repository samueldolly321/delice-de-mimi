import { HomeContent, HomeServiceItem, RestaurantSettings, SoupTopping } from '../types';
import { SOUP_TOPPINGS } from './seedData';

/** Textes d'origine de la page d'accueil : utilisés tant que l'admin n'a rien modifié. */
export const DEFAULT_SERVICES: HomeServiceItem[] = [
  { icon: 'leaf', title: 'Produits frais', text: 'Ingrédients sélectionnés chaque matin auprès des producteurs locaux.' },
  { icon: 'chef', title: 'Fait maison', text: 'Pâtes pétries, nems dorés et bouillons mijotés selon la tradition.' },
  { icon: 'soup', title: 'Sur place ou à emporter', text: 'Préparé minute, servi chaud et soigné, à récupérer quand vous voulez.' },
  { icon: 'bike', title: 'Livraison rapide', text: 'Livraison express à domicile partout à Antananarivo.' },
];

export const DEFAULT_HOME_CONTENT: Required<HomeContent> = {
  aboutTitle: 'Notre maison',
  aboutLabel: 'Notre histoire',
  aboutButton: 'Découvrir la carte',
  philosophyLabel: 'Notre philosophie',
  philosophyImage: '',
  soupBandTitle: "L'art de la soupe",
  soupBandText:
    'Bouillon mijoté 12 heures, nouilles artisanales et raviolis demi-lune. Composez votre bol avec les garnitures de votre choix.',
  soupBandButton: 'Composer ma soupe',
  soupBandImageLeft: '',
  soupBandImageCenter: '',
  soupBandImageRight: '',
  menuTitle: 'La carte',
  menuSubtitle: 'Des recettes généreuses, préparées à la commande avec des ingrédients frais.',
  servicesTitle: 'Nos engagements',
  servicesIntro: "Une cuisine asiatique généreuse, préparée avec soin du marché jusqu'à votre table.",
  services: DEFAULT_SERVICES,
  contactTitle: 'Accès & réservation',
  contactIntro:
    "Une question sur la carte, une réservation de table ou un événement d'entreprise ? Écrivez-nous directement ici.",
};

/**
 * Contenu final de la page d'accueil : chaque champ rempli par l'admin
 * remplace la valeur par défaut ; un champ vidé revient au texte d'origine.
 */
export function resolveHomeContent(settings?: Partial<RestaurantSettings> | null): Required<HomeContent> {
  const custom = settings?.home || {};
  const merged = { ...DEFAULT_HOME_CONTENT };
  (Object.keys(DEFAULT_HOME_CONTENT) as (keyof HomeContent)[]).forEach((key) => {
    const value = custom[key];
    if (key === 'services') {
      const list = Array.isArray(value) ? (value as HomeServiceItem[]).filter((s) => s && (s.title || '').trim()) : [];
      if (list.length > 0) merged.services = list;
    } else if (typeof value === 'string' && value.trim() !== '') {
      (merged as Record<string, unknown>)[key] = value;
    }
  });
  return merged;
}

/** Toutes les garnitures (liste de l'admin, sinon la liste d'origine). */
export function resolveAllToppings(settings?: Partial<RestaurantSettings> | null): SoupTopping[] {
  const list = settings?.soupToppings;
  return Array.isArray(list) && list.length > 0 ? list : SOUP_TOPPINGS;
}

/** Garnitures proposées aux clients (celles marquées disponibles). */
export function resolveAvailableToppings(settings?: Partial<RestaurantSettings> | null): SoupTopping[] {
  return resolveAllToppings(settings).filter((t) => t.isAvailable !== false);
}
