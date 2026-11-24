import React, { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

/**
 * Appel à l'action toujours visible sur mobile, une fois la photo d'accueil passée :
 * - panier vide : « Commander » descend vers la carte ;
 * - panier rempli : affiche le nombre d'articles et le total, et ouvre le panier.
 */
export const StickyOrderBar: React.FC = () => {
  const { itemCount, subtotal, formatPrice, setIsCartOpen, settings } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (settings.isOrderingEnabled === false) return null;

  const hasItems = itemCount > 0;

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-30 p-3 bg-white/95 backdrop-blur border-t border-hairline transition-transform duration-300 ${
        visible || hasItems ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <button
        type="button"
        id="sticky-order-cta"
        onClick={() =>
          hasItems ? setIsCartOpen(true) : document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })
        }
        className="w-full flex items-center justify-center gap-3 bg-accent hover:bg-[#8E1B1B] text-white rounded-[3px] py-3.5 label-caps text-[12px] cursor-pointer transition-colors"
      >
        <ShoppingBag className="w-4 h-4" strokeWidth={2} />
        {hasItems ? (
          <span>
            Voir mon panier · {itemCount} article{itemCount > 1 ? 's' : ''} · {formatPrice(subtotal)}
          </span>
        ) : (
          <span>Commander maintenant</span>
        )}
      </button>
    </div>
  );
};
