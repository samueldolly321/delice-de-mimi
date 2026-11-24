import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
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

  const visibleCategories = categories
    .filter((c) => c.slug !== 'all' && c.id !== 'cat-all')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const filterTabs: { key: string; label: string; isActive: boolean; onClick: () => void }[] = [
    {
      key: 'all',
      label: 'Tout',
      isActive: selectedCategory === 'all' || selectedCategory === 'cat-all',
      onClick: () => setSelectedCategory('all'),
    },
    {
      key: 'populaire',
      label: 'Populaires',
      isActive: selectedCategory === 'populaire',
      onClick: () => setSelectedCategory(selectedCategory === 'populaire' ? 'all' : 'populaire'),
    },
    {
      key: 'nouveau',
      label: 'Nouveautés',
      isActive: selectedCategory === 'nouveau',
      onClick: () => setSelectedCategory(selectedCategory === 'nouveau' ? 'all' : 'nouveau'),
    },
    ...visibleCategories.map((cat) => ({
      key: cat.slug || cat.id,
      label: cat.name,
      isActive: selectedCategory === cat.slug || selectedCategory === cat.id,
      onClick: () => setSelectedCategory(cat.slug || cat.id),
    })),
  ];

  return (
    <section id="menu" className="pt-20 md:pt-28 pb-16 relative bg-white scroll-mt-32">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="label-caps text-[11px] text-gold">La carte</span>
            <h2 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
              Découvrez <span className="italic">notre menu</span>
            </h2>
            <p className="mt-5 text-base text-stone-500 font-light">
              Des recettes généreuses, préparées à la commande avec des ingrédients frais.
            </p>
          </div>
        </FadeIn>

        {/* ===================================================================== */}
        {/* VEDETTE : soupe personnalisable, en grand bloc photo + texte          */}
        {/* ===================================================================== */}
        <div
          id="soupe-demi-lune-highlight"
          className="mb-16 grid grid-cols-1 lg:grid-cols-2 border border-hairline"
        >
          <div className="relative min-h-[320px] lg:min-h-[480px] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=80"
              alt="Soupe Base Demi-Lune avec garnitures"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col justify-center items-center text-center px-6 sm:px-12 py-12 lg:py-16">
            <span className="label-caps text-[11px] text-gold">En tête de carte</span>
            <h3 className="mt-4 font-serif text-2xl sm:text-3xl lg:text-4xl text-ink leading-tight">
              Soupe Demi-Lune <span className="italic">à composer</span>
            </h3>
            <p className="mt-5 text-sm sm:text-base text-stone-500 font-light leading-relaxed max-w-md">
              Bouillon parfumé mijoté 12 heures, nouilles artisanales, légumes croquants et raviolis demi-lune.
              Ajoutez ensuite les garnitures de votre choix.
            </p>

            <div className="mt-6 text-[12px] italic tracking-[0.12em] text-gold">
              Base à {formatPrice(activeCustomProduct?.price || 10000)}
            </div>

            {/* Garnitures */}
            <div className="mt-8 w-full max-w-md border-t border-hairline pt-6">
              <div className="label-caps text-[10px] text-stone-400 mb-4">Garnitures au choix</div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-cocoa">
                {SOUP_TOPPINGS.map((top) => (
                  <li key={top.id} className="flex items-baseline justify-between gap-3 border-b border-dotted border-hairline pb-1.5">
                    <span className="font-light text-left">{top.name.replace('Supplément ', '').replace(' artisanales', '')}</span>
                    <span className="text-[11px] italic text-gold whitespace-nowrap">+{formatPrice(top.price)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCustomizer(activeCustomProduct)}
              id="open-soup-customizer-banner-btn"
              className="btn-outline mt-10 bg-ink text-white border-ink hover:bg-ink-dark"
            >
              Composer ma soupe
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* Catégories (onglets texte) et recherche                               */}
        {/* ===================================================================== */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-3 max-w-5xl">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={tab.onClick}
                id={`cat-tab-${tab.key}`}
                className={`label-caps text-[11px] sm:text-[12px] pb-1 border-b transition-colors cursor-pointer ${
                  tab.isActive ? 'text-ink border-ink' : 'text-stone-400 border-transparent hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-0 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Rechercher un plat…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-2 text-sm font-light bg-transparent border-b border-hairline focus:outline-none focus:border-ink transition-colors placeholder:text-stone-400"
            />
          </div>

          <div className="text-[11px] italic text-stone-400">
            {filteredProducts.length} plat{filteredProducts.length > 1 ? 's' : ''}
            {currentCategoryObj && selectedCategory !== 'all' ? ` · ${currentCategoryObj.name}` : ''}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* Grille des plats : cellules séparées par de fines bordures            */}
        {/* ===================================================================== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-96 bg-white animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-hairline border border-hairline">
            {filteredProducts.map((product, index) => (
              <div key={product.id} className="bg-white">
                <FadeIn delay={Math.min(index % 3, 2) * 0.08} className="h-full">
                  <ProductCard product={product} onCustomize={handleOpenCustomizer} />
                </FadeIn>
              </div>
            ))}
            {/* Cellules vides pour compléter la dernière ligne (bordures nettes) */}
            {Array.from({ length: (3 - (filteredProducts.length % 3)) % 3 }).map((_, i) => (
              <div key={`filler-${i}`} className="hidden lg:block bg-white" />
            ))}
            {filteredProducts.length % 2 === 1 && <div className="hidden sm:block lg:hidden bg-white" />}
          </div>
        ) : (
          <div className="border border-hairline py-20 px-6 text-center">
            <h3 className="font-serif text-xl text-cocoa">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? `Aucun plat dans « ${currentCategoryObj.name} »`
                : 'Aucun plat correspondant'}
            </h3>
            <p className="mt-2 text-sm text-stone-500 font-light">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? 'Des plats y seront bientôt ajoutés.'
                : 'Essayez une autre recherche ou une autre catégorie.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-outline mt-6 text-ink border-ink/30 hover:bg-ink hover:text-white"
            >
              Toute la carte
            </button>
          </div>
        )}

        <p className="mt-6 text-center label-caps text-[10px] text-stone-400">
          Livraison à Antananarivo · Retrait sur place
        </p>
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
