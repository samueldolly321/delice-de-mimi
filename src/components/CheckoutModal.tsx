import React, { useState, useEffect } from 'react';
import { deliveryFeeLabel } from '../utils/delivery';
import { X, CheckCircle2, Truck, Store, CreditCard, Banknote, Smartphone, ArrowLeft, Clock, MapPin, AlertCircle, UserCheck, LogIn } from 'lucide-react';
import { ConfettiBurst } from './common/ConfettiBurst';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { CustomerInfo, DeliveryType, PaymentMethod, Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { SocialIcon } from './SocialIcons';
import { validateContactPair } from '../utils/validation';
import { trackEvent } from '../utils/analytics';
import { Bell, Send } from 'lucide-react';

const ORDER_STATUS_STEPS: OrderStatus[] = [
  'Nouvelle',
  'Confirmée',
  'En préparation',
  'Prête',
  'En livraison',
  'Livrée',
];

export const CheckoutModal: React.FC = () => {
  const {
    items,
    isCheckoutOpen,
    setIsCheckoutOpen,
    subtotal,
    deliveryFee,
    total,
    isFreeDelivery,
    minDeliveryFee,
    deliveryType,
    setDeliveryType,
    clearCart,
    formatPrice,
    activeOrderConfirmation,
    setActiveOrderConfirmation,
    settings,
  } = useCart();

  const {
    customer: authCustomer,
    isLoggedIn,
    requireAuthToOrder,
    refreshOrders,
  } = useCustomerAuth();

  // Aperçu de la récompense fidélité « livraison offerte » (calcul définitif côté serveur).
  const willGetLoyaltyFreeDelivery =
    isLoggedIn &&
    !!authCustomer &&
    settings.loyaltyEnabled !== false &&
    deliveryType === 'delivery' &&
    !isFreeDelivery &&
    ((authCustomer.orderCount || 0) + 1) % (settings.loyaltyFreeDeliveryEvery || 5) === 0;

  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    district: 'Antanimena, Antananarivo',
    instructions: '',
  });

  // Sync with auth customer profile
  useEffect(() => {
    if (authCustomer) {
      setCustomer((prev) => ({
        ...prev,
        fullName: authCustomer.fullName || prev.fullName,
        phone: authCustomer.phone || prev.phone,
        email: authCustomer.email || prev.email,
        address: authCustomer.address || prev.address,
        district: authCustomer.district || prev.district || 'Antanimena, Antananarivo',
      }));
    }
  }, [authCustomer]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [mobileOperator, setMobileOperator] = useState<'mvola' | 'orange' | 'airtel'>('mvola');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  if (!isCheckoutOpen && !activeOrderConfirmation) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setActiveOrderConfirmation(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Must be logged in to order as requested by user
    if (!isLoggedIn) {
      requireAuthToOrder();
      return;
    }

    if (!customer.fullName.trim()) {
      setErrorMessage('Veuillez renseigner votre nom complet.');
      return;
    }
    const contactError = validateContactPair(customer.phone, customer.email);
    if (contactError) {
      setErrorMessage(contactError);
      return;
    }
    if (deliveryType === 'delivery' && !customer.address.trim()) {
      setErrorMessage('Veuillez renseigner une adresse de livraison.');
      return;
    }
    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerId: authCustomer?.id,
        customer: {
          ...customer,
          address: deliveryType === 'takeaway' || (deliveryType as string) === 'pickup' ? 'Retrait au restaurant (À récupérer)' : customer.address,
        },
        items: items.map((i) => ({
          productId: i.product.id,
          name: i.product.name,
          price: i.unitPrice !== undefined ? i.unitPrice : i.product.price,
          quantity: i.quantity,
          image: i.product.image,
          toppings: i.selectedToppings?.map((t) => t.name),
        })),
        subtotal,
        deliveryFee,
        total,
        deliveryType,
        paymentMethod,
      };

      const createdOrder = await api.createOrder(orderData);
      // Mesure d'audience (seulement si le visiteur l'a acceptée) : commande passée
      trackEvent('purchase', { transaction_id: createdOrder.id, value: createdOrder.total, currency: 'MGA' });
      clearCart();
      setIsCheckoutOpen(false);
      setActiveOrderConfirmation(createdOrder);
      // Immediately refresh customer order history
      refreshOrders();
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de la validation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================== CONFIRMATION VIEW =====================
  if (activeOrderConfirmation) {
    const currentStepIndex = ORDER_STATUS_STEPS.indexOf(activeOrderConfirmation.status);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-[#FFFFFF] w-full max-w-xl rounded-3xl shadow-2xl border border-[#E6DECF] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] relative">
          {activeOrderConfirmation.loyaltyReward && <ConfettiBurst />}
          {/* Header */}
          <div className="bg-[#111111] text-white p-6 text-center relative">
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-white/70 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-xs">
              <CheckCircle2 className="w-8 h-8 text-[#E9D9B4]" />
            </div>
            <h3 className="font-serif text-2xl font-bold">Commande confirmée !</h3>
            <p className="text-xs text-white/80 mt-1">
              Merci pour votre commande chez {settings.name}.
            </p>
            <div className="mt-3 inline-block bg-[#1F1F1F] text-[#E9D9B4] px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wide border border-[#C62828]/40">
              {activeOrderConfirmation.id}
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Status Live Tracker */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DECF] shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-[#1F1F1F] mb-3">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#111111]" />
                  Statut actuel :
                </span>
                <span className="bg-[#E9D9B4]/40 text-[#000000] px-2.5 py-0.5 rounded-md uppercase tracking-wider text-[11px]">
                  {activeOrderConfirmation.status}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid grid-cols-6 gap-1 pt-2">
                {ORDER_STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= (currentStepIndex === -1 ? 0 : currentStepIndex);
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isCurrent
                            ? 'bg-[#111111] text-white ring-4 ring-[#111111]/20'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        ✓
                      </div>
                      <span className="text-[9px] font-medium text-stone-600 mt-1 hidden sm:block truncate w-full">
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                <span>Temps estimé :</span>
                <span className="font-bold text-[#1F1F1F]">
                  {activeOrderConfirmation.estimatedDelivery || '30-40 min'}
                </span>
              </div>
            </div>

            {activeOrderConfirmation.loyaltyReward && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-xs flex items-start gap-2.5">
                <span className="text-xl leading-none">🎉</span>
                <div>
                  <p className="font-bold text-amber-800">Récompense fidélité débloquée !</p>
                  <p className="text-amber-700 mt-0.5">
                    {activeOrderConfirmation.loyaltyReward === 'free_delivery_and_soup'
                      ? `Livraison offerte et ${settings.loyaltyFreeSoupName || 'un plat'} offert sur cette commande. Merci pour votre fidélité !`
                      : activeOrderConfirmation.loyaltyReward === 'free_delivery'
                      ? 'Livraison offerte sur cette commande. Merci pour votre fidélité !'
                      : `${settings.loyaltyFreeSoupName || 'Un plat cadeau'} offert sur cette commande. Merci pour votre fidélité !`}
                  </p>
                </div>
              </div>
            )}

            {/* Order Details & Summary */}
            <div className="bg-white p-4 rounded-2xl border border-[#E6DECF] space-y-3 text-xs">
              <h4 className="font-bold text-[#1F1F1F] uppercase tracking-wider text-[11px] text-[#000000]">
                Récapitulatif des plats
              </h4>
              <div className="divide-y divide-stone-100">
                {activeOrderConfirmation.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-start">
                    <div className="pr-2">
                      <span className="text-stone-800 font-medium">
                        {item.quantity}x {item.name}
                      </span>
                      {item.toppings && item.toppings.length > 0 && (
                        <div className="text-[10px] text-[#000000] font-medium mt-0.5">
                          + {item.toppings.join(', ')}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-[#1F1F1F] shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-stone-200 space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Mode :</span>
                  <span className="font-semibold capitalize">
                    {activeOrderConfirmation.deliveryType === 'takeaway' || (activeOrderConfirmation.deliveryType as string) === 'pickup'
                      ? 'À récupérer (Retrait sur place)'
                      : 'Livraison à domicile'}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Adresse :</span>
                  <span className="font-semibold text-right max-w-xs">
                    {activeOrderConfirmation.customer.address} ({activeOrderConfirmation.customer.district})
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Contact :</span>
                  <span className="font-semibold">
                    {activeOrderConfirmation.customer.fullName} • {activeOrderConfirmation.customer.phone}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-sm font-bold">
                  <span>Montant de la nourriture :</span>
                  <span className="font-serif text-base text-[#111111]">
                    {formatPrice(activeOrderConfirmation.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>+ Frais de livraison :</span>
                  <span className="font-semibold">{deliveryFeeLabel(activeOrderConfirmation, settings)}</span>
                </div>
              </div>
            </div>

            {/* Notification Status Card */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5 text-emerald-900">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-emerald-900">
                    Alerte transmise en cuisine
                  </div>
                  <p className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
                    Le gérant a été notifié par email et sur son terminal ({settings.notificationEmail || settings.email}).
                  </p>
                </div>
              </div>

              {/* Instant WhatsApp bridge */}
              <div className="pt-2 border-t border-emerald-200/60">
                <a
                  href={
                    activeOrderConfirmation.notification?.whatsappUrl ||
                    `https://wa.me/${(settings.whatsappPhone || settings.notificationPhone || '261342088899').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Bonjour ${settings.name}, je viens de valider la commande ${activeOrderConfirmation.id} pour un montant de ${activeOrderConfirmation.total.toLocaleString('fr-FR')} Ar (${activeOrderConfirmation.customer.fullName} - ${activeOrderConfirmation.customer.phone}). Merci !`
                    )}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95"
                >
                  <SocialIcon platform="whatsapp" size={16} />
                  <span>Envoyer la commande au gérant sur WhatsApp</span>
                </a>
                <p className="text-[10px] text-center text-emerald-600 mt-1.5">
                  Recommandé pour un suivi en direct et une préparation express
                </p>
              </div>
            </div>
          </div>

          {/* Action button — pied de page fixe, toujours visible */}
          <div className="p-6 pt-4 bg-white border-t border-[#E6DECF]">
            <button
              onClick={handleClose}
              className="w-full bg-[#1F1F1F] hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Retourner sur le site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== FORM VIEW =====================
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E6DECF] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-white border-b border-[#E6DECF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
                Finaliser ma commande
              </h3>
              <p className="text-xs text-stone-500">
                Renseignez vos coordonnées pour la préparation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitOrder} className="flex flex-col flex-1 min-h-0">
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Delivery vs Takeaway */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider block">
              1. Mode de réception
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('delivery')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  deliveryType === 'delivery'
                    ? 'border-[#111111] bg-white ring-2 ring-[#111111]/10 shadow-xs'
                    : 'border-[#E6DECF] bg-white/60 hover:bg-white text-stone-600'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    deliveryType === 'delivery'
                      ? 'bg-[#111111] text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F1F1F]">Livraison</div>
                  <div className="text-[10px] text-stone-500">À votre adresse (35-45 min)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType('takeaway')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  deliveryType === 'takeaway'
                    ? 'border-[#111111] bg-white ring-2 ring-[#111111]/10 shadow-xs'
                    : 'border-[#E6DECF] bg-white/60 hover:bg-white text-stone-600'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    deliveryType === 'takeaway'
                      ? 'bg-[#111111] text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1F1F1F]">À récupérer</div>
                  <div className="text-[10px] text-stone-500">Retrait au restaurant (15-20 min)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider block">
                2. Vos coordonnées de commande
              </label>
              {authCustomer ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <UserCheck className="w-3.5 h-3.5" />
                  Compte client connecté ({authCustomer.phone || authCustomer.email})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={requireAuthToOrder}
                  className="text-xs text-[#111111] hover:underline font-bold flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Se connecter / S'enregistrer</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Aina Ravelojaona"
                  value={customer.fullName}
                  onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Téléphone (pour la livraison) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex. +261 34 12 345 67"
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Adresse e-mail (reçu de commande)
                </label>
                <input
                  type="email"
                  placeholder="Ex. aina@example.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Quartier / Ville
                </label>
                <input
                  type="text"
                  placeholder="Ex. Antanimena, Ankorondrano..."
                  value={customer.district}
                  onChange={(e) => setCustomer({ ...customer, district: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {deliveryType === 'delivery' && (
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  Adresse de livraison précise (Rue, numéro, repères) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex. Villa 14, Rue Pasteur, en face de la pharmacie"
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-stone-600 block mb-1">
                Instructions particulières (sans piment, couvert, code portail...)
              </label>
              <textarea
                rows={2}
                placeholder="Ex. Pas de piment, sauce soja sucrée en plus s'il vous plaît"
                value={customer.instructions}
                onChange={(e) => setCustomer({ ...customer, instructions: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider block">
              3. Moyen de paiement
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash_on_delivery')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  paymentMethod === 'cash_on_delivery'
                    ? 'border-[#111111] bg-white ring-2 ring-[#111111]/10'
                    : 'border-[#E6DECF] bg-white/60 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-[#111111]" />
                  <span className="text-xs font-bold text-[#1F1F1F]">À la livraison</span>
                </div>
                <span className="text-[10px] text-stone-500">Espèces au livreur</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('pay_on_site')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  paymentMethod === 'pay_on_site'
                    ? 'border-[#111111] bg-white ring-2 ring-[#111111]/10'
                    : 'border-[#E6DECF] bg-white/60 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#111111]" />
                  <span className="text-xs font-bold text-[#1F1F1F]">Sur place</span>
                </div>
                <span className="text-[10px] text-stone-500">Au comptoir / TPE</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_money')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  paymentMethod === 'mobile_money'
                    ? 'border-[#111111] bg-white ring-2 ring-[#111111]/10'
                    : 'border-[#E6DECF] bg-white/60 text-stone-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#C62828]" />
                  <span className="text-xs font-bold text-[#1F1F1F]">Mobile Money</span>
                </div>
                <span className="text-[10px] text-stone-500">MVola / Orange / Airtel</span>
              </button>
            </div>

            {paymentMethod === 'mobile_money' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-[#E9D9B4] text-xs space-y-2">
                <div className="font-semibold text-stone-800">Choisissez votre opérateur :</div>
                <div className="flex gap-2">
                  {(['mvola', 'orange', 'airtel'] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setMobileOperator(op)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        mobileOperator === op
                          ? 'bg-[#1F1F1F] text-[#E9D9B4]'
                          : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      {op === 'mvola' ? 'MVola' : op === 'orange' ? 'Orange Money' : 'Airtel Money'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-stone-600">
                  Un SMS de confirmation ou demande de transfert vous sera envoyé à la confirmation de la commande.
                </p>
              </div>
            )}
          </div>

          {/* Loyalty Program Preview */}
          {isLoggedIn && authCustomer && settings.loyaltyEnabled !== false && (() => {
            const nextOrderNumber = (authCustomer.orderCount || 0) + 1;
            const freeDeliveryEvery = settings.loyaltyFreeDeliveryEvery || 5;
            const freeSoupEvery = settings.loyaltyFreeSoupEvery || 10;
            const willGetFreeDelivery = deliveryType === 'delivery' && !isFreeDelivery && nextOrderNumber % freeDeliveryEvery === 0;
            const willGetFreeSoup = nextOrderNumber % freeSoupEvery === 0;
            if (!willGetFreeDelivery && !willGetFreeSoup) return null;
            return (
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl text-xs flex items-start gap-2">
                <span className="text-lg leading-none">🎉</span>
                <div>
                  <p className="font-bold text-amber-800">
                    C'est votre {nextOrderNumber}ème commande !
                  </p>
                  <p className="text-amber-700 mt-0.5">
                    {willGetFreeSoup && willGetFreeDelivery
                      ? `Livraison offerte + ${settings.loyaltyFreeSoupName || 'un plat cadeau'} vous sera automatiquement ajouté(e) 🎁`
                      : willGetFreeSoup
                      ? `${settings.loyaltyFreeSoupName || 'Un plat cadeau'} vous sera automatiquement ajouté(e) 🎁`
                      : 'Livraison offerte sur cette commande'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Order Summary Recap */}
          <div className="bg-white p-4 rounded-2xl border border-[#E6DECF] space-y-2 text-xs">
            <div className="flex justify-between items-baseline text-sm font-bold">
              <span className="text-[#1F1F1F]">Montant de la nourriture ({items.length} article{items.length > 1 ? 's' : ''})</span>
              <span className="font-serif text-lg text-[#111111]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-stone-600 pt-2 border-t border-stone-200">
              <span>+ Frais de livraison</span>
              <span className="font-semibold">
                {deliveryType === 'takeaway' ? (
                  <span className="text-emerald-600 font-bold">0 Ar (À récupérer)</span>
                ) : isFreeDelivery || willGetLoyaltyFreeDelivery ? (
                  <span className="text-emerald-600 font-bold">Offerte</span>
                ) : (
                  <span className="text-[#111111] font-bold">à partir de {formatPrice(minDeliveryFee)}</span>
                )}
              </span>
            </div>
            {deliveryType === 'delivery' && !isFreeDelivery && !willGetLoyaltyFreeDelivery && (
              <p className="text-[10px] text-stone-400 text-right">
                Montant exact selon votre lieu, confirmé par notre équipe.
              </p>
            )}
          </div>
        </div>

        {/* Submit Button — pied de page fixe, toujours visible */}
        <div className="p-5 sm:p-6 pt-4 bg-white border-t border-[#E6DECF]">
          {/* Acceptation des conditions générales de vente (obligatoire) */}
          <label className="flex items-start gap-2.5 mb-3 text-[12px] text-stone-600 leading-snug cursor-pointer">
            <input
              type="checkbox"
              id="checkout-accept-terms"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked) setTermsError(false);
              }}
              className="mt-0.5 w-4 h-4 accent-[#C62828] shrink-0 cursor-pointer"
            />
            <span>
              J'accepte les{' '}
              <a href="/conditions-generales" target="_blank" className="underline text-stone-800">
                conditions générales de vente
              </a>{' '}
              et la{' '}
              <a href="/confidentialite" target="_blank" className="underline text-stone-800">
                politique de confidentialité
              </a>
              .
            </span>
          </label>
          {termsError && (
            <p className="mb-3 text-[12px] text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Veuillez accepter les conditions générales pour valider votre commande.
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#111111]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Validation en cours...</span>
            ) : (
              <>
                <span>Confirmer la commande ({formatPrice(subtotal)}{deliveryType === 'delivery' && !isFreeDelivery && !willGetLoyaltyFreeDelivery ? ' + livraison' : ''})</span>
              </>
            )}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};
