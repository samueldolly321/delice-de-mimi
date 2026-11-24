import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Store, User, UserCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    setIsCheckoutOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    isFreeDelivery,
    minDeliveryFee,
    deliveryType,
    setDeliveryType,
    formatPrice,
    settings,
  } = useCart();

  const { customer, isLoggedIn, requireAuthToOrder } = useCustomerAuth();

  if (!isCartOpen) return null;

  const remainingForFreeDelivery = settings.freeDeliveryThreshold - subtotal;

  const handleProceedToCheckout = () => {
    if (!isLoggedIn) {
      requireAuthToOrder();
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFFFF] shadow-2xl flex flex-col justify-between border-l border-[#E6DECF] animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-[#E6DECF] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1C2B4A] text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                  Mon Panier Délice
                </h3>
                <span className="text-xs text-stone-500 font-medium">
                  {items.length} article{items.length > 1 ? 's' : ''} sélectionné{items.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery vs Takeaway Switcher */}
          <div className="p-4 bg-amber-50/50 border-b border-[#E6DECF]/60">
            <div className="grid grid-cols-2 gap-2 bg-stone-200/60 p-1 rounded-xl">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryType === 'delivery'
                    ? 'bg-white text-[#1C2B4A] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Livraison</span>
              </button>
              <button
                onClick={() => setDeliveryType('takeaway')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryType === 'takeaway'
                    ? 'bg-white text-[#1C2B4A] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>À récupérer</span>
              </button>
            </div>

            {/* Free Delivery Bar for delivery mode */}
            {deliveryType === 'delivery' && settings.freeDeliveryThreshold > 0 && (
              <div className="mt-3">
                {remainingForFreeDelivery > 0 ? (
                  <p className="text-[11px] text-stone-600 text-center">
                    Ajoutez encore <strong className="text-[#1C2B4A]">{formatPrice(remainingForFreeDelivery)}</strong> pour bénéficier de la <span className="underline decoration-[#B8975A]">livraison offerte</span> !
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-700 font-bold text-center flex items-center justify-center gap-1">
                    Félicitations ! Vous bénéficiez de la livraison offerte.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-serif text-base font-bold text-[#1F1F1F]">
                  Votre panier est vide
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Découvrez nos délicieuses soupes chinoises, mine sao croustillantes et beignets dorés.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-5 py-2.5 bg-[#1C2B4A] text-white text-xs font-semibold rounded-xl hover:bg-[#0F1A30] transition-colors"
                >
                  Voir les spécialités
                </button>
              </div>
            ) : (
              items.map((item) => {
                const effectiveUnit = item.unitPrice !== undefined ? item.unitPrice : item.product.price;
                const itemId = item.id || item.product.id;

                return (
                  <div
                    key={itemId}
                    className="bg-white p-3.5 rounded-xl border border-[#E6DECF]/70 flex items-start gap-3 shadow-2xs group"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg shrink-0 mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-[#1F1F1F] truncate">
                        {item.product.name}
                      </h5>

                      {/* Garnitures au choix si présentes */}
                      {item.selectedToppings && item.selectedToppings.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.selectedToppings.map((top) => (
                            <span
                              key={top.id}
                              className="inline-flex items-center text-[10px] bg-amber-50 text-[#0F1A30] px-1.5 py-0.5 rounded border border-[#E9D9B4]/70 font-semibold"
                            >
                              +{top.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Instructions / Notes personnalisées */}
                      {item.customNotes && (
                        <div className="text-[10px] text-stone-500 italic mt-1 bg-stone-50 p-1 rounded">
                          {item.customNotes}
                        </div>
                      )}

                      <div className="text-xs font-semibold text-[#1C2B4A] mt-1">
                        {formatPrice(effectiveUnit)} / unité
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(itemId, -1)}
                            className="p-1 px-2 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            aria-label="Diminuer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-[#1F1F1F]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, 1)}
                            className="p-1 px-2 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            aria-label="Augmenter"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Total for this line */}
                        <span className="text-xs font-extrabold text-stone-800">
                          {formatPrice(effectiveUnit * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(itemId)}
                      className="p-1.5 text-stone-300 hover:text-red-600 transition-colors cursor-pointer"
                      title="Supprimer l'article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Calculations and Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E6DECF] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={clearCart}
                  className="text-stone-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider le panier</span>
                </button>
                <span className="text-stone-400">•</span>
                <span className="text-stone-500">Service emballage soigné inclus</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-stone-100 text-xs">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="font-bold text-[#1F1F1F]">Montant de la nourriture</span>
                  <span className="font-serif text-lg font-extrabold text-[#1C2B4A]">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-stone-600">
                  <span>+ Frais de livraison</span>
                  <span className="font-semibold text-right">
                    {deliveryType === 'takeaway' ? (
                      <span className="text-emerald-600 font-bold">0 Ar (À récupérer)</span>
                    ) : isFreeDelivery ? (
                      <span className="text-emerald-600 font-bold">Offerte</span>
                    ) : (
                      <span className="text-[#1C2B4A] font-bold">à partir de {formatPrice(minDeliveryFee)}</span>
                    )}
                  </span>
                </div>
                {deliveryType === 'delivery' && !isFreeDelivery && (
                  <p className="text-[10px] text-stone-400 text-right">
                    Montant exact selon votre lieu, confirmé par notre équipe.
                  </p>
                )}
              </div>

              {/* Auth Status Notice */}
              {!isLoggedIn ? (
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-amber-900">
                  <span className="font-medium">
                    S'enregistrer pour commander (juste téléphone ou email)
                  </span>
                  <button
                    type="button"
                    onClick={() => requireAuthToOrder()}
                    className="text-[#1C2B4A] font-bold hover:underline shrink-0 ml-2"
                  >
                    Connexion
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 flex items-center gap-2 text-[11px] text-emerald-900">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Client : <strong className="font-bold">{customer?.fullName}</strong> ({customer?.phone || customer?.email})
                  </span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                id="btn-checkout-drawer"
                className="w-full bg-[#1C2B4A] hover:bg-[#0F1A30] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#1C2B4A]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Finaliser ma commande</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
