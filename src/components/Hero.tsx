import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Save,
  Layers,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { HeroSlide } from '../types';
import { api } from '../services/api';
import { ImageUploadInput } from './common/ImageUploadInput';

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Le grand bol traditionnel fumant aux nems croustillants',
    tag: 'Soupes & Bouillons Mijotés',
    badgeText: 'BOUILLON ARTISANAL 12H',
    titlePrefix: 'Le grand bol traditionnel fumant, ',
    titleHighlight: 'avec nems croustillants et œuf mariné.',
    description:
      'Mijoté plus de 12 heures selon la pure tradition : nouilles fraîches pétries à la main, légumes croquants, raviolis demi-lune fondants et garnitures au choix.',
    dishName: 'Soupe Base Demi-Lune',
    dishPrice: 'Dès 10 000 Ar',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'Grand bol traditionnel de soupe fumante aux nouilles et nems croustillants',
    actionText: 'Commander',
    actionTarget: 'customizer',
  },
  {
    id: 2,
    title: 'Wok de nouilles Mine Sao au canard laqué croustillant',
    tag: 'Wok & Sauté Minute',
    badgeText: 'HAUTE CUISSON AU WOK',
    titlePrefix: 'Le wok de nouilles Mine Sao ',
    titleHighlight: 'au canard laqué croustillant, pak choï et sésame.',
    description:
      'Saisi à feu vif minute pour un goût fumé incomparable, tranches de canard doré à la peau laquée, légumes de saison et sauce caramélisée du chef.',
    dishName: 'Mine Sao au Canard Laqué',
    dishPrice: 'Dès 15 000 Ar',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'Wok de nouilles Mine Sao sautées au canard laqué et pak choï',
    actionText: 'Commander',
    actionTarget: 'menu',
  },
  {
    id: 3,
    title: 'Panier de dim sum délicats et rouleaux de printemps dorés',
    tag: 'Vapeurs & Nems Artisanaux',
    badgeText: 'FAÇONNÉ MAIN CHAQUE MATIN',
    titlePrefix: 'Panier en bambou de dim sum délicats ',
    titleHighlight: 'et rouleaux de printemps dorés.',
    description:
      'Bouchées vapeur translucides aux crevettes fraîches et porc parfumé servies au panier de bambou, accompagnées de nems ultra-croustillants et sauces maison.',
    dishName: 'Dim Sum & Nems Assortis',
    dishPrice: 'Dès 8 000 Ar',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1920&q=85',
    imageAlt: 'Panier en bambou fumant de dim sum délicats et rouleaux dorés',
    actionText: 'Commander',
    actionTarget: 'menu',
  },
];

interface HeroProps {
  onOpenCustomizer?: () => void;
  isAdmin?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ onOpenCustomizer, isAdmin }) => {
  const { settings, refreshSettings } = useCart();
  const isActuallyAdmin = Boolean(isAdmin || api.isAuthenticated());

  // Toutes les diapositives définies dans l'administration (les 3 d'origine si aucune).
  const rawList = settings?.slides && Array.isArray(settings.slides) && settings.slides.length > 0 ? settings.slides : DEFAULT_HERO_SLIDES;
  const slides: HeroSlide[] = rawList.map((s, idx) => {
    const def = DEFAULT_HERO_SLIDES[idx % DEFAULT_HERO_SLIDES.length];

    const title = (s && s.title && s.title.trim())
      ? s.title.trim()
      : (s && s.titlePrefix ? `${s.titlePrefix} ${s.titleHighlight || ''}`.trim() : '')
      || def.title;

    const description = (s && s.description && s.description.trim())
      ? s.description.trim()
      : def.description;

    const actionText = (s && s.actionText && s.actionText.trim())
      ? s.actionText.trim()
      : (def.actionText || 'Commander');

    const image = (s && s.image && s.image.trim())
      ? s.image.trim()
      : def.image;

    // Petit titre : vide = pas de petit titre (choix de l'admin)
    const tag = s && typeof s.tag === 'string' ? s.tag.trim() : def.tag;

    return {
      ...def,
      ...s,
      id: idx + 1,
      title,
      description,
      actionText,
      image,
      tag,
    };
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const slideTimerRef = useRef<number | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number>(0);
  const [tempSlides, setTempSlides] = useState<HeroSlide[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Synchronize tempSlides whenever modal opens
  const openEditModal = (slideIndexToEdit?: number) => {
    setTempSlides(JSON.parse(JSON.stringify(slides)));
    setEditingSlideIndex(typeof slideIndexToEdit === 'number' ? slideIndexToEdit : currentIndex);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSaveSuccess(false);
  };

  const handleUpdateCurrentTempSlide = (patch: Partial<HeroSlide>) => {
    setTempSlides((prev) => {
      const next = [...prev];
      next[editingSlideIndex] = { ...next[editingSlideIndex], ...patch };
      return next;
    });
  };

  const handleSaveSlides = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        slides: tempSlides,
      });
      await refreshSettings();
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 900);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des slides:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play slideshow every 6 seconds, pausing on hover or when editing
  useEffect(() => {
    if (isPaused || isEditModalOpen) return;

    slideTimerRef.current = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => {
      if (slideTimerRef.current) {
        clearInterval(slideTimerRef.current);
      }
    };
  }, [isPaused, isEditModalOpen, slides.length]);

  const scrollToMenu = () => {
    const elem = document.getElementById('menu');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrimaryAction = (slide: HeroSlide) => {
    if (slide.actionTarget === 'customizer') {
      if (onOpenCustomizer) {
        onOpenCustomizer();
      } else {
        const customizerElem = document.getElementById('soupe-demi-lune-highlight');
        if (customizerElem) {
          customizerElem.scrollIntoView({ behavior: 'smooth' });
        } else {
          scrollToMenu();
        }
      }
    } else {
      scrollToMenu();
    }
  };

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section
      id="accueil"
      className="relative w-full overflow-hidden bg-[#141414] select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Photo plein écran, titre aligné à gauche en majuscules étroites */}
      <div className="relative w-full h-screen min-h-[600px] max-h-[960px] overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={`hero-slide-${index}`}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.image}
                alt={slide.imageAlt || slide.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
                loading={index === 0 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10 pointer-events-none" />

              <div className="relative z-20 h-full max-w-[1180px] mx-auto px-6 sm:px-10 flex flex-col justify-center pt-20">
                <div
                  className={`max-w-xl transition-all ${
                    isActive ? 'opacity-100 translate-y-0 duration-700 delay-500' : 'opacity-0 translate-y-6 duration-200'
                  }`}
                >
                  {slide.tag && <span className="label-caps text-[11px] text-white/70">{slide.tag}</span>}

                  <h1 className="mt-4 font-display uppercase text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-[0.06em]">
                    {slide.title}
                  </h1>

                  <p className="mt-5 text-sm sm:text-base text-white/85 leading-relaxed max-w-lg">{slide.description}</p>

                  <button
                    type="button"
                    onClick={() => handlePrimaryAction(slide)}
                    id={`hero-action-btn-${index}`}
                    className="btn-outline mt-8 text-white hover:bg-white hover:text-ink hover:border-white"
                  >
                    {slide.actionText || 'Commander'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation : flèches carrées noires + numéros */}
        <div className="absolute bottom-8 right-6 sm:right-10 z-30 flex items-center gap-4">
          <span className="font-display text-white/80 text-sm tracking-[0.2em]">
            {String(currentIndex + 1).padStart(2, '0')} <span className="text-white/40">/ {String(slides.length).padStart(2, '0')}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="w-10 h-10 bg-black/80 hover:bg-accent text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="w-10 h-10 bg-black/80 hover:bg-accent text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2">
          {slides.map((slide, idx) => (
            <button
              key={`hero-dot-${idx}`}
              type="button"
              onClick={() => goToSlide(idx)}
              className={`h-[2px] transition-all duration-500 cursor-pointer ${
                idx === currentIndex ? 'w-10 bg-white' : 'w-5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Aller à la diapositive ${idx + 1}`}
              title={slide.title || `Diapositive ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK SLIDE EDITOR MODAL (MODIFICATION DIRECTE DES 3 SLIDES)              */}
      {/* ========================================================================= */}
      {isEditModalOpen && tempSlides[editingSlideIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1F1F1F]">
                    Modifier les diapositives d'accueil
                  </h3>
                  <p className="text-xs text-stone-500">
                    Modifiez le titre, le texte, le bouton CTA et la photo de chaque diapositive
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Tabs Navigation */}
            <div className="flex border-b border-stone-200 px-6 pt-3 gap-2 bg-white">
              {tempSlides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setEditingSlideIndex(idx)}
                  className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    editingSlideIndex === idx
                      ? 'border-[#111111] text-[#111111]'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  Diapositive {idx + 1}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-800">
              {/* Titre */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Titre de la diapositive *
                </label>
                <input
                  type="text"
                  value={
                    tempSlides[editingSlideIndex].title ??
                    (tempSlides[editingSlideIndex].titlePrefix
                      ? `${tempSlides[editingSlideIndex].titlePrefix} ${tempSlides[editingSlideIndex].titleHighlight || ''}`
                      : '')
                  }
                  onChange={(e) =>
                    handleUpdateCurrentTempSlide({
                      title: e.target.value,
                    })
                  }
                  placeholder="Ex: Le grand bol traditionnel fumant aux nems croustillants"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#111111] bg-white text-sm"
                />
              </div>

              {/* Texte / Description */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Texte de la diapositive *
                </label>
                <textarea
                  rows={3}
                  value={tempSlides[editingSlideIndex].description || ''}
                  onChange={(e) =>
                    handleUpdateCurrentTempSlide({
                      description: e.target.value,
                    })
                  }
                  placeholder="Description détaillée du plat ou de la spécialité mise en avant..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#111111] bg-white text-xs leading-relaxed"
                />
              </div>

              {/* 1 Bouton CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Texte du bouton CTA *
                  </label>
                  <input
                    type="text"
                    value={tempSlides[editingSlideIndex].actionText || 'Commander'}
                    onChange={(e) =>
                      handleUpdateCurrentTempSlide({
                        actionText: e.target.value,
                      })
                    }
                    placeholder="Ex: Commander"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#111111] bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Action lors du clic
                  </label>
                  <select
                    value={tempSlides[editingSlideIndex].actionTarget || 'menu'}
                    onChange={(e) =>
                      handleUpdateCurrentTempSlide({
                        actionTarget: e.target.value as 'customizer' | 'menu',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#111111] bg-white text-xs cursor-pointer"
                  >
                    <option value="menu">Défiler vers le Menu de commande</option>
                    <option value="customizer">Ouvrir le Composeur de Soupe</option>
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="pt-1">
                <ImageUploadInput
                  label="Photo de la diapositive"
                  value={tempSlides[editingSlideIndex].image || ''}
                  onChange={(img) => handleUpdateCurrentTempSlide({ image: img })}
                  placeholder="https://... ou sélectionnez une photo sur votre ordinateur"
                  helperText="Format paysage recommandé (1920x1080)."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                {saveSuccess ? '✓ Modifications enregistrées avec succès !' : 'Modifications sauvegardées pour le site.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold text-xs hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSaveSlides}
                  disabled={isSaving}
                  className="bg-[#111111] hover:bg-[#000000] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Enregistré !</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
