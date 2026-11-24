import React, { useState } from 'react';
import {
  Save,
  Check,
  Store,
  Phone,
  Clock,
  DollarSign,
  Share2,
  FileText,
  Image as ImageIcon,
  ChefHat,
  Layers,
  ChevronRight,
  Plus,
  Trash2,
  HelpCircle,
  Bell,
  Mail,
  Send,
  Volume2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Gift,
  LayoutTemplate,
  Soup,
} from 'lucide-react';
import { RestaurantSettings, HeroSlide, ChefInfo } from '../../types';
import { HomeContentEditor } from './HomeContentEditor';
import { ToppingsEditor } from './ToppingsEditor';
import { resolveAllToppings } from '../../data/homeContent';
import { api } from '../../services/api';
import { SocialIcon } from '../SocialIcons';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { DEFAULT_HERO_SLIDES, DEFAULT_CHEF_INFO } from '../../data/seedData';
import { useCart } from '../../context/CartContext';

interface SettingsManagerProps {
  settings: RestaurantSettings;
  onRefresh: () => void;
}

type SettingsSection = 'identity' | 'notifications' | 'slides' | 'home' | 'toppings' | 'chef' | 'contact' | 'delivery' | 'loyalty' | 'social' | 'invoice' | 'security' | 'danger';

export const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onRefresh }) => {
  const { refreshSettings, formatPrice } = useCart();
  const [activeSection, setActiveSection] = useState<SettingsSection>('identity');

  const [formData, setFormData] = useState<RestaurantSettings>({
    ...settings,
    logoUrl: settings.logoUrl || '',
    whatsappPhone: settings.whatsappPhone || '',
    whatsappUrl: settings.whatsappUrl || '',
    facebookUrl: settings.facebookUrl || '',
    instagramUrl: settings.instagramUrl || '',
    tiktokUrl: settings.tiktokUrl || '',
    notificationEmail: settings.notificationEmail || settings.email || 'contact@saveursdasie.mg',
    notificationPhone: settings.notificationPhone || settings.whatsappPhone || '+261 34 20 888 99',
    notifyEmailEnabled: settings.notifyEmailEnabled !== false,
    notifyWhatsappEnabled: settings.notifyWhatsappEnabled !== false,
    notifySoundEnabled: settings.notifySoundEnabled !== false,
    nifNumber: settings.nifNumber || '3000845219',
    statNumber: settings.statNumber || '56101 11 2021 0 10582',
    rcsNumber: settings.rcsNumber || 'RCS Antananarivo 2021 B 00458',
    invoiceNotice: settings.invoiceNotice || 'Merci de votre fidélité ! Bon appétit et à très bientôt !',
    freeDeliveryNotice: settings.freeDeliveryNotice || 'Livraison offerte dès 50 000 Ar',
    slides: settings.slides && settings.slides.length > 0 ? settings.slides : DEFAULT_HERO_SLIDES,
    chef: settings.chef || DEFAULT_CHEF_INFO,
    home: settings.home || {},
    soupToppings: resolveAllToppings(settings),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);
  const [testingType, setTestingType] = useState<'email' | 'whatsapp' | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; message: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordResult(null);

    if (newPassword.length < 8) {
      setPasswordResult({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordResult({ success: false, message: 'La confirmation ne correspond pas au nouveau mot de passe.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await api.changeAdminPassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordResult({ success: true, message: 'Mot de passe changé avec succès.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordResult({ success: false, message: result.error || 'Échec du changement de mot de passe.' });
      }
    } catch (err: any) {
      setPasswordResult({ success: false, message: err?.message || 'Erreur réseau.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetProducts = async () => {
    if (resetConfirmText !== 'SUPPRIMER') return;
    setIsResetting(true);
    setResetResult(null);
    try {
      const result = await api.resetAllProducts();
      if (result.success) {
        setResetResult({ success: true, message: `${result.deletedCount ?? 0} plat(s) supprimé(s). Le menu est maintenant vide.` });
        setResetConfirmText('');
        onRefresh();
      } else {
        setResetResult({ success: false, message: result.error || 'La réinitialisation a échoué.' });
      }
    } catch (err: any) {
      setResetResult({ success: false, message: err?.message || 'Erreur réseau lors de la réinitialisation.' });
    } finally {
      setIsResetting(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const history = await api.getNotificationLogs();
      setLogs(history);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'whatsapp') => {
    setTestingType(type);
    setTestResult(null);
    try {
      const target = type === 'email' ? formData.notificationEmail : formData.notificationPhone;
      const res = await api.testNotification(type, target);
      setTestResult(res);
      // Ouvre immédiatement le lien WhatsApp généré, pour un retour visible sans clic supplémentaire.
      if (type === 'whatsapp' && res.success && res.previewUrl) {
        window.open(res.previewUrl, '_blank', 'noopener,noreferrer');
      }
      fetchLogs();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Erreur lors du test' });
    } finally {
      setTestingType(null);
    }
  };

  const playTestChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccess(false);

    try {
      await api.updateSettings(formData);
      await refreshSettings();
      onRefresh();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for updating slides
  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    const currentSlides = formData.slides ? [...formData.slides] : [...DEFAULT_HERO_SLIDES];
    currentSlides[index] = { ...currentSlides[index], ...patch };
    setFormData({ ...formData, slides: currentSlides });
  };

  const addSlide = () => {
    const currentSlides = formData.slides ? [...formData.slides] : [...DEFAULT_HERO_SLIDES];
    const newSlide: HeroSlide = {
      id: Date.now(),
      tag: 'Nouvelle Spécialité',
      badgeText: 'FAIT MAISON',
      titlePrefix: 'Découvrez notre nouvelle recette ',
      titleHighlight: 'préparée avec passion.',
      description: 'Ingrédients frais et savoir-faire traditionnel.',
      dishName: 'Nouveau Plat',
      dishPrice: 'Dès 12 000 Ar',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85',
      imageAlt: 'Nouveau plat asiatique',
      actionText: 'Découvrir la carte',
      actionTarget: 'menu',
    };
    setFormData({ ...formData, slides: [...currentSlides, newSlide] });
  };

  const removeSlide = (index: number) => {
    if (!formData.slides || formData.slides.length <= 1) {
      alert('Vous devez conserver au minimum une diapositive pour le diaporama.');
      return;
    }
    const currentSlides = [...formData.slides];
    currentSlides.splice(index, 1);
    setFormData({ ...formData, slides: currentSlides });
  };

  // Helper for updating chef
  const updateChef = (patch: Partial<ChefInfo>) => {
    const currentChef = formData.chef ? { ...formData.chef } : { ...DEFAULT_CHEF_INFO };
    setFormData({ ...formData, chef: { ...currentChef, ...patch } });
  };

  const SECTIONS: ReadonlyArray<{
    id: SettingsSection;
    label: string;
    shortLabel?: string;
    icon: React.ElementType;
  }> = [
    { id: 'identity', label: 'Identité & Logo', icon: Store },
    { id: 'notifications', label: 'Notifications Commandes (Email & Tél)', shortLabel: 'Notifications', icon: Bell },
    { id: 'slides', label: 'Diaporama Accueil (Slides)', shortLabel: 'Diaporama', icon: Layers },
    { id: 'home', label: "Page d'accueil (textes & photos)", shortLabel: "Page d'accueil", icon: LayoutTemplate },
    { id: 'toppings', label: 'Garnitures de la soupe', shortLabel: 'Garnitures', icon: Soup },
    { id: 'chef', label: 'Le Chef & Histoire', shortLabel: 'Le Chef', icon: ChefHat },
    { id: 'contact', label: 'Coordonnées & Horaires', shortLabel: 'Coordonnées', icon: Phone },
    { id: 'delivery', label: 'Tarifs & Livraison', shortLabel: 'Livraison', icon: DollarSign },
    { id: 'loyalty', label: 'Programme de Fidélité', shortLabel: 'Fidélité', icon: Gift },
    { id: 'social', label: 'Réseaux Sociaux', icon: Share2 },
    { id: 'invoice', label: 'Facture N° 8 Madagascar', shortLabel: 'Facture N° 8', icon: FileText },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'danger', label: 'Zone Dangereuse', icon: AlertTriangle },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Success Notification */}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Toutes les modifications ont été enregistrées avec succès ! Elles sont immédiatement appliquées sur le site web et sur les Factures N°8.
            </span>
          </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
            Synchronisé
          </span>
        </div>
      )}

      {/* Sticky Top Bar with quick save & tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-4 z-20">
        {/* Navigation Tabs — passage à la ligne sur grand écran, défilement sur mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto sm:overflow-visible sm:flex-wrap pb-1 sm:pb-0 scrollbar-none text-xs">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                title={sec.label}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{sec.shortLabel ?? sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#1F1F1F] hover:bg-[#8E1B1B] text-[#FFE082] px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <Save className="w-3.5 h-3.5 text-[#F4C542]" />
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>

      {/* 1. IDENTITY & LOGO */}
      {activeSection === 'identity' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-5 animate-in fade-in-50 duration-150">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
              <Store className="w-4 h-4 text-[#C62828]" />
              <span>Identité Visuelle & Logo Administrable</span>
            </h4>
            <span className="text-[11px] text-stone-500">
              Modifiez le nom, la description et importez votre logo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Nom officiel du restaurant *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="Ex: Saveurs d'Asie"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="Ex: L'art culinaire chinois & asiatique d'exception"
              />
            </div>
          </div>

          {/* Logo file upload section */}
          <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#C62828]" />
                <span>Importation du Logo (Ordinateur ou URL)</span>
              </span>
              <span className="text-[11px] text-stone-500">
                Affiché dans l'en-tête, le pied de page et les Factures N°8
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8">
                <ImageUploadInput
                  label="Fichier Image du Logo"
                  value={formData.logoUrl || ''}
                  onChange={(img) => setFormData({ ...formData, logoUrl: img })}
                  placeholder="https://... ou choisissez un fichier sur votre ordinateur"
                  helperText="Importez le logo de votre restaurant depuis votre PC (PNG transparent recommandé) ou collez une URL."
                />
              </div>

              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-stone-200 shadow-2xs text-center">
                <span className="text-[10px] text-stone-400 font-semibold mb-1">Aperçu du Logo</span>
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Aperçu logo"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#C62828] shadow-xs"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#C62828] text-[#F4C542] flex items-center justify-center font-serif text-2xl font-bold shadow-xs">
                    {formData.logoText || '味'}
                  </div>
                )}
                <span className="text-[10px] text-stone-500 mt-1">
                  {formData.logoUrl ? 'Image importée' : 'Sceau par défaut'}
                </span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1 text-xs">
                Caractère calligraphique ou Texte alternatif du Sceau (si pas d'image)
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.logoText}
                onChange={(e) => setFormData({ ...formData, logoText: e.target.value })}
                placeholder="Ex: 味 (Goût/Saveur), 龍 (Dragon), 祥 (Bonne Fortune)"
                className="w-full max-w-sm p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs bg-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1 text-xs">
              Description de présentation du restaurant
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Ce texte apparaît notamment dans le pied de page (footer) du site.
            </p>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1 text-xs">
              Texte de la barre d'annonce (haut du site)
            </label>
            <input
              type="text"
              value={formData.topBarText || ''}
              onChange={(e) => setFormData({ ...formData, topBarText: e.target.value })}
              placeholder="Cuisine ouverte • Choisissez | Commandez | Se régaler."
              maxLength={150}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Le petit bandeau sombre tout en haut du site, visible en permanence à côté du téléphone et de la livraison.
            </p>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1 text-xs">
              Accroche du pied de page (footer)
            </label>
            <input
              type="text"
              value={formData.footerTagline || ''}
              onChange={(e) => setFormData({ ...formData, footerTagline: e.target.value })}
              placeholder="Fait avec passion • Cuisine authentique d'Asie"
              maxLength={150}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Petit texte affiché tout en bas du site, à côté du copyright.
            </p>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1 text-xs">
              Texte des droits réservés (footer)
            </label>
            <input
              type="text"
              value={formData.footerCopyrightSuffix || ''}
              onChange={(e) => setFormData({ ...formData, footerCopyrightSuffix: e.target.value })}
              placeholder="Tous droits réservés."
              maxLength={150}
              className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
            />
            <p className="text-[10px] text-stone-500 mt-1">
              Affiché après « © {new Date().getFullYear()} — {formData.name || 'Votre restaurant'}. » — l'année et le nom sont toujours à jour automatiquement.
            </p>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DES COMMANDES (EMAIL & TÉLÉPHONE / WHATSAPP) */}
      {activeSection === 'notifications' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-6 animate-in fade-in-50 duration-150">
          <div className="border-b border-stone-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#C62828]" />
                <span>Alertes & Notifications Immédiates des Commandes</span>
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                Soyez alerté instantanément par <strong>Email</strong>, par <strong>Téléphone / WhatsApp</strong> et par <strong>Carillon Sonore</strong> dès qu'un client passe commande.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Service d'alerte actif
              </span>
            </div>
          </div>

          {/* Test feedback notification */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                testResult.success
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/90 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold">{testResult.message}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {testResult.success
                      ? 'Le système d\'alerte a traité l\'envoi avec succès.'
                      : 'Vérifiez la configuration ou le format du destinataire.'}
                  </div>
                </div>
              </div>
              {testResult.previewUrl && (
                <a
                  href={testResult.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir aperçu WhatsApp</span>
                </a>
              )}
            </div>
          )}

          {/* Section 1 : Email Notifications */}
          <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#1F1F1F]">
                    1. Notification par Email
                  </h5>
                  <p className="text-[11px] text-stone-500">
                    Reçoit un bon de commande numérique complet avec plats, adresses et coordonnées
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyEmailEnabled}
                  onChange={(e) => setFormData({ ...formData, notifyEmailEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C62828]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
              <div className="sm:col-span-2">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">
                  Adresse email du destinataire (gérant / cuisine)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    value={formData.notificationEmail}
                    onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                    placeholder="ex: gerant@saveursdasie.mg ou votre.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs bg-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Les emails sont formatés avec une mise en page soignée, le détail des plats, sauces, suppléments et total.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={testingType === 'email' || !formData.notificationEmail}
                  onClick={() => handleTestNotification('email')}
                  className="w-full py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {testingType === 'email' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Tester l'envoi Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 2 : WhatsApp & Mobile Notifications */}
          <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-[#1F1F1F]">
                    2. Notification Téléphone & WhatsApp
                  </h5>
                  <p className="text-[11px] text-stone-500">
                    Alerte directe sur votre mobile avec lien interactif de confirmation
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifyWhatsappEnabled}
                  onChange={(e) => setFormData({ ...formData, notifyWhatsappEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
              <div className="sm:col-span-2">
                <label className="font-semibold text-stone-700 block mb-1 text-xs">
                  Numéro de téléphone / WhatsApp de réception
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={formData.notificationPhone}
                    onChange={(e) => setFormData({ ...formData, notificationPhone: e.target.value })}
                    placeholder="ex: +261 34 20 888 99 ou 034 20 888 99"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs bg-white font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Format international recommandé (+261...). Si vide, le numéro WhatsApp de l'onglet <strong>Coordonnées</strong> est utilisé à la place — les deux ne sont pas synchronisés automatiquement, pensez à mettre à jour ce champ aussi si vous changez de numéro.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  disabled={testingType === 'whatsapp' || !formData.notificationPhone}
                  onClick={() => handleTestNotification('whatsapp')}
                  className="w-full py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE5D] border border-[#25D366]/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {testingType === 'whatsapp' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                  )}
                  <span>Tester WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3 : Carillon Sonore en Cuisine */}
          <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-[#1F1F1F]">
                  3. Carillon sonore d'arrivée de commande (Back-Office)
                </h5>
                <p className="text-[11px] text-stone-500">
                  Fait retentir un carillon musical dès qu'une commande est reçue pendant que le portail administrateur est ouvert
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={playTestChime}
                className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Écouter le carillon</span>
              </button>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifySoundEnabled}
                  onChange={(e) => setFormData({ ...formData, notifySoundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C62828]" />
              </label>
            </div>
          </div>

          {/* Section 4 : Historique des dernières alertes envoyées */}
          <div className="border-t border-stone-200 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Historique récent des notifications générées</span>
              </h5>
              <button
                type="button"
                onClick={fetchLogs}
                disabled={loadingLogs}
                className="text-[11px] text-[#C62828] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>Actualiser</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-center text-xs text-stone-500">
                Aucune alerte enregistrée pour le moment. Cliquez sur "Tester l'envoi Email" ou passez une commande pour voir l'historique en direct.
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900">{log.orderId}</span>
                        <span className="text-stone-500">• {new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                        <span className="font-medium text-stone-600">({log.customerName})</span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {log.itemsSummary} — <strong>{log.total.toLocaleString('fr-FR')} Ar</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        log.emailStatus === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                        log.emailStatus === 'simulated' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        Email : {log.emailStatus === 'sent' ? 'Envoyé' : log.emailStatus === 'simulated' ? 'Simulé (Prêt)' : 'Désactivé'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        log.phoneStatus === 'sent' || log.phoneStatus === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        WhatsApp : Actif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5 : Configuration SMTP avancée */}
          <div className="bg-[#FFF9F0] border border-[#EBDCC5] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#8E1B1B]">
              <ShieldCheck className="w-4 h-4 text-[#8E1B1B]" />
              <span>Guide d'installation pour la production (Envoi Email Réel SMTP)</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Pour connecter votre propre adresse Gmail, Brevo, OVH ou Outlook en environnement hébergé, renseignez simplement les variables dans votre fichier <code>.env</code> :
            </p>
            <pre className="p-3 bg-[#1F1F1F] text-[#FFE082] rounded-xl font-mono text-[10px] overflow-x-auto">
{`# Exemple de configuration dans votre .env :
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_d_application
SMTP_FROM="Saveurs d'Asie <contact@saveursdasie.mg>"`}
            </pre>
            <p className="text-stone-500 text-[10px]">
              En l'absence de serveur SMTP configuré, l'application fonctionne en <em>Mode Simulation Intelligente</em> : l'email est généré et journalisé en temps réel, et WhatsApp s'ouvre instantanément sans aucun frais !
            </p>
          </div>
        </div>
      )}

      {/* 2. HERO SLIDES (DIAPORAMA) */}
      {activeSection === 'slides' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-6 animate-in fade-in-50 duration-150">
          <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C62828]" />
                <span>Diaporama d'Accueil (Diapositives interactives)</span>
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Personnalisez chaque slide avec son image importée depuis votre ordinateur, ses textes, badges et prix.
              </p>
            </div>

            <button
              type="button"
              onClick={addSlide}
              className="px-3 py-1.5 rounded-xl bg-[#C62828]/10 hover:bg-[#C62828]/20 text-[#C62828] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une diapositive</span>
            </button>
          </div>

          <div className="space-y-6">
            {(formData.slides || DEFAULT_HERO_SLIDES).map((slide, index) => (
              <div
                key={slide.id || index}
                className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50/50 space-y-4 relative hover:border-[#C62828]/40 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#1F1F1F] text-[#FFE082] font-bold text-xs flex items-center justify-center font-mono">
                      {index + 1}
                    </span>
                    <span className="font-bold text-xs text-stone-900">
                      Diapositive #{index + 1} : {slide.tag || 'Sans titre'}
                    </span>
                  </div>

                  {formData.slides && formData.slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlide(index)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer cette diapositive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Slide Image with file upload */}
                <ImageUploadInput
                  label="Image de la diapositive *"
                  value={slide.image}
                  onChange={(img) => updateSlide(index, { image: img })}
                  placeholder="https://... ou choisissez un fichier sur votre ordinateur"
                  helperText="Importez la photo du plat depuis votre PC (format paysage recommandé)."
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Petit titre au-dessus du grand titre */}
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Petit titre (au-dessus du titre)
                    </label>
                    <input
                      type="text"
                      value={slide.tag || ''}
                      onChange={(e) => updateSlide(index, { tag: e.target.value })}
                      placeholder="Ex: Soupes & bouillons mijotés (vide = aucun)"
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm"
                    />
                  </div>

                  {/* Description de la photo (accessibilité + Google) */}
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Description de la photo
                    </label>
                    <input
                      type="text"
                      value={slide.imageAlt || ''}
                      onChange={(e) => updateSlide(index, { imageAlt: e.target.value })}
                      placeholder="Ex: Bol de soupe aux crevettes et œufs marinés"
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">Lue par Google et les personnes malvoyantes.</p>
                  </div>

                  {/* Titre du slide */}
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-stone-700 block mb-1">
                      Titre de la diapositive *
                    </label>
                    <input
                      type="text"
                      value={
                        slide.title ??
                        (slide.titlePrefix ? `${slide.titlePrefix} ${slide.titleHighlight || ''}` : '')
                      }
                      onChange={(e) => updateSlide(index, { title: e.target.value })}
                      placeholder="Ex: Le grand bol traditionnel fumant aux nems croustillants"
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-sm font-semibold"
                    />
                  </div>

                  {/* Texte du slide */}
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-stone-700 block mb-1">
                      Texte de la diapositive *
                    </label>
                    <textarea
                      rows={2}
                      value={slide.description}
                      onChange={(e) => updateSlide(index, { description: e.target.value })}
                      placeholder="Texte descriptif mis en avant sur le slide..."
                      className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white text-xs leading-relaxed"
                    />
                  </div>

                  {/* 1 Bouton CTA Commander */}
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Texte du bouton CTA *
                    </label>
                    <input
                      type="text"
                      value={slide.actionText || 'Commander'}
                      onChange={(e) => updateSlide(index, { actionText: e.target.value })}
                      placeholder="Ex: Commander"
                      className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">
                      Action du bouton CTA
                    </label>
                    <select
                      value={slide.actionTarget || 'menu'}
                      onChange={(e) =>
                        updateSlide(index, { actionTarget: e.target.value as 'customizer' | 'menu' })
                      }
                      className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] bg-white cursor-pointer"
                    >
                      <option value="menu">Défiler vers le Menu de commande</option>
                      <option value="customizer">Ouvrir le Composeur de Soupe</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAGE D'ACCUEIL : textes et photos des sections */}
      {activeSection === 'home' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs animate-in fade-in-50 duration-150">
          <HomeContentEditor value={formData.home || {}} onChange={(home) => setFormData({ ...formData, home })} />
        </div>
      )}

      {/* GARNITURES DE LA SOUPE */}
      {activeSection === 'toppings' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs animate-in fade-in-50 duration-150">
          <ToppingsEditor
            value={formData.soupToppings || []}
            onChange={(soupToppings) => setFormData({ ...formData, soupToppings })}
            formatPrice={formatPrice}
          />
        </div>
      )}

      {/* 3. CHEF & HISTOIRE */}
      {activeSection === 'chef' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-5 animate-in fade-in-50 duration-150">
          <div className="border-b border-stone-100 pb-3">
            <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#C62828]" />
              <span>Section Le Chef & Histoire Culinaire</span>
            </h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Ces éléments s'affichent dans la section "Notre Histoire & Le Chef" sur la page d'accueil.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Chef Photo with upload */}
            <div className="md:col-span-5 space-y-3">
              <ImageUploadInput
                label="Photo du Chef *"
                value={formData.chef?.imageUrl || DEFAULT_CHEF_INFO.imageUrl}
                onChange={(img) => updateChef({ imageUrl: img })}
                placeholder="https://... ou importez depuis votre PC"
                helperText="Importez le portrait de votre Chef depuis votre ordinateur."
              />

              <div>
                <label className="font-semibold text-stone-700 block mb-1 text-xs">
                  Caractère calligraphique du sceau Chef
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={formData.chef?.badge || 'Passion'}
                  onChange={(e) => updateChef({ badge: e.target.value })}
                  placeholder="Passion ou Sceau"
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
                />
              </div>
            </div>

            {/* Chef details */}
            <div className="md:col-span-7 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Nom du Chef
                  </label>
                  <input
                    type="text"
                    value={formData.chef?.name || DEFAULT_CHEF_INFO.name}
                    onChange={(e) => updateChef({ name: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">
                    Titre / Rôle (Ex: Maître Wok & Fondateur)
                  </label>
                  <input
                    type="text"
                    value={formData.chef?.title || DEFAULT_CHEF_INFO.title}
                    onChange={(e) => updateChef({ title: e.target.value })}
                    className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Sous-titre / Origine
                </label>
                <input
                  type="text"
                  value={formData.chef?.subtitle || DEFAULT_CHEF_INFO.subtitle}
                  onChange={(e) => updateChef({ subtitle: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Grand Titre de l'Histoire
                </label>
                <input
                  type="text"
                  value={formData.chef?.storyTitle || DEFAULT_CHEF_INFO.storyTitle}
                  onChange={(e) => updateChef({ storyTitle: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Texte de l'Histoire
                </label>
                <textarea
                  rows={3}
                  value={formData.chef?.storyText || DEFAULT_CHEF_INFO.storyText}
                  onChange={(e) => updateChef({ storyText: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Citation / Philosophie Culinaire
                </label>
                <textarea
                  rows={3}
                  value={formData.chef?.philosophyQuote || DEFAULT_CHEF_INFO.philosophyQuote}
                  onChange={(e) => updateChef({ philosophyQuote: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Auteur de la citation
                </label>
                <input
                  type="text"
                  value={formData.chef?.philosophyAuthor || DEFAULT_CHEF_INFO.philosophyAuthor}
                  onChange={(e) => updateChef({ philosophyAuthor: e.target.value })}
                  className="w-full p-2 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-2">
                  Statistiques affichées (3 blocs chiffrés)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Bloc 1</label>
                    <input
                      type="text"
                      placeholder="8+"
                      value={formData.chef?.stat1Value ?? DEFAULT_CHEF_INFO.stat1Value}
                      onChange={(e) => updateChef({ stat1Value: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-center font-bold focus:outline-none focus:border-[#C62828]"
                    />
                    <input
                      type="text"
                      placeholder="Années d'expérience"
                      value={formData.chef?.stat1Label ?? DEFAULT_CHEF_INFO.stat1Label}
                      onChange={(e) => updateChef({ stat1Label: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-[11px] focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Bloc 2</label>
                    <input
                      type="text"
                      placeholder="20+"
                      value={formData.chef?.stat2Value ?? DEFAULT_CHEF_INFO.stat2Value}
                      onChange={(e) => updateChef({ stat2Value: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-center font-bold focus:outline-none focus:border-[#C62828]"
                    />
                    <input
                      type="text"
                      placeholder="Spécialités"
                      value={formData.chef?.stat2Label ?? DEFAULT_CHEF_INFO.stat2Label}
                      onChange={(e) => updateChef({ stat2Label: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-[11px] focus:outline-none focus:border-[#C62828]"
                    />
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Bloc 3</label>
                    <input
                      type="text"
                      placeholder="100%"
                      value={formData.chef?.stat3Value ?? DEFAULT_CHEF_INFO.stat3Value}
                      onChange={(e) => updateChef({ stat3Value: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-center font-bold focus:outline-none focus:border-[#C62828]"
                    />
                    <input
                      type="text"
                      placeholder="Fait avec passion"
                      value={formData.chef?.stat3Label ?? DEFAULT_CHEF_INFO.stat3Label}
                      onChange={(e) => updateChef({ stat3Label: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 text-[11px] focus:outline-none focus:border-[#C62828]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTACT & HOURS */}
      {activeSection === 'contact' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
          <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2 border-b border-stone-100 pb-2">
            <Phone className="w-4 h-4 text-[#C62828]" />
            <span>Coordonnées & Horaires d'Ouverture</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Adresse physique du restaurant
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Lien Google Maps
              </label>
              <input
                type="text"
                value={formData.googleMapsUrl || ''}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                placeholder="https://maps.google.com/?q=... (ou lien de partage Google Maps)"
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] font-mono text-[11px]"
              />
              <p className="text-[10px] text-stone-500 mt-1">
                Ouvrez votre emplacement sur Google Maps, cliquez sur « Partager » puis collez le lien ici. Sans ce lien, un lien de recherche sera généré automatiquement à partir de l'adresse ci-dessus (moins précis).
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Téléphones pour commandes
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Numéro WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsappPhone || ''}
                onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="+261 34 20 888 99"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Horaires d'ouverture
              </label>
              <input
                type="text"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. DELIVERY & PRICING */}
      {activeSection === 'delivery' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
          <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2 border-b border-stone-100 pb-2">
            <DollarSign className="w-4 h-4 text-[#C62828]" />
            <span>Frais de Livraison & Prise de Commande</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Frais de livraison minimum « à partir de » (Ariary)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.deliveryFee}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryFee: Number(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Seuil de livraison gratuite (Ariary, 0 = désactivé)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.freeDeliveryThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, freeDeliveryThreshold: Number(e.target.value) || 0 })
                }
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Texte du bandeau de livraison offerte
              </label>
              <input
                type="text"
                placeholder="Ex: Livraison offerte dès 50 000 Ar"
                value={formData.freeDeliveryNotice || ''}
                onChange={(e) =>
                  setFormData({ ...formData, freeDeliveryNotice: e.target.value })
                }
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Texte affiché dans le bandeau supérieur du site web (laissez vide pour utiliser le seuil automatique en Ariary).
              </p>
            </div>

            <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <input
                type="checkbox"
                id="isOrderingEnabled"
                checked={formData.isOrderingEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isOrderingEnabled: e.target.checked })
                }
                className="w-4 h-4 text-[#C62828] rounded-sm focus:ring-[#C62828] cursor-pointer"
              />
              <label htmlFor="isOrderingEnabled" className="text-xs font-semibold text-stone-800 cursor-pointer">
                Prise de commandes en ligne ouverte aux clients (Activer/Désactiver le panier)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Programme de Fidélité */}
      {activeSection === 'loyalty' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-800">Programme de Fidélité</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                Récompensez automatiquement vos clients réguliers. Calculé côté serveur à partir du nombre réel de commandes de chaque client — aucune action requise de votre part au quotidien.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <input
              type="checkbox"
              id="loyaltyEnabled"
              checked={formData.loyaltyEnabled ?? true}
              onChange={(e) => setFormData({ ...formData, loyaltyEnabled: e.target.checked })}
              className="w-4 h-4 text-[#C62828] rounded-sm focus:ring-[#C62828] cursor-pointer"
            />
            <label htmlFor="loyaltyEnabled" className="text-xs font-semibold text-stone-800 cursor-pointer">
              Activer le programme de fidélité
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Livraison offerte toutes les... commandes
              </label>
              <input
                type="number"
                min={2}
                max={100}
                value={formData.loyaltyFreeDeliveryEvery ?? 5}
                onChange={(e) => setFormData({ ...formData, loyaltyFreeDeliveryEvery: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Ex : 5 → livraison offerte à la 5ème commande, puis 10ème, 15ème...
              </p>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Plat offert toutes les... commandes
              </label>
              <input
                type="number"
                min={2}
                max={100}
                value={formData.loyaltyFreeSoupEvery ?? 10}
                onChange={(e) => setFormData({ ...formData, loyaltyFreeSoupEvery: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Ex : 10 → à la 10ème, 20ème, 30ème commande (en plus de la livraison offerte, car 10 est aussi un multiple de 5).
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-stone-700 block mb-1">
                Nom du plat/soupe offert(e)
              </label>
              <input
                type="text"
                value={formData.loyaltyFreeSoupName || ''}
                onChange={(e) => setFormData({ ...formData, loyaltyFreeSoupName: e.target.value })}
                placeholder="Soupe basique"
                maxLength={80}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Ce nom apparaît tel quel dans la commande, en tant qu'article gratuit — il ne correspond pas forcément à un plat précis de votre carte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. SOCIAL NETWORKS */}
      {activeSection === 'social' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
          <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2 border-b border-stone-100 pb-2">
            <Share2 className="w-4 h-4 text-[#C62828]" />
            <span>Réseaux Sociaux Officiels</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[#1877F2] text-white flex items-center justify-center">
                  <SocialIcon platform="facebook" size={13} />
                </div>
                <span>Page Facebook</span>
              </label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white flex items-center justify-center">
                  <SocialIcon platform="instagram" size={13} />
                </div>
                <span>Compte Instagram</span>
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-black text-white flex items-center justify-center">
                  <SocialIcon platform="tiktok" size={13} />
                </div>
                <span>Compte TikTok</span>
              </label>
              <input
                type="url"
                value={formData.tiktokUrl}
                onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="https://tiktok.com/@..."
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-md bg-[#25D366] text-white flex items-center justify-center">
                  <SocialIcon platform="whatsapp" size={13} />
                </div>
                <span>Lien direct WhatsApp Web / Chat</span>
              </label>
              <input
                type="url"
                value={formData.whatsappUrl || ''}
                onChange={(e) => setFormData({ ...formData, whatsappUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="https://wa.me/261342088899"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. FACTURE N° 8 MADAGASCAR */}
      {activeSection === 'invoice' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 animate-in fade-in-50 duration-150">
          <h4 className="font-serif text-base font-bold text-[#1F1F1F] flex items-center gap-2 border-b border-stone-100 pb-2">
            <FileText className="w-4 h-4 text-[#C62828]" />
            <span>Paramètres Facturation N° 8 (Bons de Caisse & Factures Normalisées)</span>
          </h4>

          <p className="text-xs text-stone-500">
            Ces informations figurent obligatoirement sur les impressions de <strong>Facture N° 8</strong> remises aux clients lors des livraisons et retraits en caisse.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                N° NIF (Identification Fiscale)
              </label>
              <input
                type="text"
                value={formData.nifNumber || ''}
                onChange={(e) => setFormData({ ...formData, nifNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="3000845219"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                N° STAT (Statistique)
              </label>
              <input
                type="text"
                value={formData.statNumber || ''}
                onChange={(e) => setFormData({ ...formData, statNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="56101 11 2021 0 10582"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                N° RCS (Registre du Commerce)
              </label>
              <input
                type="text"
                value={formData.rcsNumber || ''}
                onChange={(e) => setFormData({ ...formData, rcsNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="RCS Antananarivo 2021 B 00458"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-semibold text-stone-700 block mb-1">
                Mention de bas de Facture N° 8 (Remerciement)
              </label>
              <input
                type="text"
                value={formData.invoiceNotice || ''}
                onChange={(e) => setFormData({ ...formData, invoiceNotice: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828]"
                placeholder="Merci de votre fidélité ! Bon appétit et à très bientôt !"
              />
            </div>
          </div>
        </div>
      )}

      {activeSection === 'security' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-800">Changer le mot de passe administrateur</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                Votre mot de passe est stocké de façon chiffrée (haché) — personne, pas même un accès direct à la base de données, ne peut le lire en clair.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
            <div>
              <label className="font-semibold text-stone-700 block mb-1 text-xs">Mot de passe actuel</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPasswordResult(null); }}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1 text-xs">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordResult(null); }}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
              />
              <p className="text-[10px] text-stone-500 mt-1">Au moins 8 caractères.</p>
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1 text-xs">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                required
                value={confirmNewPassword}
                onChange={(e) => { setConfirmNewPassword(e.target.value); setPasswordResult(null); }}
                className="w-full p-2.5 rounded-xl border border-stone-200 focus:outline-none focus:border-[#C62828] text-xs"
              />
            </div>

            {passwordResult && (
              <div className={`text-xs font-medium rounded-lg px-3 py-2 ${passwordResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {passwordResult.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#1F1F1F] hover:bg-black disabled:opacity-50 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? 'Changement en cours...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      )}

      {activeSection === 'danger' && (
        <div className="bg-white rounded-2xl border-2 border-red-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-700">Réinitialiser le menu</h3>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                Supprime <strong>tous les plats</strong> du menu (ex : les plats de démonstration d'origine).
                Les catégories, les commandes, les clients et les paramètres du restaurant ne sont pas affectés.
                Cette action est <strong>irréversible</strong>.
              </p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold text-stone-700">
              Pour confirmer, tapez <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-red-300">SUPPRIMER</span> ci-dessous :
            </label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => { setResetConfirmText(e.target.value); setResetResult(null); }}
              placeholder="SUPPRIMER"
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-red-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              type="button"
              onClick={handleResetProducts}
              disabled={resetConfirmText !== 'SUPPRIMER' || isResetting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {isResetting ? 'Suppression en cours...' : 'Supprimer tous les plats'}
            </button>

            {resetResult && (
              <div className={`text-xs font-medium rounded-lg px-3 py-2 ${resetResult.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {resetResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Button */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-xs text-stone-500">
          Les réglages sont conservés dans la base de données et restent modifiables à tout moment.
        </span>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#C62828] hover:bg-[#8E1B1B] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md shadow-[#C62828]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement en cours...' : 'Enregistrer tous les paramètres'}</span>
        </button>
      </div>
    </form>
  );
};
