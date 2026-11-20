import React, { useState } from 'react';
import { Search, UserCheck, Phone, Mail, MapPin, ShoppingBag, Eye, X, Calendar, Printer } from 'lucide-react';
import { Customer, Order, RestaurantSettings } from '../../types';
import { InvoiceModalN8 } from './InvoiceModalN8';
import { INITIAL_SETTINGS } from '../../data/seedData';

interface CustomersManagerProps {
  customers: Customer[];
  orders?: Order[];
  settings?: RestaurantSettings;
  formatPrice: (val: number) => string;
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({
  customers,
  orders = [] as Order[],
  settings,
  formatPrice,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  const currentSettings = settings || INITIAL_SETTINGS;

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  // Find all orders corresponding to selected customer
  const customerOrders = selectedCustomer
    ? orders.filter(
        (o) =>
          (o.customerId && o.customerId === selectedCustomer.id) ||
          (o.customer.phone && selectedCustomer.phone && o.customer.phone.replace(/\D/g, '') === selectedCustomer.phone.replace(/\D/g, '')) ||
          (o.customer.email && selectedCustomer.email && o.customer.email.toLowerCase() === selectedCustomer.email.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-stone-500">
          {filtered.length} client{filtered.length > 1 ? 's' : ''} enregistré{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5">Client</th>
                <th className="p-3.5">Téléphone</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Adresse</th>
                <th className="p-3.5 text-center">Commandes</th>
                <th className="p-3.5 text-right">Total Dépensé</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#C62828]/10 text-[#C62828] font-bold flex items-center justify-center shrink-0">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">{c.fullName}</div>
                        {c.registeredAt && (
                          <div className="text-[10px] text-stone-600">
                            Inscrit le {new Date(c.registeredAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 font-medium text-stone-700">
                    <a href={`tel:${c.phone}`} className="hover:underline text-stone-800">
                      {c.phone}
                    </a>
                  </td>

                  <td className="p-3.5 text-stone-600">
                    {c.email || '—'}
                  </td>

                  <td className="p-3.5 text-stone-600 max-w-xs truncate">
                    {c.address || c.district || '—'}
                  </td>

                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-stone-100 font-bold text-stone-800">
                      {c.orderCount}
                    </span>
                  </td>

                  <td className="p-3.5 text-right font-serif font-extrabold text-[#C62828]">
                    {formatPrice(c.totalSpent)}
                  </td>

                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 hover:text-[#C62828] transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                      title="Voir l'historique des commandes de ce client"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Historique</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            <div className="p-5 bg-[#1F1F1F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold">
                  {selectedCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedCustomer.fullName}</h3>
                  <div className="text-xs text-stone-300 flex items-center gap-3 mt-0.5">
                    <span>{selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Total commandes</div>
                  <div className="text-base font-bold text-stone-900 mt-0.5">{customerOrders.length}</div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Dépenses cumulées</div>
                  <div className="text-base font-serif font-bold text-[#C62828] mt-0.5">
                    {formatPrice(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center">
                  <div className="text-[10px] text-stone-500 uppercase font-semibold">Adresse par défaut</div>
                  <div className="text-xs font-medium text-stone-700 truncate mt-0.5">
                    {selectedCustomer.address || selectedCustomer.district || 'Non renseignée'}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Commandes du client ({customerOrders.length})
                </h4>

                {customerOrders.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
                    Aucune commande trouvée pour ce client dans le système actuel.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3.5 bg-stone-50/80 hover:bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-stone-900">{order.id}</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                              {order.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>• {order.items.reduce((s, i) => s + i.quantity, 0)} plats</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-serif font-bold text-sm text-[#C62828]">
                              {formatPrice(order.total)}
                            </div>
                            <div className="text-[10px] text-stone-500">
                              {order.deliveryType === 'delivery' ? 'Livraison' : 'À emporter'}
                            </div>
                          </div>

                          <button
                            onClick={() => setInvoiceOrder(order)}
                            className="p-2 rounded-xl bg-white border border-stone-200 hover:border-[#C62828] text-stone-700 hover:text-[#C62828] transition-colors"
                            title="Imprimer la facture N°8"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal N8 */}
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
