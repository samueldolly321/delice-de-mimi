import React, { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, UtensilsCrossed, ArrowRight, Check, Flame, Award } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { SoupCustomizerModal } from './SoupCustomizerModal';
import { api } from '../services/api';
import { SOUP_TOPPINGS, INITIAL_PRODUCTS } from '../data/seedData';
import { useCart } from '../context/CartContext';
import { FadeIn } from './common/FadeIn';

interface MenuSectionProps {
  isCustomizerOpen?: boolean;
  onOpenCustomizer?: () => void;
  onCloseCustomizer?: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  isCustomizerOpen: externalCustomizerOpen,
  onOpenCustomizer: externalOpenCustomizer,
  onCloseCustomizer: externalCloseCustomizer,
}) => {
  const { formatPrice } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Local state for modal if not externally controlled
  const [internalCustomizerOpen, setInternalCustomizerOpen] = useState<boolean>(false);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const isModalOpen = externalCustomizerOpen !== undefined ? externalCustomizerOpen : internalCustomizerOpen;

  // Load categories and products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        setCategories(cats);
        setProducts(prods);

        // Set default customizing product to Soupe Base Demi-Lune
        const demiLune = prods.find((p) => p.isCustomizable || p.id === 'prod-soupe-demi-lune') || prods[0];
        if (demiLune) {
          setCustomizingProduct(demiLune);
        }
      } catch (err) {
        console.error('Erreur chargement menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Listen to real-time category and product updates from Admin
    const handleCategoryUpdate = () => {
      api.getCategories().then((cats) => setCategories(cats));
    };
    const handleProductUpdate = () => {
      api.getProducts().then((prods) => setProducts(prods));
    };

    window.addEventListener('saveurs_categories_updated', handleCategoryUpdate);
    window.addEventListener('saveurs_products_updated', handleProductUpdate);

    return () => {
      window.removeEventListener('saveurs_categories_updated', handleCategoryUpdate);
      window.removeEventListener('saveurs_products_updated', handleProductUpdate);
    };
  }, []);

  // Ensure default customizable product is set even before API completes
  const activeCustomProduct =
    customizingProduct ||
    products.find((p) => p.isCustomizable || p.id === 'prod-soupe-demi-lune') ||
    INITIAL_PRODUCTS.find((p) => p.id === 'prod-soupe-demi-lune') ||
    INITIAL_PRODUCTS[0];

  const handleOpenCustomizer = (product?: Product) => {
    if (product) {
      setCustomizingProduct(product);
    } else if (activeCustomProduct) {
      setCustomizingProduct(activeCustomProduct);
    }

    if (externalOpenCustomizer) {
      externalOpenCustomizer();
    } else {
      setInternalCustomizerOpen(true);
    }
  };

  const handleCloseCustomizer = () => {
    if (externalCloseCustomizer) {
      externalCloseCustomizer();
    } else {
      setInternalCustomizerOpen(false);
    }
  };

  // Filter products by selected category and search query
  const currentCategoryObj = useMemo(() => {
    return categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory);
  }, [categories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchCategory = false;
      if (selectedCategory === 'all' || selectedCategory === 'cat-all') {
        matchCategory = true;
      } else if (selectedCategory === 'populaire') {
        matchCategory = p.badge === 'Populaire';
      } else if (selectedCategory === 'nouveau') {
        matchCategory = p.badge === 'Nouveau';
      } else if (selectedCategory === 'chef') {
        matchCategory = p.badge === 'Chef';
      } else {
        const matchedCat = categories.find(
          (c) => c.id === selectedCategory || c.slug === selectedCategory
        );
        matchCategory =
          p.categoryId === selectedCategory ||
          (matchedCat && (p.categoryId === matchedCat.id || p.categoryId === matchedCat.slug || (p.categoryName && matchedCat.name && p.categoryName.toLowerCase() === matchedCat.name.toLowerCase()))) ||
          (Boolean(p.categoryName) && p.categoryName.toLowerCase() === selectedCategory.toLowerCase());
      }

      const matchSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, categories, selectedCategory, searchQuery]);

  return (
    <section id="menu" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn>
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C62828]/10 text-[#8E1B1B] text-xs font-bold tracking-wider uppercase">
            <span>CARTE DES SPÉCIALITÉS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1F1F1F] tracking-tight">
            Découvrez notre menu
          </h2>

          <p className="text-base sm:text-lg text-stone-600 font-normal">
            Des recettes généreuses, préparées à la commande avec des ingrédients frais.
          </p>
        </div>
        </FadeIn>

        {/* ========================================================================= */}
        {/* VEDETTE : « SOUPE BASE DEMI-LUNE » PERSONNALISABLE (10 000 Ar) */}
        {/* ========================================================================= */}
        <div
          id="soupe-demi-lune-highlight"
          className="mb-14 relative bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-xl overflow-hidden"
        >
          {/* Decorative Back accents */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#C62828]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#F4C542]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#C62828] text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                  ★ EN TÊTE DE CARTE
                </span>
                <span className="px-3 py-1 rounded-full bg-[#FFE082]/60 text-[#8E1B1B] text-xs font-bold border border-[#F4C542]/50">
                  Base {formatPrice(activeCustomProduct?.price || 10000)} + Garnitures au choix libre
                </span>
              </div>

              <div>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F1F1F]">
                  « Soupe Base Demi-Lune » Personnalisable
                </h3>
                <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                  Composez votre grand bol de bouillon parfumé mijoté 12h, accompagné de ses nouilles artisanales, légumes croquants et raviolis demi-lune de base. Ajoutez selon votre envie vos viandes, fruits de mer et délices vapeurs !
                </p>
              </div>

              {/* Inclus de base */}
              <div className="bg-white/80 p-3.5 rounded-2xl border border-[#EBDCC5] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-700 font-medium">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bouillon 12h</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Nouilles fraîches</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Légumes pak choï</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Raviolis Demi-Lune</span>
                </div>
              </div>

              {/* Garnitures Preview Pills */}
              <div>
                <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                  Garnitures au choix libre :
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SOUP_TOPPINGS.map((top) => (
                    <span
                      key={top.id}
                      className="inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-xl bg-white border border-[#EBDCC5] text-xs text-[#1F1F1F] shadow-2xs font-semibold hover:border-[#C62828] transition-colors"
                    >
                      {top.image ? (
                        <img
                          src={top.image}
                          alt={top.name}
                          className="w-5 h-5 rounded-full object-cover shrink-0 border border-stone-200"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>{top.icon}</span>
                      )}
                      <span>{top.name.replace('Supplément ', '').replace(' artisanales', '')}</span>
                      <span className="text-[#C62828] font-bold ml-0.5">+{formatPrice(top.price)}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenCustomizer(activeCustomProduct)}
                  id="open-soup-customizer-banner-btn"
                  className="bg-[#C62828] hover:bg-[#8E1B1B] text-white px-6 py-3.5 rounded-xl font-extrabold text-sm shadow-md shadow-[#C62828]/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Composer ma soupe personnalisée</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="text-xs text-stone-500 flex items-center justify-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#F4C542]" />
                  <span>Calcul du prix en temps réel & ajout panier</span>
                </div>
              </div>
            </div>

            {/* Right Photo Presentation */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-xl border-4 border-white group">
                <img
                  src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
                  alt="Soupe Base Demi-Lune avec garnitures"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Floating Tag */}
                <div className="absolute top-3 left-3 bg-[#1F1F1F]/90 backdrop-blur-md text-[#FFE082] px-3 py-1.5 rounded-xl text-xs font-bold border border-[#F4C542]/40 shadow-md">
                  Base à {formatPrice(activeCustomProduct?.price || 10000)}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[11px] font-semibold text-[#FFE082]">Recette Traditionnelle</div>
                  <div className="text-base font-bold">Raviolis Demi-Lune & Bouillon 12h</div>
                  <div className="text-xs text-white/80 mt-0.5">Personnalisable avec 7 garnitures fraîches</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white/70 backdrop-blur-xs p-2 sm:p-3 rounded-2xl border border-[#EBDCC5] shadow-xs">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une soupe, mine sao, nem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white border border-stone-200 focus:outline-none focus:border-[#C62828] transition-colors"
            />
          </div>

          {/* Counts */}
          <div className="text-xs text-stone-500 font-medium px-2">
            {filteredProducts.length} plat{filteredProducts.length > 1 ? 's' : ''} disponible{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Interactive Category Tabs with Vertical Scroll */}
        <div className="mb-8 bg-white/95 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-[#EBDCC5] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Catégories du menu
              </span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-[11px] font-bold text-stone-600 border border-stone-200">
                {categories.filter((c) => c.slug !== 'all' && c.id !== 'cat-all').length + 3} catégories
              </span>
            </div>
            <span className="text-[11px] text-stone-400 font-medium">
              Faites défiler vers le bas pour voir toute la liste
            </span>
          </div>

          <div
            id="categories-vertical-scroll"
            className="max-h-44 sm:max-h-56 overflow-y-auto pr-2 pb-2 scroll-smooth border-y border-stone-100/80 pt-1"
          >
            <div className="flex flex-wrap items-center gap-2 py-1">
              {/* Quick Filter: All */}
              <button
                onClick={() => setSelectedCategory('all')}
                id="cat-tab-all"
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-2xs ${
                  selectedCategory === 'all' || selectedCategory === 'cat-all'
                    ? 'bg-[#C62828] text-white shadow-md shadow-[#C62828]/25 scale-102 border border-[#C62828]'
                    : 'bg-white text-stone-700 hover:bg-[#F4C542]/15 border border-[#EBDCC5]/80 hover:border-[#F4C542]'
                }`}
              >
                <span>Tous les plats</span>
              </button>

              {/* Quick Badge Filter: Populaires */}
              <button
                onClick={() => setSelectedCategory(selectedCategory === 'populaire' ? 'all' : 'populaire')}
                id="cat-tab-populaire"
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  selectedCategory === 'populaire'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-md shadow-amber-900/25 scale-102'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100/80 border-amber-200/90'
                }`}
              >
                <Flame className={`w-4 h-4 ${selectedCategory === 'populaire' ? 'fill-amber-200 text-amber-200' : 'fill-amber-500 text-amber-500'}`} />
                <span>Plats Populaires</span>
              </button>

              {/* Quick Badge Filter: Nouveautés */}
              <button
                onClick={() => setSelectedCategory(selectedCategory === 'nouveau' ? 'all' : 'nouveau')}
                id="cat-tab-nouveau"
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                  selectedCategory === 'nouveau'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-900/25 scale-102'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100/80 border-emerald-200/90'
                }`}
              >
                <span>Nouveautés</span>
              </button>

              {/* Existing Categories without duplicate 'all' */}
              {categories
                .filter((c) => c.slug !== 'all' && c.id !== 'cat-all')
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((cat) => {
                  const isActive = selectedCategory === cat.slug || selectedCategory === cat.id;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug || cat.id)}
                      id={`cat-tab-${cat.slug}`}
                      className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-2xs ${
                        isActive
                          ? 'bg-[#C62828] text-white shadow-md shadow-[#C62828]/25 scale-102 border border-[#C62828]'
                          : 'bg-white text-stone-700 hover:bg-[#F4C542]/15 border border-[#EBDCC5]/80 hover:border-[#F4C542]'
                      }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Highlight Banner Block for Populaire / Nouveau */}
        {selectedCategory === 'populaire' && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-100/60 to-amber-50/20 border border-amber-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Flame className="w-5 h-5 fill-amber-200 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base sm:text-lg font-bold text-amber-950">Nos Plats Populaires</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200/90 text-amber-900 border border-amber-300">
                    Coups de Cœur Clients
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  Les plats les plus demandés et plébiscités pour leur saveur authentique et leur générosité.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-amber-900 font-bold underline cursor-pointer hover:text-amber-950 shrink-0"
            >
              Afficher toute la carte
            </button>
          </div>
        )}

        {selectedCategory === 'nouveau' && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-100/60 to-emerald-50/20 border border-emerald-300 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Award className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-base sm:text-lg font-bold text-emerald-950">Nos Nouveautés Culinaires</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-200/90 text-emerald-900 border border-emerald-300">
                    Fraîchement ajoutés
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 mt-0.5">
                  Les dernières créations et recettes inédites fraîchement composées par notre brigade.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-emerald-900 font-bold underline cursor-pointer hover:text-emerald-950 shrink-0"
            >
              Afficher toute la carte
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-stone-200/60 animate-pulse border border-stone-200"
              />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <FadeIn key={product.id} delay={Math.min(index, 8) * 0.05}>
                <ProductCard
                  product={product}
                  onCustomize={handleOpenCustomizer}
                />
              </FadeIn>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="bg-white/80 rounded-2xl p-12 text-center border border-dashed border-[#EBDCC5] max-w-md mx-auto my-8">
            <UtensilsCrossed className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#1F1F1F]">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? `Aucun plat dans « ${currentCategoryObj.name} »`
                : 'Aucun plat correspondant'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? 'Cette catégorie a bien été ajoutée au menu. Des plats y seront bientôt ajoutés.'
                : 'Essayez une autre recherche ou sélectionnez une catégorie différente.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-[#C62828] text-white text-xs font-semibold rounded-xl cursor-pointer hover:bg-[#8E1B1B] transition-colors"
            >
              Afficher toute la carte
            </button>
          </div>
        )}
      </div>

      {/* Soup Customizer Modal */}
      {isModalOpen && activeCustomProduct && (
        <SoupCustomizerModal
          product={activeCustomProduct}
          isOpen={isModalOpen}
          onClose={handleCloseCustomizer}
        />
      )}
    </section>
  );
};
