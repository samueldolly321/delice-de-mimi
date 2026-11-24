import React from 'react';
import { Leaf, ChefHat, Soup, Bike, Clock, Heart, Star, Utensils, Award, Phone, LucideProps } from 'lucide-react';
import { ServiceIconName } from '../../types';

/** Icônes disponibles pour les engagements (choisies dans l'administration). */
export const SERVICE_ICONS: Record<ServiceIconName, { label: string; Icon: React.FC<LucideProps> }> = {
  leaf: { label: 'Feuille (frais)', Icon: Leaf },
  chef: { label: 'Toque (fait maison)', Icon: ChefHat },
  soup: { label: 'Bol de soupe', Icon: Soup },
  bike: { label: 'Livraison', Icon: Bike },
  clock: { label: 'Horloge (rapidité)', Icon: Clock },
  heart: { label: 'Cœur (passion)', Icon: Heart },
  star: { label: 'Étoile (qualité)', Icon: Star },
  utensils: { label: 'Couverts', Icon: Utensils },
  award: { label: 'Médaille', Icon: Award },
  phone: { label: 'Téléphone', Icon: Phone },
};

export const ServiceIcon: React.FC<{ name: ServiceIconName } & LucideProps> = ({ name, ...props }) => {
  const { Icon } = SERVICE_ICONS[name] || SERVICE_ICONS.leaf;
  return <Icon {...props} />;
};
