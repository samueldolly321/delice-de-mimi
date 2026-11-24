import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, LayoutTemplate } from 'lucide-react';
import { HomeContent, HomeServiceItem, ServiceIconName } from '../../types';
import { DEFAULT_HOME_CONTENT, DEFAULT_SERVICES } from '../../data/homeContent';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { SERVICE_ICONS, ServiceIcon } from '../common/ServiceIcon';

interface Props {
  value: HomeContent;
  onChange: (next: HomeContent) => void;
}

const inputCls =
  'w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm';

/** Champ texte : vide = texte d'origine (affiché en gris comme exemple). */
const Field: React.FC<{
  label: string;
  value?: string;
  placeholder: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  hint?: string;
}> = ({ label, value, placeholder, onChange, multiline, hint }) => (
  <div>
    <label className="font-semibold text-stone-700 block mb-1 text-xs">{label}</label>
    {multiline ? (
      <textarea rows={3} value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`${inputCls} text-xs leading-relaxed`} />
    ) : (
      <input type="text" value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    )}
    {hint && <p className="text-[11px] text-stone-400 mt-1">{hint}</p>}
  </div>
);

const Block: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4">
    <div className="border-b border-stone-200/80 pb-2">
      <div className="font-bold text-sm text-stone-900">{title}</div>
      <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

/**
 * Éditeur des textes et images de la page d'accueil.
 * Un champ laissé vide reprend automatiquement le texte d'origine.
 */
export const HomeContentEditor: React.FC<Props> = ({ value, onChange }) => {
  const set = (patch: Partial<HomeContent>) => onChange({ ...value, ...patch });
  const D = DEFAULT_HOME_CONTENT;

  const services: HomeServiceItem[] = value.services && value.services.length > 0 ? value.services : DEFAULT_SERVICES;
  const setServices = (list: HomeServiceItem[]) => set({ services: list });
  const updateService = (i: number, patch: Partial<HomeServiceItem>) =>
    setServices(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const moveService = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= services.length) return;
    const list = [...services];
    [list[i], list[j]] = [list[j], list[i]];
    setServices(list);
  };

  return (
    <div className="space-y-5">
      <div className="border-b border-stone-100 pb-3">
        <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-[#C62828]" />
          <span>Textes et photos de la page d'accueil</span>
        </h4>
        <p className="text-xs text-stone-500 mt-0.5">
          Laissez un champ vide pour garder le texte d'origine (affiché en gris). Pensez à cliquer sur « Enregistrer ».
        </p>
      </div>

      <Block title="Section « Notre maison »" description="Le texte de l'histoire, le chef et la citation se modifient dans l'onglet « Le Chef ».">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Titre de la section" value={value.aboutTitle} placeholder={D.aboutTitle} onChange={(v) => set({ aboutTitle: v })} />
          <Field label="Petit titre au-dessus de l'histoire" value={value.aboutLabel} placeholder={D.aboutLabel} onChange={(v) => set({ aboutLabel: v })} />
          <Field label="Texte du bouton" value={value.aboutButton} placeholder={D.aboutButton} onChange={(v) => set({ aboutButton: v })} />
          <Field label="Titre de la carte « philosophie »" value={value.philosophyLabel} placeholder={D.philosophyLabel} onChange={(v) => set({ philosophyLabel: v })} />
        </div>
        <ImageUploadInput
          label="Photo de la carte « philosophie »"
          value={value.philosophyImage || ''}
          onChange={(img) => set({ philosophyImage: img })}
          placeholder="Vide = 2ᵉ photo du diaporama"
          helperText="Format paysage recommandé. Laissez vide pour utiliser la 2ᵉ photo du diaporama."
        />
      </Block>

      <Block title="Bandeau « Soupe » (3 panneaux)" description="Le bandeau sombre entre « Notre maison » et la carte. Le bouton ouvre le composeur de soupe.">
        <Field label="Titre" value={value.soupBandTitle} placeholder={D.soupBandTitle} onChange={(v) => set({ soupBandTitle: v })} />
        <Field label="Texte" value={value.soupBandText} placeholder={D.soupBandText} onChange={(v) => set({ soupBandText: v })} multiline />
        <Field label="Texte du bouton" value={value.soupBandButton} placeholder={D.soupBandButton} onChange={(v) => set({ soupBandButton: v })} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ImageUploadInput label="Photo de gauche" value={value.soupBandImageLeft || ''} onChange={(img) => set({ soupBandImageLeft: img })} placeholder="Vide = 3ᵉ photo du diaporama" />
          <ImageUploadInput label="Photo du centre (sous le texte)" value={value.soupBandImageCenter || ''} onChange={(img) => set({ soupBandImageCenter: img })} placeholder="Vide = 1ʳᵉ photo du diaporama" />
          <ImageUploadInput label="Photo de droite" value={value.soupBandImageRight || ''} onChange={(img) => set({ soupBandImageRight: img })} placeholder="Vide = 2ᵉ photo du diaporama" />
        </div>
      </Block>

      <Block title="Section « La carte »" description="Les plats et catégories se gèrent dans les onglets « Plats » et « Catégories ».">
        <Field label="Titre de la section" value={value.menuTitle} placeholder={D.menuTitle} onChange={(v) => set({ menuTitle: v })} />
        <Field label="Phrase d'introduction" value={value.menuSubtitle} placeholder={D.menuSubtitle} onChange={(v) => set({ menuSubtitle: v })} multiline />
      </Block>

      <Block title="Section « Nos engagements »" description="De 1 à 8 engagements, chacun avec une icône, un titre et un court texte.">
        <Field label="Titre de la section" value={value.servicesTitle} placeholder={D.servicesTitle} onChange={(v) => set({ servicesTitle: v })} />
        <Field label="Phrase d'introduction" value={value.servicesIntro} placeholder={D.servicesIntro} onChange={(v) => set({ servicesIntro: v })} multiline />

        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="p-3 rounded-xl border border-stone-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-3">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Icône</label>
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center shrink-0">
                    <ServiceIcon name={s.icon} className="w-4 h-4 text-[#C9A050]" />
                  </span>
                  <select
                    value={s.icon}
                    onChange={(e) => updateService(i, { icon: e.target.value as ServiceIconName })}
                    className="w-full p-2 rounded-xl border border-stone-200 bg-white text-xs cursor-pointer"
                  >
                    {(Object.keys(SERVICE_ICONS) as ServiceIconName[]).map((k) => (
                      <option key={k} value={k}>
                        {SERVICE_ICONS[k].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-3">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Titre</label>
                <input type="text" value={s.title} onChange={(e) => updateService(i, { title: e.target.value })} className={inputCls} />
              </div>
              <div className="sm:col-span-5">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">Texte</label>
                <textarea rows={2} value={s.text} onChange={(e) => updateService(i, { text: e.target.value })} className={`${inputCls} text-xs`} />
              </div>
              <div className="sm:col-span-1 flex sm:flex-col gap-1 sm:pt-5">
                <button type="button" onClick={() => moveService(i, -1)} title="Monter" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => moveService(i, 1)} title="Descendre" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 cursor-pointer">
                  <ArrowDown className="w-4 h-4" />
                </button>
                {services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                    title="Supprimer"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {services.length < 8 && (
          <button
            type="button"
            onClick={() => setServices([...services, { icon: 'star', title: 'Nouvel engagement', text: '' }])}
            className="px-3 py-1.5 rounded-xl bg-[#C62828]/10 hover:bg-[#C62828]/20 text-[#C62828] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter un engagement
          </button>
        )}
      </Block>

      <Block title="Section « Contact »" description="Adresse, téléphone, horaires et réseaux se modifient dans « Coordonnées » et « Réseaux sociaux ».">
        <Field label="Titre de la section" value={value.contactTitle} placeholder={D.contactTitle} onChange={(v) => set({ contactTitle: v })} />
        <Field label="Phrase d'introduction" value={value.contactIntro} placeholder={D.contactIntro} onChange={(v) => set({ contactIntro: v })} multiline />
      </Block>
    </div>
  );
};
