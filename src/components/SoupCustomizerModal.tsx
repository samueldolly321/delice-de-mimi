import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, ShoppingBag } from 'lucide-react';
import { Product, SoupTopping } from '../types';
import { resolveAvailableToppings } from '../data/homeContent';
import { useCart } from '../context/CartContext';

interface SoupCustomizerModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const SoupCustomizerModal: React.FC<SoupCustomizerModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart, setIsCartOpen, formatPrice, settings } = useCart();
  // Garnitures disponibles, telles que définies dans l'administration
  const toppings = resolveAvailableToppings(settings);

  const [selectedToppings, setSelectedToppings] = useState<SoupTopping[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const basePrice = product.price || 10000;

  const toppingsTotal = useMemo(() => {
    return selectedToppings.reduce((sum, t) => sum + t.price, 0);
  }, [selectedToppings]);

  const unitPrice = basePrice + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (topping: SoupTopping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    const fullNotes = customNotes.trim();

    addToCart(product, quantity, selectedToppings, unitPrice, fullNotes);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      setIsCartOpen(true);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] w-full max-w-4xl rounded-3xl shadow-2xl border border-[#E6DECF] overflow-hidden animate-in zoom-in-95 duration-200 my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#000000] via-[#A82020] to-[#111111] text-white p-5 sm:p-7">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full bg-[#C62828] text-[#1F1F1F] text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              ✨ Atelier Sur-Mesure
            </span>
            <span className="text-xs text-white/80 font-medium">Spécialité du Chef</span>
          </div>

          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#E9D9B4]">
            {product.name}
          </h3>

          <p className="text-xs sm:text-sm text-white/90 mt-1.5 max-w-2xl leading-relaxed">
            Composez votre grand bol de soupe impériale selon vos envies à partir de notre base traditionnelle mijotée 12h et de nos garnitures d'exception.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-7 flex-1 overflow-y-auto">
          {/* Base Inclus Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E6DECF] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-[#E9D9B4] shadow-xs">
                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'}
                    alt="Base Soupe"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1F1F1F]">Base Tarifaire Essentielle</h4>
                  <p className="text-xs text-stone-500">Inclus d'office dans votre grand bol impérial</p>
                </div>
              </div>
              <span className="font-serif text-base sm:text-lg font-extrabold text-[#111111] bg-[#111111]/10 px-4 py-1.5 rounded-xl self-start sm:self-auto border border-[#111111]/20">
                {formatPrice(basePrice)}
              </span>
            </div>

            <div className="mt-3.5 pt-3.5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-stone-700">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Bouillon parfumé 12h</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Nouilles artisanales</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Légumes & pak choï</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Raviolis demi-lune base</span>
              </div>
            </div>
          </div>

          {/* Garnitures au Choix Libre avec grandes photos culinaires */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 pb-2 border-b border-[#E6DECF]/70">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                  <span>Garnitures au choix libre</span>
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Photos de nos garnitures fraîches. Cliquez sur un ingrédient pour l'ajouter à votre soupe.
                </p>
              </div>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#111111]/10 text-[#000000] border border-[#111111]/20 shrink-0 self-start sm:self-auto">
                {selectedToppings.length} garniture{selectedToppings.length > 1 ? 's' : ''} choisie{selectedToppings.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {toppings.map((topping) => {
                const isChecked = selectedToppings.some((t) => t.id === topping.id);

                return (
                  <button
                    key={topping.id}
                    type="button"
                    onClick={() => toggleTopping(topping)}
                    id={`topping-btn-${topping.id}`}
                    className={`group relative rounded-2xl overflow-hidden border-2 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between bg-white shadow-xs hover:shadow-lg ${
                      isChecked
                        ? 'border-[#111111] ring-4 ring-[#111111]/15 scale-[1.01]'
                        : 'border-[#E6DECF]/90 hover:border-[#C62828]'
                    }`}
                  >
                    {/* Grande Image Culinaire Mise en Avant */}
                    <div className="relative w-full h-40 sm:h-44 overflow-hidden bg-stone-100 shrink-0">
                      {topping.image ? (
                        <img
                          src={topping.image}
                          alt={topping.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-amber-50">
                          {topping.icon}
                        </div>
                      )}

                      {/* Dégradé d'ombrage élégant pour le contraste */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/20 pointer-events-none" />

                      {/* Badge Prix Flottant en Haut à Gauche */}
                      <div className="absolute top-2.5 left-2.5 pointer-events-none">
                        <span className="inline-flex items-center gap-1 bg-black/80 backdrop-blur-md text-[#E9D9B4] px-2.5 py-1 rounded-xl text-xs font-black shadow-md border border-white/15">
                          +{formatPrice(topping.price)}
                        </span>
                      </div>

                      {/* Badge Statut en Haut à Droite */}
                      <div className="absolute top-2.5 right-2.5 pointer-events-none">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 bg-[#111111] text-white px-2.5 py-1 rounded-xl text-xs font-bold shadow-md animate-in zoom-in-75 duration-200">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Choisi</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-white/90 text-stone-800 px-2.5 py-1 rounded-xl text-xs font-semibold shadow-sm backdrop-blur-xs group-hover:bg-[#C62828] group-hover:text-stone-900 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Ajouter</span>
                          </span>
                        )}
                      </div>

                      {/* Nom et icône ancrés sur l'image */}
                      <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
                        <div className="flex items-center gap-1.5 drop-shadow-md">
                          <span className="text-lg shrink-0">{topping.icon}</span>
                          <span className="text-xs sm:text-sm font-serif font-bold leading-snug line-clamp-1 text-white drop-shadow-sm">
                            {topping.name.replace('Supplément ', '')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu textuel et description */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between w-full">
                      {topping.description && (
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 min-h-[32px]">
                          {topping.description}
                        </p>
                      )}

                      {/* Bouton d'action interactif en pied de carte */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className={`font-bold transition-colors ${isChecked ? 'text-[#111111]' : 'text-stone-700'}`}>
                          {isChecked ? '✓ Sélectionné' : `+${formatPrice(topping.price)}`}
                        </span>

                        <div
                          className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                            isChecked
                              ? 'bg-[#111111] text-white shadow-xs'
                              : 'bg-stone-100 group-hover:bg-[#C62828]/25 text-stone-700'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Inclus</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Choisir</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions du client */}
          <div>
            <label className="text-[11px] font-semibold text-stone-600 block mb-1">
              Instructions particulières pour ce bol (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex. Coriandre à part, bouillon très chaud..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Récapitulatif dynamique des coûts */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-[#E9D9B4] text-xs space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Base Soupe Demi-Lune :</span>
              <span className="font-semibold text-stone-800">{formatPrice(basePrice)}</span>
            </div>

            {selectedToppings.length > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>
                  Garnitures ({selectedToppings.length}) :
                </span>
                <span className="font-semibold text-[#000000]">+{formatPrice(toppingsTotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-[#E9D9B4]/60 font-bold text-sm">
              <span className="text-[#1F1F1F]">Prix par bol :</span>
              <span className="font-serif text-base text-[#111111]">{formatPrice(unitPrice)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Quantity and Submit */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#E6DECF] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-700">Quantité :</span>
            <div className="flex items-center border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 px-3 hover:bg-stone-200 text-stone-700 transition-colors"
                aria-label="Diminuer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="px-3 text-xs font-bold text-[#1F1F1F] min-w-[24px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="p-2 px-3 hover:bg-stone-200 text-stone-700 transition-colors"
                aria-label="Augmenter"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAddToCart}
            id="confirm-soup-customizer-btn"
            className="w-full sm:w-auto flex-1 bg-[#111111] hover:bg-[#000000] text-white py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Ajouté au panier !</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>
                  Ajouter au panier • {formatPrice(totalPrice)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
