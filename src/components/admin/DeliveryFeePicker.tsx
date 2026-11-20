import React, { useEffect, useState } from 'react';
import { MapPin, Truck, Check } from 'lucide-react';
import { Order, RestaurantSettings } from '../../types';
import { api } from '../../services/api';
import { getDeliveryFeeStatus, formatAriary } from '../../utils/delivery';

interface DeliveryFeePickerProps {
  order: Order;
  settings: RestaurantSettings;
  onSaved: (order: Order) => void;
}

/**
 * L'admin choisit les frais de livraison selon le lieu du client.
 * Enregistré sur la commande : le total (nourriture + livraison) est recalculé par le serveur.
 */
export const DeliveryFeePicker: React.FC<DeliveryFeePickerProps> = ({ order, settings, onSaved }) => {
  const minFee = settings.deliveryFee || 4000;
  const options = [0, 1000, 2000, 3000, 4000].map((step) => minFee + step);
  const status = getDeliveryFeeStatus(order, settings);

  const [amount, setAmount] = useState<string>(order.deliveryFee > 0 ? String(order.deliveryFee) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setAmount(order.deliveryFee > 0 ? String(order.deliveryFee) : '');
    setError('');
  }, [order.id, order.deliveryFee]);

  if (status === 'takeaway') return null;

  const save = async (fee: number) => {
    if (!Number.isFinite(fee) || fee <= 0) {
      setError('Indiquez un montant supérieur à 0 Ar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateOrder(order.id, { deliveryFee: Math.round(fee) });
      onSaved(updated);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "L'enregistrement a échoué. Réessayez.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-2.5 px-3 bg-amber-50/90 rounded-xl border border-amber-200/90 space-y-2 text-xs text-stone-800">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-amber-950 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#C62828]" />
          Frais de livraison
        </span>
        <span className={`font-bold ${status === 'pending' ? 'text-amber-700' : 'text-[#C62828]'}`}>
          {status === 'pending'
            ? 'À choisir'
            : status === 'offered'
            ? 'Offerte'
            : formatAriary(order.deliveryFee)}
        </span>
      </div>

      <div className="flex items-start gap-1.5 text-stone-700 bg-white/70 rounded-lg px-2 py-1.5 border border-amber-100">
        <MapPin className="w-3.5 h-3.5 text-[#C62828] shrink-0 mt-0.5" />
        <span>
          <strong>{order.customer.district || 'Quartier non précisé'}</strong>
          {order.customer.address ? ` — ${order.customer.address}` : ''}
        </span>
      </div>

      {status === 'offered' && (
        <p className="text-[10.5px] text-emerald-700 font-semibold">
          Livraison offerte (fidélité ou seuil de commande atteint). Choisissez un montant seulement si vous voulez la facturer.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {options.map((fee) => (
          <button
            key={fee}
            type="button"
            disabled={saving}
            onClick={() => save(fee)}
            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all disabled:opacity-50 ${
              order.deliveryFee === fee
                ? 'bg-[#C62828] text-white shadow-2xs'
                : 'bg-white text-stone-700 border border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            {formatAriary(fee)}
          </button>
        ))}
      </div>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save(Number(amount));
        }}
      >
        <input
          type="number"
          min="0"
          step="500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Autre montant (à partir de ${minFee.toLocaleString('fr-FR')})`}
          className="flex-1 text-xs font-bold py-2 px-3 rounded-lg border border-amber-300 bg-white text-stone-800 focus:outline-none focus:border-[#C62828]"
        />
        <button
          type="submit"
          disabled={saving || !amount}
          className="bg-[#C62828] hover:bg-[#8E1B1B] text-white px-3 py-2 rounded-lg font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? '...' : 'Valider'}
        </button>
      </form>

      {error && <p className="text-[10.5px] text-red-700 font-semibold">{error}</p>}
    </div>
  );
};
