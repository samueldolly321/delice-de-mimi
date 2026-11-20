import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  LogOut,
  Save,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Award,
  } from 'lucide-react';
import { useCustomerAuth } from '../../context/CustomerAuthContext';
import { useCart } from '../../context/CartContext';
import { OrderStatus } from '../../types';

export const CustomerProfileModal: React.FC = () => {
  const {
    customer,
    isProfileOpen,
    setIsProfileOpen,
    customerOrders,
    updateProfile,
    logout,
    refreshOrders,
  } = useCustomerAuth();
  const { formatPrice, setIsCartOpen } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'details'>('orders');

  // Edit fields state
  const [fullName, setFullName] = useState(customer?.fullName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [district, setDistrict] = useState(customer?.district || 'Antanimena');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // La fenêtre est montée dès le chargement de la page, avant la connexion :
  // on recopie les coordonnées du client à chaque ouverture.
  useEffect(() => {
    if (!isProfileOpen || !customer) return;
    setFullName(customer.fullName || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setDistrict(customer.district || 'Antanimena');
    setSaveSuccess(false);
    setSaveError(null);
  }, [isProfileOpen, customer?.id]);

  if (!isProfileOpen || !customer) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    const res = await updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      district: district.trim(),
    });

    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(res.error || "Impossible d'enregistrer vos coordonnées. Réessayez dans un instant.");
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Nouvelle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3" /> Nouvelle
          </span>
        );
      case 'Confirmée':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <CheckCircle className="w-3 h-3" /> Confirmée
          </span>
        );
      case 'En préparation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" /> En cuisine
          </span>
        );
      case 'En livraison':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3" /> En cours de livraison
          </span>
        );
      case 'Livrée':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Livrée
          </span>
        );
      case 'Annulée':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-600 border border-stone-300">
            Annulée
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  const totalCalculated = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0) || customer.totalSpent;
  const orderCountCalculated = customerOrders.length || customer.orderCount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FFF9F0] w-full max-w-2xl rounded-3xl shadow-2xl border border-[#EBDCC5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with profile banner */}
        <div className="bg-gradient-to-r from-[#1F1F1F] via-[#331111] to-[#8E1B1B] text-white p-6 relative shrink-0">
          <button
            onClick={() => setIsProfileOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#C62828] text-white border-2 border-[#FFE082]/50 flex items-center justify-center font-serif text-2xl font-bold shadow-lg shrink-0">
              {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : 'C'}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#FFE082]/20 text-[#FFE082] px-2.5 py-0.5 rounded-full border border-[#FFE082]/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Client Membre
                </span>
                <span className="text-xs text-white/60">ID: {customer.id}</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white truncate">
                {customer.fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#F4C542]" />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#F4C542]" />
                    {customer.email}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Commandes passées
              </div>
              <div className="font-serif text-lg font-bold text-[#FFE082]">
                {orderCountCalculated}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Total Dépensé
              </div>
              <div className="font-serif text-lg font-bold text-emerald-400">
                {formatPrice(totalCalculated)}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-white/5 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Zone favorite
              </div>
              <div className="font-bold text-xs text-white truncate">
                {customer.district || 'Antanimena'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#EBDCC5] bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Historique de mes Commandes ({customerOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Modifier mes Informations</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'orders' ? (
            /* ================= ORDERS HISTORY ================= */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700">
                  Toutes vos commandes en direct
                </span>
                <button
                  onClick={refreshOrders}
                  className="text-xs text-[#C62828] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Actualiser</span>
                </button>
              </div>

              {customerOrders.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-[#EBDCC5]/80">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-[#C62828]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-stone-900">
                    Aucune commande enregistrée
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Vous n'avez pas encore passé de commande avec ce compte. Choisissez vos spécialités dans le menu et laissez-vous tenter !
                  </p>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      const elem = document.getElementById('menu');
                      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="mt-4 px-5 py-2.5 bg-[#C62828] text-white text-xs font-bold rounded-xl hover:bg-[#8E1B1B] transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Découvrir le menu</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-[#EBDCC5] p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-serif font-bold text-stone-900 text-sm">
                            {order.id}
                          </span>
                          <span className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div>{getStatusBadge(order.status)}</div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-stone-700"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 w-5 text-right">
                                {it.quantity}x
                              </span>
                              <span>{it.name}</span>
                              {it.toppings && it.toppings.length > 0 && (
                                <span className="text-[10px] text-[#C62828] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  +{it.toppings.join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-stone-900">
                              {formatPrice(it.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                        <span className="text-stone-500">
                          {order.deliveryType === 'delivery' ? (
                            <span className="flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-stone-400" />
                              Livraison : {order.customer.address || 'Adresse fournie'} ({order.customer.district || 'Antananarivo'})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                              À emporter au restaurant
                            </span>
                          )}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-stone-500 mr-2 text-[11px]">Total:</span>
                          <span className="font-serif font-extrabold text-[#C62828] text-sm">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ================= EDIT PROFILE TAB ================= */
            <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-5 rounded-2xl border border-[#EBDCC5]">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="034 12 345 67"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Adresse de livraison habituelle
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Lot / Rue / Bâtiment"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Quartier habituel
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:border-[#C62828] bg-white"
                >
                  <option value="Antanimena">Antanimena</option>
                  <option value="Ankorondrano">Ankorondrano</option>
                  <option value="Analakely">Analakely / Centre-ville</option>
                  <option value="Ivandry">Ivandry / Alarobia</option>
                  <option value="Isoraka">Isoraka / Antaninarenina</option>
                  <option value="Ambohijatovo">Ambohijatovo / Mahamasina</option>
                  <option value="Autre quartier">Autre quartier d'Antananarivo</option>
                </select>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Vos coordonnées ont été mises à jour avec succès !</span>
                </div>
              )}

              {saveError && (
                <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  {saveError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#C62828] hover:bg-[#8E1B1B] text-white rounded-xl font-bold text-xs shadow-md shadow-[#C62828]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
