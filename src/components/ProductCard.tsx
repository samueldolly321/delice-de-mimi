import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
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
 * Fiche plat « visuel 2 » : photo avec le prix en rouge dans une étiquette
 * blanche posée en bas à droite, nom en capitales espacées, description,
 * puis un petit trait et le bouton d'ajout.
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

  const details = [
    product.preparationTime,
    product.spiceLevel !== undefined && product.spiceLevel > 0 ? (product.spiceLevel === 1 ? 'Doux' : 'Épicé') : null,
  ].filter(Boolean);

  return (
    <div id={`product-card-${product.id}`} className="group h-full flex flex-col">
      {/* Photo + étiquette de prix */}
      <div className="relative aspect-[3/2] overflow-hidden bg-stone-200">
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 ${
            product.isAvailable ? '' : 'grayscale opacity-60'
          }`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {badgeLabel && (
          <span className="absolute top-0 left-0 bg-black text-white label-caps text-[9px] px-3 py-1.5">{badgeLabel}</span>
        )}

        <span className="absolute bottom-0 right-0 bg-white font-display text-accent text-[17px] tracking-wide px-5 py-2.5">
          {formatPrice(product.price)}
        </span>
      </div>

      {/* Texte */}
      <h3 className="mt-7 label-caps text-[13px] text-ink leading-snug">{product.name}</h3>
      {product.description && (
        <p className="mt-3 text-[14px] text-stone-500 leading-[1.7] line-clamp-2">{product.description}</p>
      )}
      {details.length > 0 && <p className="mt-2 text-[12px] text-stone-400">{details.join(' · ')}</p>}

      <div className="mt-auto pt-6 flex items-center justify-between gap-4">
        <span className="dash" />
        <button
          onClick={handleAdd}
          disabled={!product.isAvailable}
          title={product.isCustomizable ? 'Personnaliser ma soupe' : product.isAvailable ? 'Ajouter au panier' : 'Épuisé'}
          className={`inline-flex items-center gap-2 label-caps text-[10px] px-4 py-2.5 rounded-[3px] transition-colors ${
            justAdded
              ? 'bg-emerald-700 text-white'
              : product.isAvailable
              ? 'bg-ink text-white hover:bg-accent cursor-pointer'
              : 'bg-stone-200 text-stone-500 cursor-not-allowed'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" /> Ajouté
            </>
          ) : product.isCustomizable ? (
            'Composer'
          ) : product.isAvailable ? (
            <>
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </>
          ) : (
            'Épuisé'
          )}
        </button>
      </div>
    </div>
  );
};
