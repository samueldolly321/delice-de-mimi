import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { SoupCustomizerModal } from './SoupCustomizerModal';
import { api } from '../services/api';
import { INITIAL_PRODUCTS } from '../data/seedData';
import { resolveHomeContent } from '../data/homeContent';
import { useCart } from '../context/CartContext';
import { FadeIn } from './common/FadeIn';
import { resolveBadges } from '../data/badges';

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
  const { settings } = useCart();
  const home = resolveHomeContent(settings);
  const badges = resolveBadges(settings);
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
      } else if (selectedCategory.startsWith('badge:')) {
        matchCategory = p.badge === selectedCategory.slice(6);
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

  const currentBadge = selectedCategory.startsWith('badge:') ? badges.find((b) => `badge:${b.id}` === selectedCategory) : undefined;

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
    ...badges
      .filter((b) => b.filter)
      .map((b) => {
        const key = `badge:${b.id}`;
        return {
          key,
          label: (b.filterLabel || '').trim() || b.label,
          isActive: selectedCategory === key,
          onClick: () => setSelectedCategory(selectedCategory === key ? 'all' : key),
        };
      }),
    ...visibleCategories.map((cat) => ({
      key: cat.slug || cat.id,
      label: cat.name,
      isActive: selectedCategory === cat.slug || selectedCategory === cat.id,
      onClick: () => setSelectedCategory(cat.slug || cat.id),
    })),
  ];

  return (
    <section id="menu" className="bg-paper py-24 md:py-28 relative scroll-mt-24">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-10">
        {/* En-tête de section */}
        <h2 className="section-title text-xl sm:text-2xl">{home.menuTitle}</h2>
        <p className="mt-8 max-w-md mx-auto text-center text-[15px] text-stone-500 leading-relaxed">
          {home.menuSubtitle}
        </p>

        {/* Onglets de catégories */}
        <div className="mt-12 flex flex-wrap justify-center gap-x-9 gap-y-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={tab.onClick}
              id={`cat-tab-${tab.key.replace(':', '-')}`}
              className={`label-caps text-[11px] pb-1.5 border-b-2 transition-colors cursor-pointer ${
                tab.isActive ? 'text-ink border-ink' : 'text-stone-500 border-transparent hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Rechercher un plat…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-300 rounded-[3px] focus:outline-none focus:border-ink transition-colors placeholder:text-stone-400"
            />
          </div>
          <div className="text-[12px] text-stone-400">
            {filteredProducts.length} plat{filteredProducts.length > 1 ? 's' : ''}
            {currentCategoryObj && selectedCategory !== 'all' ? ` · ${currentCategoryObj.name}` : ''}
            {currentBadge ? ` · ${(currentBadge.filterLabel || '').trim() || currentBadge.label}` : ''}
          </div>
        </div>

        {/* Grille des plats */}
        {loading ? (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="aspect-square bg-stone-200/70 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {filteredProducts.map((product, index) => (
              <FadeIn key={product.id} delay={Math.min(index % 3, 2) * 0.08}>
                <ProductCard product={product} onCustomize={handleOpenCustomizer} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <div className="mt-14 bg-white py-20 px-6 text-center">
            <h3 className="label-caps text-[14px] text-ink">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? `Aucun plat dans « ${currentCategoryObj.name} »`
                : 'Aucun plat correspondant'}
            </h3>
            <p className="mt-3 text-sm text-stone-500">
              {currentCategoryObj && selectedCategory !== 'all' && selectedCategory !== 'cat-all'
                ? 'Des plats y seront bientôt ajoutés.'
                : 'Essayez une autre recherche ou une autre catégorie.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-solid mt-6"
            >
              Toute la carte
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
