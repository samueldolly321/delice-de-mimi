import React, { useState } from 'react';
import { Plus, Check, Flame, Clock, Award, Gift } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onCustomize?: (product: Product) => void;
}

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

  const renderBadgeBlock = (badge: string, promoNote?: string) => {
    switch (badge) {
      case 'Populaire':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase shadow-lg shadow-amber-950/40 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white border border-amber-300/60 backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 fill-amber-200 text-amber-200 shrink-0" />
            <span>Populaire</span>
          </span>
        );
      case 'Nouveau':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase shadow-lg shadow-emerald-950/40 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border border-emerald-300/60 backdrop-blur-md">
            <span>Nouveau</span>
          </span>
        );
      case 'Chef':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase shadow-lg shadow-red-950/40 bg-gradient-to-r from-[#C62828] via-red-700 to-[#8E1B1B] text-white border border-[#FFE082]/60 backdrop-blur-md">
            <Award className="w-3.5 h-3.5 text-[#FFE082] shrink-0" />
            <span>Spécialité Chef</span>
          </span>
        );
      case 'Promotion':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase shadow-lg shadow-orange-950/40 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 text-white border border-orange-300/60 backdrop-blur-md">
            <Gift className="w-3.5 h-3.5 text-white shrink-0" />
            <span>{promoNote || 'Promotion'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-stone-900/90 text-white border border-white/20">
            {badge}
          </span>
        );
    }
  };

  return (
    <div
      id={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-[#EBDCC5]/70 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#F4C542]/70 transition-all duration-300 flex flex-col justify-between"
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Gradient shadow for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Product Badge Block */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            {renderBadgeBlock(product.badge, product.promoNote)}
          </div>
        )}

        {/* Preparation time & spice indicator */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs drop-shadow-md">
          {product.preparationTime && (
            <span className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md font-medium text-[11px]">
              <Clock className="w-3 h-3 text-[#F4C542]" />
              {product.preparationTime}
            </span>
          )}

          {product.spiceLevel !== undefined && product.spiceLevel > 0 && (
            <span className="flex items-center gap-0.5 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md font-medium text-[11px] text-[#FFE082]">
              <Flame className="w-3 h-3 text-[#C62828] fill-[#C62828]" />
              {product.spiceLevel === 1 ? 'Doux' : 'Épicé'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F1F1F] group-hover:text-[#C62828] transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 mt-1.5 line-clamp-2 leading-relaxed font-normal">
            {product.description}
          </p>
        </div>

        {/* Footer with Price and Add to Cart Button */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-stone-600 tracking-wider">
              Prix unitaire
            </span>
            <span className="font-serif text-base sm:text-lg font-extrabold text-[#C62828]">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.isAvailable}
            title={product.isCustomizable ? 'Personnaliser ma soupe' : product.isAvailable ? 'Ajouter au panier' : 'Épuisé'}
            className={`relative flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all transform active:scale-95 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-md'
                : product.isCustomizable
                ? 'bg-[#1F1F1F] hover:bg-black text-[#FFE082] border border-[#F4C542]/50 shadow-xs'
                : product.isAvailable
                ? 'bg-[#C62828] hover:bg-[#8E1B1B] text-white shadow-xs hover:shadow-md shadow-[#C62828]/20'
                : 'bg-stone-200 text-stone-600 cursor-not-allowed'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 animate-scale" />
                <span>Ajouté !</span>
              </>
            ) : product.isCustomizable ? (
              <>
                <span>Composer</span>
              </>
            ) : product.isAvailable ? (
              <>
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </>
            ) : (
              <span>Épuisé</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
