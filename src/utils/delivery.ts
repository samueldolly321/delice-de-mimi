import type { Order, RestaurantSettings } from '../types';

/**
 * Frais de livraison : le montant exact dépend du lieu et est fixé par
 * l'équipe (admin) après la commande. Au moment de la commande, on enregistre
 * 0 Ar et on affiche « à partir de <minimum> » (minimum = settings.deliveryFee).
 */

/** Livraison offerte grâce au seuil de commande (0 = seuil désactivé). */
export function isFreeDeliveryBySubtotal(subtotal: number, settings: Pick<RestaurantSettings, 'freeDeliveryThreshold'>): boolean {
  const threshold = settings.freeDeliveryThreshold || 0;
  return threshold > 0 && subtotal >= threshold;
}

export type DeliveryFeeStatus = 'takeaway' | 'offered' | 'set' | 'pending';

/**
 * - takeaway : retrait sur place, pas de frais
 * - offered  : livraison offerte (fidélité ou seuil atteint)
 * - set      : frais fixés par l'admin (order.deliveryFee > 0)
 * - pending  : frais pas encore fixés → « à partir de <minimum> »
 */
export function getDeliveryFeeStatus(
  order: Pick<Order, 'deliveryType' | 'deliveryFee' | 'subtotal' | 'loyaltyReward'>,
  settings: Pick<RestaurantSettings, 'freeDeliveryThreshold'>
): DeliveryFeeStatus {
  if (order.deliveryType === 'takeaway' || (order.deliveryType as string) === 'pickup') return 'takeaway';
  if (order.deliveryFee > 0) return 'set';
  if (order.loyaltyReward === 'free_delivery' || order.loyaltyReward === 'free_delivery_and_soup') return 'offered';
  if (isFreeDeliveryBySubtotal(order.subtotal, settings)) return 'offered';
  return 'pending';
}

export function formatAriary(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} Ar`;
}

/** Texte de la ligne « frais de livraison » (facture, notifications, récap). */
export function deliveryFeeLabel(
  order: Pick<Order, 'deliveryType' | 'deliveryFee' | 'subtotal' | 'loyaltyReward'>,
  settings: Pick<RestaurantSettings, 'freeDeliveryThreshold' | 'deliveryFee'>
): string {
  switch (getDeliveryFeeStatus(order, settings)) {
    case 'takeaway':
      return '0 Ar (À récupérer)';
    case 'offered':
      return 'Offerte';
    case 'set':
      return formatAriary(order.deliveryFee);
    default:
      return `à partir de ${formatAriary(settings.deliveryFee)}`;
  }
}
