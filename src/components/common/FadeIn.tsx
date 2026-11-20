import React from 'react';
import { motion } from 'motion/react';

interface FadeInProps {
  children: React.ReactNode;
  /** Délai avant le début de l'animation, en secondes. Utile pour un effet en cascade. */
  delay?: number;
  /** Distance (en px) dont l'élément se déplace verticalement pendant l'apparition. */
  distance?: number;
  /** Durée de l'animation, en secondes. */
  duration?: number;
  className?: string;
}

/**
 * Fait apparaître son contenu en fondu (+ léger mouvement vers le haut)
 * lorsque l'élément entre dans la zone visible de l'écran.
 * L'animation ne se joue qu'une seule fois par élément (pas à chaque scroll).
 */
export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  distance = 24,
  duration = 0.6,
  className,
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};
