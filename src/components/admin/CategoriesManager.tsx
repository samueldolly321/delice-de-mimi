import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  CheckCircle,
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  UtensilsCrossed,
  Tag,
} from 'lucide-react';
import { Category, Product } from '../../types';
import { api } from '../../services/api';

interface CategoriesManagerProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => void;
  onSelectCategoryFilter?: (categoryId: string) => void;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  products,
  onRefresh,
  onSelectCategoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Helper to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Count products per category
  const getProductCount = (categoryId: string, categorySlug?: string): number => {
    return products.filter(
      (p) => p.categoryId === categoryId || (categorySlug && p.categoryId === categorySlug)
    ).length;
  };

  // Filtered categories (excluding system cat-all from direct deletion/reorder, but showing clearly)
  const sortedCategories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const filteredCategories = sortedCategories.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setAutoSlug(true);
    setModalError(null);
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      order: categories.length,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setAutoSlug(false);
    setModalError(null);
    setEditingCategory({ ...cat });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    if (!editingCategory) return;
    if (autoSlug && !editingCategory.id) {
      setEditingCategory({
        ...editingCategory,
        name: val,
        slug: generateSlug(val),
      });
    } else {
      setEditingCategory({
        ...editingCategory,
        name: val,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) {
      setModalError('Veuillez entrer un nom pour la catégorie');
      return;
    }

    setIsSaving(true);
    setModalError(null);
    try {
      const cleanSlug = editingCategory.slug?.trim() || generateSlug(editingCategory.name);
      const dataToSave = {
        ...editingCategory,
        name: editingCategory.name.trim(),
        slug: cleanSlug,
        description: editingCategory.description?.trim() || '',
        order: typeof editingCategory.order === 'number' ? editingCategory.order : categories.length,
      };

      const isNew = !editingCategory.id;
      const saved = editingCategory.id
        ? await api.updateCategory(editingCategory.id, dataToSave)
        : await api.createCategory(dataToSave);

      setIsModalOpen(false);
      setEditingCategory(null);
      setSuccessMessage(
        isNew
          ? `Catégorie « ${saved.name} » créée avec succès ! Elle apparaît dès maintenant dans le menu.`
          : `Catégorie « ${saved.name} » mise à jour avec succès !`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      onRefresh();
    } catch (err: any) {
      console.error('Erreur sauvegarde catégorie:', err);
      setModalError(err?.message || 'Erreur lors de l\'enregistrement de la catégorie');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCat || deletingCat.id === 'cat-all' || deletingCat.slug === 'all') return;
    setIsDeleting(true);
    try {
      const catName = deletingCat.name;
      await api.deleteCategory(deletingCat.id);
      setDeletingCat(null);
      setSuccessMessage(`Catégorie « ${catName} » supprimée.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      onRefresh();
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (cat: Category, direction: 'up' | 'down') => {
    const currentIndex = sortedCategories.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const targetCat = sortedCategories[targetIndex];
    const currentOrder = cat.order ?? currentIndex;
    const targetOrder = targetCat.order ?? targetIndex;

    // Swap orders
    try {
      await Promise.all([
        api.updateCategory(cat.id, { order: targetOrder }),
        api.updateCategory(targetCat.id, { order: currentOrder }),
      ]);
      onRefresh();
    } catch (err) {
      console.error('Erreur réordonnancement:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg hover:bg-emerald-100/50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#C62828]"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <Layers className="w-4 h-4 text-[#C62828]" />
            <span>
              <strong>{categories.filter((c) => c.id !== 'cat-all').length}</strong> catégories actives • <strong>{products.length}</strong> plats au total
            </span>
          </div>

          <button
            onClick={handleOpenCreate}
            id="btn-add-category"
            className="bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une catégorie</span>
          </button>
        </div>
      </div>

      {/* Categories Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#C62828]" />
            <span className="font-serif font-bold text-stone-900 text-sm">
              Liste des Catégories du Menu
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              (Affichage en direct sur le site et la prise de commande)
            </span>
          </div>
          <span className="text-xs text-stone-500 font-semibold">
            {filteredCategories.length} catégorie{filteredCategories.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50/40 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold">
                <th className="p-3.5 pl-5 w-16 text-center">Ordre</th>
                <th className="p-3.5">Nom de la catégorie</th>
                <th className="p-3.5">Identifiant (Slug)</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-center">Plats associés</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 text-xs">
                    Aucune catégorie ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat, idx) => {
                  const dishCount = getProductCount(cat.id, cat.slug);
                  const isSystemAll = cat.id === 'cat-all' || cat.slug === 'all';

                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Order Controls */}
                      <td className="p-3.5 pl-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-6 h-6 rounded-lg bg-stone-100 font-mono text-[11px] font-bold text-stone-700 flex items-center justify-center">
                            {cat.order ?? idx}
                          </span>
                          {!isSystemAll && (
                            <div className="flex flex-col -space-y-1">
                              <button
                                onClick={() => handleMoveOrder(cat, 'up')}
                                disabled={idx <= 1}
                                title="Monter dans la liste"
                                className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(cat, 'down')}
                                disabled={idx >= filteredCategories.length - 1}
                                title="Descendre dans la liste"
                                className="p-0.5 text-stone-400 hover:text-stone-800 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 text-sm">
                            {cat.name}
                          </span>
                          {isSystemAll && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-100 text-stone-600 border border-stone-200">
                              Système
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="p-3.5">
                        <code className="text-[11px] font-mono bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                          {cat.slug || cat.id}
                        </code>
                      </td>

                      {/* Description */}
                      <td className="p-3.5 max-w-xs">
                        <span className="text-stone-600 text-xs line-clamp-1">
                          {cat.description || <span className="text-stone-400 italic">Aucune description</span>}
                        </span>
                      </td>

                      {/* Dish count */}
                      <td className="p-3.5 text-center">
                        {isSystemAll ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">
                            {products.length} plats
                          </span>
                        ) : (
                          <button
                            onClick={() => onSelectCategoryFilter && onSelectCategoryFilter(cat.id)}
                            title="Filtrer les plats de cette catégorie"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                              dishCount > 0
                                ? 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-300/80'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            <UtensilsCrossed className="w-3 h-3 text-[#C62828]" />
                            <span>{dishCount} plat{dishCount > 1 ? 's' : ''}</span>
                          </button>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSystemAll ? (
                            <span className="text-[11px] text-stone-400 italic">Protégée</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEdit(cat)}
                                title="Modifier cette catégorie"
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingCat(cat)}
                                title="Supprimer cette catégorie"
                                className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Category */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1F1F1F] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#C62828] text-[#F4C542] flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-white">
                    {editingCategory.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Définissez le nom, le slug et la description pour le menu
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
            <div className="p-6 space-y-4 text-xs flex-1 overflow-y-auto">
              {/* Modal Error */}
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Category Name */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Nom de la catégorie <span className="text-[#C62828]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-stone-50/50 focus:bg-white text-xs font-semibold"
                  placeholder="Ex: Nouilles Sautées, Dim Sum, Spécialités Wok..."
                />
              </div>

              {/* Slug and Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800">Identifiant (Slug)</label>
                    {!editingCategory.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setAutoSlug(!autoSlug);
                          if (!autoSlug && editingCategory.name) {
                            setEditingCategory({
                              ...editingCategory,
                              slug: generateSlug(editingCategory.name),
                            });
                          }
                        }}
                        className="text-[10px] text-[#C62828] font-bold hover:underline"
                      >
                        {autoSlug ? 'Manuel' : 'Auto'}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={editingCategory.slug || ''}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setEditingCategory({ ...editingCategory, slug: e.target.value });
                    }}
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] font-mono text-xs text-stone-700 bg-stone-50/50 focus:bg-white"
                    placeholder="nouilles-sautees"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Utilisé pour les filtres et l'URL.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingCategory.order ?? ''}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] font-mono text-xs text-stone-700 bg-stone-50/50 focus:bg-white"
                    placeholder="1, 2, 3..."
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Position dans la barre d'onglets du menu.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Description / Sous-titre
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-stone-50/50 focus:bg-white text-xs"
                  placeholder="Ex: Recettes sautées au wok à feu vif avec sauces parfumées..."
                />
              </div>

              {/* Live Preview of Tab */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Aperçu de l'onglet dans le menu public :
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <div className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C62828] text-white shadow-xs">
                    {editingCategory.name || 'Nom de la catégorie'}
                  </div>
                  <div className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-stone-700 border border-[#EBDCC5]/70">
                    {editingCategory.name || 'Nom de la catégorie'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions — pied de page fixe */}
            <div className="p-6 pt-4 flex items-center justify-end gap-2 border-t border-stone-200 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving || !editingCategory.name?.trim()}
                className="px-5 py-2 rounded-xl bg-[#C62828] hover:bg-[#8E1B1B] text-white font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <span>Enregistrement...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingCategory.id ? 'Sauvegarder' : 'Créer la catégorie'}</span>
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#C62828] flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-lg text-stone-900">
                Supprimer la catégorie « {deletingCat.name} » ?
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                Cette action retirera la catégorie de la barre de navigation du restaurant.
              </p>

              {getProductCount(deletingCat.id, deletingCat.slug) > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                  <strong>Attention :</strong> Cette catégorie contient actuellement{' '}
                  <strong>{getProductCount(deletingCat.id, deletingCat.slug)} plat(s)</strong>.
                  Ces plats ne seront pas supprimés : ils seront automatiquement réassignés à la catégorie principale <em>« Plats »</em>.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold transition-colors cursor-pointer text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
