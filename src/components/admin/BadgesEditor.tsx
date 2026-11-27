import React, { useEffect, useState } from 'react';
import { Plus, Tag, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { BadgeDef, Product } from '../../types';
import { api } from '../../services/api';
import { DEFAULT_BADGES, badgeIdFromLabel } from '../../data/badges';

interface Props {
  value: BadgeDef[];
  onChange: (next: BadgeDef[]) => void;
}

const inputCls = 'w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm';
const labelCls = 'font-semibold text-stone-700 block mb-1 text-xs';

/**
 * Administration des étiquettes des plats (Populaire, Nouveau…) :
 * ajout, nom, couleurs, onglet de filtre dans la carte.
 */
export const BadgesEditor: React.FC<Props> = ({ value, onChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => undefined);
  }, []);

  const list = value.length > 0 ? value : DEFAULT_BADGES;
  const update = (i: number, patch: Partial<BadgeDef>) => onChange(list.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => {
    const b = list[i];
    const used = products.filter((p) => p.badge === b.id).length;
    const msg = used
      ? `Supprimer l'étiquette « ${b.label} » ? ${used} plat(s) l'utilisent : ils n'auront plus d'étiquette.`
      : `Supprimer l'étiquette « ${b.label} » ?`;
    if (!window.confirm(msg)) return;
    onChange(list.filter((_, idx) => idx !== i));
  };
  const add = () => {
    const label = 'Nouvelle étiquette';
    onChange([...list, { id: badgeIdFromLabel(label, list.map((b) => b.id)), label, bg: '#111111', color: '#ffffff', filter: false, filterLabel: '' }]);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-100 pb-3">
        <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#C62828]" />
          <span>Étiquettes des plats</span>
        </h4>
        <p className="text-xs text-stone-500 mt-0.5">
          Les pastilles affichées sur la photo des plats. Choisissez-les ensuite dans la fiche de chaque plat (onglet « Plats », champ « Étiquette »). Pensez à cliquer sur « Enregistrer ».
        </p>
      </div>

      <div className="space-y-3">
        {list.map((b, i) => {
          const used = products.filter((p) => p.badge === b.id).length;
          return (
            <div key={b.id} className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-block px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ backgroundColor: b.bg, color: b.color }}
                >
                  {b.label || 'Aperçu'}
                </span>
                <div className="flex items-center gap-1 text-stone-500">
                  <span className="text-[11px] mr-2">{used} plat{used > 1 ? 's' : ''}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-30 cursor-pointer" title="Monter">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-1.5 rounded-lg hover:bg-stone-200 disabled:opacity-30 cursor-pointer" title="Descendre">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 cursor-pointer" title="Supprimer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <label className={labelCls}>Nom affiché</label>
                  <input className={inputCls} value={b.label} maxLength={40} onChange={(e) => update(i, { label: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Fond</label>
                  <input type="color" value={b.bg} onChange={(e) => update(i, { bg: e.target.value })} className="w-full h-[42px] rounded-xl border border-stone-200 bg-white p-1 cursor-pointer" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Texte</label>
                  <input type="color" value={b.color} onChange={(e) => update(i, { color: e.target.value })} className="w-full h-[42px] rounded-xl border border-stone-200 bg-white p-1 cursor-pointer" />
                </div>
                <div className="sm:col-span-4">
                  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer mb-2">
                    <input type="checkbox" checked={b.filter} onChange={(e) => update(i, { filter: e.target.checked })} className="w-4 h-4 accent-[#C62828]" />
                    <span>Onglet de filtre dans la carte</span>
                  </label>
                  {b.filter && (
                    <input className={inputCls} value={b.filterLabel || ''} maxLength={40} onChange={(e) => update(i, { filterLabel: e.target.value })} placeholder={`Nom de l'onglet (vide = ${b.label})`} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={add} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-stone-300 text-xs font-bold text-stone-700 hover:border-[#C62828] hover:text-[#C62828] cursor-pointer">
        <Plus className="w-4 h-4" /> Ajouter une étiquette
      </button>
    </div>
  );
};
