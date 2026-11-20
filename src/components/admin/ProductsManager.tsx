import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Search, Flame, Tag } from 'lucide-react';
import { Product, Category, ProductBadge } from '../../types';
import { api } from '../../services/api';
import { ImageUploadInput } from '../common/ImageUploadInput';

interface ProductsManagerProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  formatPrice: (val: number) => string;
  onOpenCategoriesManager?: () => void;
  defaultCategoryFilter?: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  categories,
  onRefresh,
  formatPrice,
  onOpenCategoriesManager,
  defaultCategoryFilter,
}) => {
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(defaultCategoryFilter || 'all');
  const [isSaving, setIsSaving] = useState(false);

  // Quick inline category creation from product form
  const [isQuickCatOpen, setIsQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState('');
  const [isCreatingQuickCat, setIsCreatingQuickCat] = useState(false);

  useEffect(() => {
    if (defaultCategoryFilter) {
      setSelectedCat(defaultCategoryFilter);
    }
  }, [defaultCategoryFilter]);

  const handleOpenNew = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 12000,
      categoryId: categories.find((c) => c.id !== 'cat-all')?.id || 'cat-soupes',
      categoryName: categories.find((c) => c.id !== 'cat-all')?.name || 'Soupes',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
      badge: null,
      isAvailable: true,
      preparationTime: '15 min',
      spiceLevel: 0,
    });
    setIsModalOpen(true);
  };

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) return;
    setIsCreatingQuickCat(true);
    try {
      const created = await api.createCategory({ name: quickCatName.trim() });
      onRefresh();
      if (editingProduct) {
        setEditingProduct({
          ...editingProduct,
          categoryId: created.id,
          categoryName: created.name,
        });
      }
      setQuickCatName('');
      setIsQuickCatOpen(false);
    } catch (err) {
      console.error('Erreur création rapide catégorie:', err);
    } finally {
      setIsCreatingQuickCat(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plat ?')) {
      await api.deleteProduct(id);
      onRefresh();
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    await api.updateProduct(product.id, { isAvailable: !product.isAvailable });
    onRefresh();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    setIsSaving(true);
    try {
      // Find category name
      const foundCat = categories.find((c) => c.id === editingProduct.categoryId);
      const toSave = {
        ...editingProduct,
        categoryName: foundCat ? foundCat.name : editingProduct.categoryName,
      };

      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, toSave);
      } else {
        await api.createProduct(toSave);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs p-2 rounded-xl border border-stone-200 bg-white focus:outline-none"
          >
            <option value="all">Toutes catégories</option>
            {categories
              .filter((c) => c.id !== 'cat-all')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          {onOpenCategoriesManager && (
            <button
              type="button"
              onClick={onOpenCategoriesManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
              title="Gérer, ajouter, modifier ou supprimer les catégories"
            >
              <Tag className="w-3.5 h-3.5 text-[#C62828]" />
              <span className="hidden sm:inline">Gérer catégories</span>
              <span className="sm:hidden">Catégories</span>
            </button>
          )}

          <button
            onClick={handleOpenNew}
            className="bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un plat</span>
          </button>
        </div>
      </div>

      {/* Products Grid / Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5">Plat</th>
                <th className="p-3.5">Catégorie</th>
                <th className="p-3.5">Prix</th>
                <th className="p-3.5">Badge</th>
                <th className="p-3.5">Disponibilité</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div>
                        <div className="font-bold text-stone-900">{p.name}</div>
                        <div className="text-[10px] text-stone-500 line-clamp-1 max-w-xs">
                          {p.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-stone-100 font-medium text-stone-700">
                      {p.categoryName}
                    </span>
                  </td>

                  <td className="p-3.5 font-bold font-serif text-stone-900">
                    {formatPrice(p.price)}
                  </td>

                  <td className="p-3.5">
                    {p.badge === 'Populaire' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                        <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                        Populaire
                      </span>
                    ) : p.badge === 'Nouveau' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Nouveau
                      </span>
                    ) : p.badge === 'Chef' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 text-[#C62828] border border-red-200">
                        Chef
                      </span>
                    ) : p.badge === 'Promotion' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-100 text-orange-800 border border-orange-300" title={p.promoNote}>
                        <Tag className="w-3 h-3 text-orange-600" />
                        Promo{p.promoNote ? ` · ${p.promoNote}` : ''}
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <button
                      onClick={() => handleToggleAvailable(p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                        p.isAvailable
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                      }`}
                    >
                      {p.isAvailable ? 'En vente' : 'Désactivé'}
                    </button>
                  </td>

                  <td className="p-3.5 pr-5 text-right space-x-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-stone-500 hover:text-[#C62828] rounded-lg hover:bg-stone-100"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-[#1F1F1F] text-white flex items-center justify-between">
              <h4 className="font-serif text-base font-bold text-[#FFE082]">
                {editingProduct.id ? 'Modifier le plat' : 'Ajouter une nouvelle spécialité'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="p-5 space-y-4 text-xs flex-1 overflow-y-auto">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nom du plat *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  placeholder="Ex. Mine Sao Spécial Crevettes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-700">Catégorie *</label>
                    <button
                      type="button"
                      onClick={() => setIsQuickCatOpen(true)}
                      className="text-[10.5px] text-[#C62828] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Créer une nouvelle catégorie directement"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nouvelle</span>
                    </button>
                  </div>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  >
                    {categories
                      .filter((c) => c.id !== 'cat-all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Prix (Ar) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={editingProduct.price !== undefined ? editingProduct.price : ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  placeholder="Ingrédients, assaisonnement, accompagnement..."
                />
              </div>

              <ImageUploadInput
                label="Image du plat *"
                value={editingProduct.image || ''}
                onChange={(img) => setEditingProduct({ ...editingProduct, image: img })}
                placeholder="https://images.unsplash.com/..."
                helperText="Vous pouvez importer une photo depuis votre PC ou renseigner un lien direct."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Badge</label>
                  <select
                    value={editingProduct.badge || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        badge: (e.target.value as ProductBadge) || null,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  >
                    <option value="">Aucun badge</option>
                    <option value="Populaire">Populaire</option>
                    <option value="Nouveau">Nouveau</option>
                    <option value="Chef">Chef</option>
                    <option value="Promotion">Promotion</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Temps préparation</label>
                  <input
                    type="text"
                    value={editingProduct.preparationTime || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        preparationTime: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                    placeholder="15-20 min"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Niveau de piquant</label>
                  <select
                    value={editingProduct.spiceLevel ?? 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        spiceLevel: Number(e.target.value) as 0 | 1 | 2 | 3,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  >
                    <option value={0}>Aucun (pas affiché)</option>
                    <option value={1}>🌶️ Doux</option>
                    <option value={2}>🌶️🌶️ Épicé</option>
                    <option value={3}>🌶️🌶️🌶️ Très épicé (affiché "Épicé")</option>
                  </select>
                </div>
              </div>

              {editingProduct.badge === 'Promotion' && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">
                    Détail de la promotion
                  </label>
                  <input
                    type="text"
                    value={editingProduct.promoNote || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        promoNote: e.target.value,
                      })
                    }
                    maxLength={100}
                    placeholder="Ex : + Boisson offerte, + Nem offert, -20% ce week-end..."
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 focus:outline-none focus:border-[#C62828]"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Ce texte s'affiche sur le badge Promotion, directement sur la carte du plat côté client.
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 pt-3 border-t border-stone-100 flex items-center justify-end gap-2 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-[#C62828] text-white font-bold hover:bg-[#8E1B1B] shadow-xs cursor-pointer"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
      {/* Quick Category Creation Mini-Modal */}
      {isQuickCatOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C62828]" />
                <h4 className="font-serif font-bold text-stone-900 text-sm">
                  Nouvelle catégorie rapide
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCatOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Nom de la catégorie <span className="text-[#C62828]">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickCatName}
                  onChange={(e) => setQuickCatName(e.target.value)}
                  placeholder="Ex: Entrées, Woks, Pâtisseries..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsQuickCatOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isCreatingQuickCat || !quickCatName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-[#C62828] text-white text-xs font-bold hover:bg-[#8E1B1B] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isCreatingQuickCat ? 'Création...' : 'Créer et sélectionner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
