import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onCustomize?: (product: Product) => void;
}

const BADGE_LABELS: Record<string, string> = {
  Populaire: 'Populaire',
  Nouveau: 'Nouveau',
  Chef: 'Spécialité du chef',
};

/**
 * Fiche plat façon « vitrine » : une cellule de grille à fines bordures,
 * la photo au centre, le nom en serif et le prix en petites capitales dorées.
 * Le bouton d'ajout apparaît en contour fin sous le prix.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onCustomize }) => {
  const { addToCart, formatPrice } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isCustomizable && onCustomize) {
      onCustomize(product);
      return;
    }
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  const badgeLabel = product.badge
    ? product.badge === 'Promotion'
      ? product.promoNote || 'Promotion'
      : BADGE_LABELS[product.badge] || product.badge
    : null;

  const buttonLabel = justAdded
    ? 'Ajouté ✓'
    : product.isCustomizable
    ? 'Composer'
    : product.isAvailable
    ? 'Ajouter au panier'
    : 'Épuisé';

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative h-full bg-white flex flex-col items-center text-center px-6 pt-7 pb-10 sm:px-8"
    >
      {/* Étiquette (ligne réservée même vide pour garder les photos alignées) */}
      <div className="h-4 mb-4 label-caps text-[10px] text-gold">{badgeLabel}</div>

      {/* Photo */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
            product.isAvailable ? '' : 'grayscale opacity-60'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Nom, description et prix */}
      <h3 className="mt-7 font-serif text-lg sm:text-xl text-cocoa leading-snug">{product.name}</h3>

      {product.description && (
        <p className="mt-2 text-sm text-stone-500 font-light leading-relaxed line-clamp-2 max-w-sm">
          {product.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 text-[12px] italic tracking-[0.12em] text-gold">
        <span>{formatPrice(product.price)}</span>
        {product.preparationTime && (
          <span className="not-italic text-stone-400 tracking-normal text-[11px]">· {product.preparationTime}</span>
        )}
        {product.spiceLevel !== undefined && product.spiceLevel > 0 && (
          <span className="not-italic text-stone-400 tracking-normal text-[11px]">
            · {product.spiceLevel === 1 ? 'Doux' : 'Épicé'}
          </span>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={!product.isAvailable}
        title={product.isCustomizable ? 'Personnaliser ma soupe' : product.isAvailable ? 'Ajouter au panier' : 'Épuisé'}
        className={`btn-outline mt-6 !py-2.5 !px-5 !text-[11px] ${
          justAdded
            ? 'bg-ink text-white border-ink'
            : product.isAvailable
            ? 'text-ink border-ink/30 hover:bg-ink hover:text-white hover:border-ink'
            : 'text-stone-400 border-stone-200 cursor-not-allowed'
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};
