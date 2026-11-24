import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Soup } from 'lucide-react';
import { SoupTopping } from '../../types';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface Props {
  value: SoupTopping[];
  onChange: (next: SoupTopping[]) => void;
  formatPrice: (n: number) => string;
}

const inputCls =
  'w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm';

/**
 * Éditeur des garnitures de la soupe personnalisable.
 * Le serveur recalcule toujours le prix des commandes à partir de cette liste :
 * un client ne peut pas choisir une garniture masquée ni modifier son prix.
 */
export const ToppingsEditor: React.FC<Props> = ({ value, onChange, formatPrice }) => {
  const update = (i: number, patch: Partial<SoupTopping>) => onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const list = [...value];
    [list[i], list[j]] = [list[j], list[i]];
    onChange(list);
  };
  const add = () =>
    onChange([
      ...value,
      { id: `top-${Date.now().toString(36)}`, name: 'Nouvelle garniture', price: 2000, icon: '🥢', isAvailable: true },
    ]);

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
            <Soup className="w-4 h-4 text-[#C62828]" />
            <span>Garnitures de la soupe à composer</span>
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Nom, prix, photo et disponibilité de chaque garniture. Décochez « Disponible » en cas de rupture : la
            garniture disparaît du site sans être supprimée.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-xl bg-[#C62828]/10 hover:bg-[#C62828]/20 text-[#C62828] font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter une garniture
        </button>
      </div>

      <div className="space-y-4">
        {value.map((t, i) => (
          <div
            key={t.id || i}
            className={`p-4 rounded-2xl border bg-stone-50/50 space-y-3 ${t.isAvailable === false ? 'border-stone-200 opacity-70' : 'border-stone-200'}`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-stone-200/80 pb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{t.icon || '🥢'}</span>
                <span className="font-bold text-xs text-stone-900 truncate">{t.name || 'Sans nom'}</span>
                <span className="text-xs font-bold text-[#C62828] shrink-0">+{formatPrice(Number(t.price) || 0)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mr-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={t.isAvailable !== false}
                    onChange={(e) => update(i, { isAvailable: e.target.checked })}
                    className="w-4 h-4 accent-[#C62828]"
                  />
                  Disponible
                </label>
                <button type="button" onClick={() => move(i, -1)} title="Monter" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 cursor-pointer">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} title="Descendre" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200 cursor-pointer">
                  <ArrowDown className="w-4 h-4" />
                </button>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer la garniture « ${t.name} » ?`)) onChange(value.filter((_, idx) => idx !== i));
                    }}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Nom *</label>
                <input type="text" value={t.name} onChange={(e) => update(i, { name: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-3">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Prix (Ar) *</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={Number.isFinite(t.price) ? t.price : 0}
                  onChange={(e) => update(i, { price: Math.max(0, Math.round(Number(e.target.value) || 0)) })}
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Emoji (si pas de photo)</label>
                <input type="text" maxLength={4} value={t.icon || ''} onChange={(e) => update(i, { icon: e.target.value })} className={inputCls} placeholder="🥟" />
              </div>
              <div className="sm:col-span-12">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Description courte</label>
                <input
                  type="text"
                  value={t.description || ''}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className={inputCls}
                  placeholder="Ex. 3 raviolis artisanaux farcis porc, gingembre & ciboulette"
                />
              </div>
            </div>

            <ImageUploadInput
              label="Photo"
              value={t.image || ''}
              onChange={(img) => update(i, { image: img })}
              placeholder="https://... ou importez depuis votre PC"
            />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-stone-400">
        Changer un prix s'applique aux nouvelles commandes uniquement. Les commandes déjà passées gardent leur prix.
      </p>
    </div>
  );
};
