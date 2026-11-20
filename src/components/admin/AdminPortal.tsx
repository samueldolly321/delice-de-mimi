import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  Settings,
  LogOut,
  ArrowLeft,
  Bell,
  BellOff,
  PlusCircle,
  TrendingUp,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Clock,
  Tag,
  MessageSquare,
} from 'lucide-react';
import { Product, Category, Order, Customer, RestaurantSettings, ContactMessage } from '../../types';
import { api } from '../../services/api';
import { playOrderNotificationSound } from '../../utils/audio';
import { OrdersManager } from './OrdersManager';
import { ProductsManager } from './ProductsManager';
import { CategoriesManager } from './CategoriesManager';
import { CustomersManager } from './CustomersManager';
import { SettingsManager } from './SettingsManager';
import { MessagesManager } from './MessagesManager';

interface AdminPortalProps {
  onClose: () => void;
  formatPrice: (val: number) => string;
}

type AdminTab = 'dashboard' | 'orders' | 'menu' | 'categories' | 'messages' | 'customers' | 'settings';

export const AdminPortal: React.FC<AdminPortalProps> = ({ onClose, formatPrice }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [menuFilterCategory, setMenuFilterCategory] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [o, p, c, cust, s, m] = await Promise.all([
        api.getOrders(),
        api.getProducts(),
        api.getCategories(),
        api.getCustomers(),
        api.getSettings(),
        api.getMessages(),
      ]);
      setOrders(o);
      setProducts(p);
      setCategories(c);
      setCustomers(cust);
      setSettings(s);
      setMessages(m);
    } catch (err) {
      console.error('Erreur chargement admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll orders and messages periodically in backoffice (every 8s)
    const interval = setInterval(() => {
      Promise.all([api.getOrders(), api.getMessages()]).then(([latestOrders, latestMessages]) => {
        setOrders((prev) => {
          if (prev.length > 0 && latestOrders.length > prev.length) {
            const newest = latestOrders[0];
            if (newest && soundEnabled && settings?.notifySoundEnabled !== false) {
              playOrderNotificationSound();
            }
            if (newest) {
              setNewOrderAlert(`Nouvelle commande ${newest.id} • ${formatPrice(newest.total)}`);
              setTimeout(() => setNewOrderAlert(null), 6000);
            }
          }
          return latestOrders;
        });
        setMessages(latestMessages);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [soundEnabled, settings]);

  const handleSimulateNewOrder = async () => {
    try {
      const sampleOrderData = {
        customer: {
          fullName: 'Sitraka Randrianarisoa',
          phone: '+261 34 88 999 11',
          email: 'sitraka@gmail.com',
          address: 'Logement 24, Cité Seimad',
          district: 'Ankatso, Antananarivo',
          instructions: 'Sonner 2 fois s’il vous plaît',
        },
        items: [
          {
            productId: 'prod-mine-sao-poulet',
            name: 'Mine Sao au Poulet',
            price: 15000,
            quantity: 1,
          },
          {
            productId: 'prod-sambos-viande',
            name: 'Sambos Croustillants à la Viande',
            price: 8000,
            quantity: 2,
          },
        ],
        subtotal: 31000,
        deliveryFee: 3000,
        total: 34000,
        deliveryType: 'delivery' as const,
        paymentMethod: 'cash_on_delivery' as const,
      };

      const newOrder = await api.createOrder(sampleOrderData);
      setOrders((prev) => [newOrder, ...prev]);

      // Sound and alert notification
      if (soundEnabled) {
        playOrderNotificationSound();
      }
      setNewOrderAlert(`Nouvelle commande ${newOrder.id} • ${formatPrice(newOrder.total)}`);
      setTimeout(() => setNewOrderAlert(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    api.logout();
    onClose();
  };

  // Metrics calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'Annulée' ? o.total : 0), 0);
  const totalOrdersCount = orders.length;
  const newOrdersCount = orders.filter((o) => o.status === 'Nouvelle').length;
  const inPrepOrdersCount = orders.filter((o) => o.status === 'En préparation' || o.status === 'Confirmée').length;
  const unreadMessagesCount = messages.filter((m) => m.status === 'new').length;

  // Top selling products tally
  const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (o.status !== 'Annulée') {
      o.items.forEach((item) => {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, count: 0, revenue: 0 };
        }
        productSalesMap[item.name].count += item.quantity;
        productSalesMap[item.name].revenue += item.price * item.quantity;
      });
    }
  });
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#1F1F1F] flex flex-col font-sans">
      {/* Toast Notification Alert Banner */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 z-50 bg-[#1F1F1F] text-[#FFE082] px-5 py-3.5 rounded-2xl shadow-2xl border border-[#F4C542] flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="w-3 h-3 rounded-full bg-[#C62828] animate-ping" />
          <Bell className="w-5 h-5 text-[#F4C542] animate-bounce" />
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider text-[10px] text-[#F4C542]">
              Alerte Commande
            </div>
            <div className="font-mono font-bold text-white text-xs">{newOrderAlert}</div>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-white/60 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar */}
      <header className="bg-[#1F1F1F] text-white border-b border-[#333] sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings?.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings?.name || 'Logo'}
              className="w-9 h-9 rounded-xl object-cover border border-[#FFE082]/30"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#C62828] text-[#F4C542] flex items-center justify-center font-serif text-lg font-bold border border-[#FFE082]/30">
              {settings?.logoText || '味'}
            </div>
          )}
          <div>
            <div className="font-serif font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <span>{settings?.name || 'Chargement...'}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-[#C62828] text-white px-2 py-0.5 rounded-md">
                Admin
              </span>
            </div>
            <div className="text-[11px] text-stone-400">
              Système de gestion des commandes & du menu
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Test order simulation button */}
          <button
            onClick={handleSimulateNewOrder}
            title="Simuler l'arrivée d'une nouvelle commande client"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C62828]/20 hover:bg-[#C62828]/40 border border-[#C62828] text-xs font-bold text-[#FFE082] transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#F4C542]" />
            <span>Simuler commande</span>
          </button>

          {/* Sound Notification Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs flex items-center gap-1.5 border transition-colors ${
              soundEnabled
                ? 'bg-amber-950/40 text-[#F4C542] border-[#F4C542]/40'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
            title={soundEnabled ? 'Son activé' : 'Son coupé'}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          {/* Return to website */}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Site Public</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 text-stone-400 hover:text-red-400 rounded-xl hover:bg-white/5 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-stone-200 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'orders'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Commandes</span>
            {newOrdersCount > 0 && (
              <span className="bg-[#C62828] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {newOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Gestion du Menu ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            id="admin-tab-categories"
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Catégories ({categories.filter((c) => c.id !== 'cat-all').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            id="admin-tab-messages"
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'messages'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages & Résas ({messages.length})</span>
            {unreadMessagesCount > 0 && (
              <span className="bg-[#C62828] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full animate-pulse">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#1F1F1F] text-[#F4C542] shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Chiffre d'affaires
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-extrabold text-[#1F1F1F] mt-2">
                  {formatPrice(totalRevenue)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Activité en direct</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Total Commandes
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-extrabold text-[#1F1F1F] mt-2">
                  {totalOrdersCount}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  {newOrdersCount} nouvelle{newOrdersCount > 1 ? 's' : ''} à traiter
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    En préparation
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-extrabold text-[#1F1F1F] mt-2">
                  {inPrepOrdersCount}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  En cuisine / En cours
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Clients Enregistrés
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-extrabold text-[#1F1F1F] mt-2">
                  {customers.length}
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  Fidélité active
                </div>
              </div>

              <div
                onClick={() => setActiveTab('messages')}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-[#C62828] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                    Messages & Résas
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-[#C62828] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-2xl font-extrabold text-[#1F1F1F] mt-2 flex items-center gap-2">
                  <span>{messages.length}</span>
                  {unreadMessagesCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#C62828] text-white">
                      {unreadMessagesCount} nouv.
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#C62828] font-medium mt-1">
                  Voir les réservations →
                </div>
              </div>
            </div>

            {/* Top Selling Products & Recent Orders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Top Selling Dishes */}
              <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                  <span>Plats les plus vendus</span>
                </h4>

                <div className="divide-y divide-stone-100">
                  {topProducts.length === 0 ? (
                    <div className="text-stone-400 text-xs py-4 text-center">
                      Aucune vente pour le moment
                    </div>
                  ) : (
                    topProducts.map((tp, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-stone-800">{tp.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#C62828]">{tp.count} vendus</div>
                          <div className="text-[10px] text-stone-500">{formatPrice(tp.revenue)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Recent Orders */}
              <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#C62828]" />
                    <span>Dernières Commandes en direct</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#C62828] hover:underline"
                  >
                    Voir tout ({orders.length})
                  </button>
                </div>

                <div className="divide-y divide-stone-100 text-xs">
                  {orders.slice(0, 4).map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-stone-900">{o.id}</span>
                          <span className="text-[11px] text-stone-500">• {o.customer.fullName}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-serif font-bold text-stone-900">{formatPrice(o.total)}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <OrdersManager
            orders={orders}
            settings={settings || undefined}
            onRefresh={loadData}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'menu' && (
          <ProductsManager
            products={products}
            categories={categories}
            onRefresh={loadData}
            formatPrice={formatPrice}
            onOpenCategoriesManager={() => setActiveTab('categories')}
            defaultCategoryFilter={menuFilterCategory}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesManager
            categories={categories}
            products={products}
            onRefresh={loadData}
            onSelectCategoryFilter={(catId) => {
              setMenuFilterCategory(catId);
              setActiveTab('menu');
            }}
          />
        )}

        {activeTab === 'messages' && (
          <MessagesManager
            messages={messages}
            settings={settings || undefined}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersManager
            customers={customers}
            orders={orders}
            settings={settings || undefined}
            formatPrice={formatPrice}
          />
        )}

        {activeTab === 'settings' && settings && (
          <SettingsManager settings={settings} onRefresh={loadData} />
        )}
      </div>
    </div>
  );
};
