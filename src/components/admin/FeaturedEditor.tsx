import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { FeaturedImageFocus, FeaturedImageRatio, FeaturedSettings, Product } from '../../types';
import { api } from '../../services/api';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { DEFAULT_FEATURED, FEATURED_FOCUSES, FEATURED_RATIOS, pickFeaturedProduct } from '../../data/featured';

interface Props {
  value: FeaturedSettings;
  onChange: (next: FeaturedSettings) => void;
}

const inputCls = 'w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm';
const labelCls = 'font-semibold text-stone-700 block mb-1 text-xs';
const hintCls = 'text-[11px] text-stone-400 mt-1';

const Block: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4">
    <div className="border-b border-stone-200/80 pb-2">
      <div className="font-bold text-sm text-stone-900">{title}</div>
      {description && <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const Check: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#C62828]" />
    <span>{label}</span>
  </label>
);

/**
 * Administration du bloc « Notre coup de cœur » (plat mis en avant au-dessus de la carte).
 * Champ vide = valeur d'origine ou information du plat (affichée en gris).
 */
export const FeaturedEditor: React.FC<Props> = ({ value, onChange }) => {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => undefined);
  }, []);

  const v = { ...DEFAULT_FEATURED, ...value };
  const set = (patch: Partial<FeaturedSettings>) => onChange({ ...v, ...patch });
  const product = pickFeaturedProduct(products, v.productId);
  const isCover = v.imageFit === 'cover';

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-100 pb-3">
        <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
          <Star className="w-4 h-4 text-[#C62828]" />
          <span>Produit vedette (« Notre coup de cœur »)</span>
        </h4>
        <p className="text-xs text-stone-500 mt-0.5">
          Un plat mis en avant juste au-dessus de la carte. Les champs vides reprennent les informations du plat (affichées en gris). Pensez à cliquer sur « Enregistrer ».
        </p>
      </div>

      <Block title="Affichage et plat">
        <Check checked={v.enabled} onChange={(enabled) => set({ enabled })} label="Afficher le bloc sur la page d'accueil" />
        <div>
          <label className={labelCls}>Plat mis en avant</label>
          <select value={v.productId} onChange={(e) => set({ productId: e.target.value })} className={inputCls}>
            <option value="">Automatique (Spécialité du chef, sinon Populaire)</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.categoryName}{p.isAvailable ? '' : ' (épuisé)'}
              </option>
            ))}
          </select>
          {product && (
            <p className={hintCls}>
              Plat affiché : <strong className="text-stone-600">{product.name}</strong>. Prix, disponibilité et photo par défaut viennent de sa fiche (onglet « Plats »).
            </p>
          )}
        </div>
      </Block>

      <Block title="Textes">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Titre de la section</label>
            <input className={inputCls} value={v.sectionTitle} onChange={(e) => set({ sectionTitle: e.target.value })} placeholder="(aucun titre)" />
          </div>
          <div>
            <label className={labelCls}>Petit titre au-dessus du nom</label>
            <input className={inputCls} value={v.label} onChange={(e) => set({ label: e.target.value })} placeholder="(aucun)" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Phrase d'introduction (sous le titre de la section)</label>
          <textarea rows={2} className={inputCls} value={v.sectionIntro} onChange={(e) => set({ sectionIntro: e.target.value })} placeholder="(aucune)" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nom affiché</label>
            <input className={inputCls} value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder={product?.name || 'Nom du plat'} />
          </div>
          <div>
            <label className={labelCls}>Pastille sur la photo</label>
            <input className={inputCls} value={v.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="(aucune)" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea rows={4} className={inputCls} value={v.text} onChange={(e) => set({ text: e.target.value })} placeholder={product?.description || 'Description du plat'} />
          <p className={hintCls}>Affichée en entier, sans être coupée. Vide = description du plat.</p>
        </div>
        <div>
          <label className={labelCls}>Points forts (un par ligne)</label>
          <textarea rows={3} className={inputCls} value={v.highlights} onChange={(e) => set({ highlights: e.target.value })} placeholder={'Bouillon mijoté 12 heures\nNouilles faites maison'} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Bouton principal</label>
            <input className={inputCls} value={v.button} onChange={(e) => set({ button: e.target.value })} placeholder={product?.isCustomizable ? 'Composer ma soupe' : 'Ajouter au panier'} />
          </div>
          <div>
            <label className={labelCls}>Second bouton (vers la carte)</label>
            <input className={inputCls} value={v.button2} onChange={(e) => set({ button2: e.target.value })} placeholder="(pas de second bouton)" />
          </div>
        </div>
      </Block>

      <Block title="Prix">
        <div className="flex flex-wrap gap-5">
          <Check checked={v.showPrice} onChange={(showPrice) => set({ showPrice })} label="Afficher le prix" />
          <Check checked={v.showMeta} onChange={(showMeta) => set({ showMeta })} label="Afficher catégorie, temps de préparation et piquant" />
        </div>
        <div className="max-w-xs">
          <label className={labelCls}>Ancien prix barré (Ariary, 0 = aucun)</label>
          <input
            type="number"
            min={0}
            step={500}
            className={inputCls}
            value={v.oldPrice || ''}
            onChange={(e) => set({ oldPrice: Math.max(0, Number(e.target.value) || 0) })}
            placeholder="0"
          />
          <p className={hintCls}>Affiché seulement s'il est supérieur au prix du plat.</p>
        </div>
      </Block>

      <Block title="Photo et mise en page">
        <ImageUploadInput
          label="Photo du bloc"
          value={v.image}
          onChange={(image) => set({ image })}
          placeholder="Vide = photo du plat"
          helperText="Pour une image nette, utilisez une photo d'au moins 1200 px de large. Vide = photo du plat."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Affichage de la photo</label>
            <select value={v.imageFit} onChange={(e) => set({ imageFit: e.target.value === 'contain' ? 'contain' : 'cover' })} className={inputCls}>
              <option value="cover">Rognée (remplit le cadre)</option>
              <option value="contain">Entière (sans rognage)</option>
            </select>
          </div>
          {isCover && (
            <div>
              <label className={labelCls}>Format du cadre</label>
              <select value={v.imageRatio} onChange={(e) => set({ imageRatio: e.target.value as FeaturedImageRatio })} className={inputCls}>
                {(Object.keys(FEATURED_RATIOS) as FeaturedImageRatio[]).map((k) => (
                  <option key={k} value={k}>{FEATURED_RATIOS[k].label}</option>
                ))}
              </select>
            </div>
          )}
          {isCover && (
            <div>
              <label className={labelCls}>Partie de la photo à garder</label>
              <select value={v.imageFocus} onChange={(e) => set({ imageFocus: e.target.value as FeaturedImageFocus })} className={inputCls}>
                {(Object.keys(FEATURED_FOCUSES) as FeaturedImageFocus[]).map((k) => (
                  <option key={k} value={k}>{FEATURED_FOCUSES[k]}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Position de la photo</label>
            <select value={v.imageSide} onChange={(e) => set({ imageSide: e.target.value === 'right' ? 'right' : 'left' })} className={inputCls}>
              <option value="left">À gauche du texte</option>
              <option value="right">À droite du texte</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Fond du bloc</label>
            <select
              value={v.background}
              onChange={(e) => set({ background: e.target.value === 'paper' || e.target.value === 'dark' ? e.target.value : 'white' })}
              className={inputCls}
            >
              <option value="white">Blanc</option>
              <option value="paper">Gris clair</option>
              <option value="dark">Noir</option>
            </select>
          </div>
        </div>
        {!isCover && <p className={hintCls}>« Entière » : la photo garde ses proportions d'origine, rien n'est coupé.</p>}
      </Block>
    </div>
  );
};
