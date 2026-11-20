import React, { useState } from 'react';
import { Search, Filter, Eye, CheckCircle, Clock, Truck, Store, X, RefreshCw, Printer } from 'lucide-react';
import { Order, OrderStatus, RestaurantSettings } from '../../types';
import { api } from '../../services/api';
import { INITIAL_SETTINGS } from '../../data/seedData';
import { InvoiceModalN8 } from './InvoiceModalN8';

interface OrdersManagerProps {
  orders: Order[];
  settings?: RestaurantSettings;
  onRefresh: () => void;
  formatPrice: (val: number) => string;
}

const ALL_STATUSES: OrderStatus[] = [
  'Nouvelle',
  'Confirmée',
  'En préparation',
  'Prête',
  'En livraison',
  'Livrée',
  'Annulée',
];

export const OrdersManager: React.FC<OrdersManagerProps> = ({ orders, settings, onRefresh, formatPrice }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const DELIVERY_FEE_OPTIONS = [3000, 4000, 5000, 6000, 7000];

  const handleDeliveryFeeChange = async (newFee: number) => {
    if (!selectedOrder) return;
    const newTotal = selectedOrder.subtotal + newFee;
    const updated: Order = {
      ...selectedOrder,
      deliveryFee: newFee,
      total: newTotal,
    };
    setSelectedOrder(updated);
    try {
      await api.updateOrder(selectedOrder.id, { deliveryFee: newFee, total: newTotal });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const currentSettings = settings || INITIAL_SETTINGS;

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      onRefresh();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.fullName.toLowerCase().includes(q) ||
      o.customer.phone.toLowerCase().includes(q) ||
      (o.customer.email && o.customer.email.toLowerCase().includes(q)) ||
      (o.customer.district && o.customer.district.toLowerCase().includes(q)) ||
      (o.customer.address && o.customer.address.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'Nouvelle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmée':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'En préparation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Prête':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'En livraison':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Livrée':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Annulée':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par #CMD, client ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#C62828]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:border-[#C62828]"
          >
            <option value="All">Tous les statuts</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="p-2 text-stone-600 hover:text-[#C62828] rounded-xl border border-stone-200 hover:bg-stone-50 transition-colors"
            title="Rafraîchir les commandes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5">Commande</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Client & Contact</th>
                <th className="p-3.5">Mode</th>
                <th className="p-3.5">Articles</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Statut</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="font-mono font-bold text-[#1F1F1F]">{order.id}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-stone-800 font-medium">
                        {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <span>{order.customer.fullName}</span>
                        {order.customerId && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-sm" title="Client avec compte enregistré">
                            Profil
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-600 flex flex-col">
                        <span>{order.customer.phone}</span>
                        {order.customer.email && (
                          <span className="text-[10px] text-stone-600 truncate max-w-[140px]">{order.customer.email}</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700">
                        {order.deliveryType === 'takeaway' || (order.deliveryType as string) === 'pickup' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-stone-500" />
                            <span>À récupérer</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-[#C62828]" />
                            <span className="truncate max-w-[120px]">{order.customer.district || 'Livraison'}</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-stone-700">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} plats
                      </span>
                      <div className="text-[10px] text-stone-600 truncate max-w-[150px]">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-serif font-bold text-stone-900">
                        {formatPrice(order.total)}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border focus:outline-none cursor-pointer ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInvoiceOrder(order)}
                          className="px-2.5 py-1.5 text-stone-700 hover:text-white bg-stone-100 hover:bg-[#C62828] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Imprimer Facture"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#C62828] group-hover:text-white" />
                          <span className="hidden xl:inline text-[11px]">Facture</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-stone-500 hover:text-[#C62828] rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-[#1F1F1F] text-white flex items-center justify-between">
              <div>
                <h4 className="font-serif text-base font-bold text-[#FFE082]">
                  Détail de la commande {selectedOrder.id}
                </h4>
                <p className="text-[11px] text-stone-300">
                  Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Customer Box */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="font-bold text-stone-800">Coordonnées du client :</div>
                <div>Nom : <strong>{selectedOrder.customer.fullName}</strong></div>
                <div>Téléphone : <a href={`tel:${selectedOrder.customer.phone}`} className="text-[#C62828] font-bold underline">{selectedOrder.customer.phone}</a></div>
                {selectedOrder.customer.email && <div>Email : {selectedOrder.customer.email}</div>}
                <div>Adresse : {selectedOrder.customer.address} ({selectedOrder.customer.district})</div>
                {selectedOrder.customer.instructions && (
                  <div className="text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                    <strong>Instructions :</strong> {selectedOrder.customer.instructions}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
                  Articles commandés :
                </div>
                <div className="divide-y divide-stone-100 border rounded-xl p-3 bg-white">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-start">
                      <div>
                        <span>{it.quantity}x {it.name}</span>
                        {it.toppings && it.toppings.length > 0 && (
                          <div className="text-[10px] text-[#8E1B1B] font-medium">
                            + {it.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                          </div>
                        )}
                        {it.customNotes && (
                          <div className="text-[10px] text-stone-500 italic">
                            ↳ {it.customNotes}
                          </div>
                        )}
                      </div>
                      <span className="font-bold shrink-0 ml-2">{formatPrice(it.price * it.quantity)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 flex justify-between items-center text-stone-600">
                    <span>Sous-total articles</span>
                    <span className="font-semibold text-stone-900">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>

                  {/* Frais de livraison modifiables sans restriction avant impression */}
                  <div className="py-2.5 px-3 bg-amber-50/90 rounded-xl border border-amber-200/90 space-y-2 my-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="delivery-fee-input" className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                        <Truck className="w-3.5 h-3.5 text-[#C62828]" />
                        <span>Frais de livraison (Ajustement libre) :</span>
                      </label>
                      <span className="font-bold text-[#C62828] text-xs">
                        {formatPrice(selectedOrder.deliveryFee)}
                      </span>
                    </div>

                    {/* Champ financier sans restriction (saisie libre de tout montant) */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          id="delivery-fee-input"
                          type="number"
                          min="0"
                          step="any"
                          value={selectedOrder.deliveryFee}
                          onChange={(e) => handleDeliveryFeeChange(Math.max(0, Number(e.target.value) || 0))}
                          className="w-full text-xs font-bold py-2 px-3 rounded-lg border border-amber-300 bg-white text-stone-800 shadow-2xs focus:outline-none focus:border-[#C62828]"
                          placeholder="Montant libre en Ariary (ex: 3500)"
                        />
                      </div>
                      <span className="text-xs font-bold text-stone-600 shrink-0">Ar</span>
                    </div>

                    {/* Boutons de sélection rapide */}
                    <div>
                      <div className="text-[10px] font-bold text-amber-950/80 mb-1">Suggestions rapides :</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[0, 3000, 4000, 5000, 6000, 7000].map((fee) => (
                          <button
                            key={fee}
                            type="button"
                            onClick={() => handleDeliveryFeeChange(fee)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                              selectedOrder.deliveryFee === fee
                                ? 'bg-[#C62828] text-white shadow-2xs scale-102'
                                : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60'
                            }`}
                          >
                            {fee === 0 ? 'Gratuit (0 Ar)' : `${fee.toLocaleString('fr-FR')} Ar`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10.5px] text-amber-900 leading-tight">
                      Saisissez n'importe quel montant sans restriction ou cliquez sur un tarif rapide. La Facture et le total se mettent à jour automatiquement.
                    </p>
                  </div>

                  <div className="flex justify-between font-serif font-bold text-sm pt-2 text-[#C62828]">
                    <span>Total net de la commande</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status & Facture Action Bar */}
              <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(selectedOrder)}
                  className="bg-[#1F1F1F] hover:bg-black text-[#FFE082] px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#F4C542]" />
                  <span>Imprimer Facture</span>
                </button>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="font-bold text-stone-600">Statut :</span>
                  <select
                    value={selectedOrder.status}
                    onChange={(e) =>
                      handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                    }
                    className={`text-xs font-bold py-1.5 px-3 rounded-xl border cursor-pointer ${getStatusBadgeClass(
                      selectedOrder.status
                    )}`}
                  >
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facture N° 8 Modal */}
      {invoiceOrder && (
        <InvoiceModalN8
          order={invoiceOrder}
          settings={currentSettings}
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          allOrders={orders}
          onSelectOrder={(ord) => setInvoiceOrder(ord)}
        />
      )}
    </div>
  );
};
