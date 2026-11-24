import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  ExternalLink,
  Calendar,
  Users,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { FadeIn } from './common/FadeIn';
import { api } from '../services/api';
import { SocialIcon } from './SocialIcons';
import { validateContactPair, HONEYPOT_FIELD } from '../utils/validation';
import { trackEvent } from '../utils/analytics';
import { resolveHomeContent } from '../data/homeContent';
import { ContactMessage, MessageRequestType } from '../types';

export const ContactSection: React.FC = () => {
  const { settings } = useCart();
  const home = resolveHomeContent(settings);
  const { customer: authCustomer } = useCustomerAuth();

  const [requestType, setRequestType] = useState<MessageRequestType>('reservation');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Réservation de table',
    reservationDate: '',
    reservationTime: '19h30',
    guestsCount: 2,
    message: '',
  });

  const [submittedMessage, setSubmittedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  // Anti-spam : champ piège invisible + heure d'ouverture du formulaire
  const [honeypot, setHoneypot] = useState('');
  const formStartedAt = useRef(Date.now());

  // Automatically prefill customer details if logged in
  useEffect(() => {
    if (authCustomer) {
      setFormState((prev) => ({
        ...prev,
        name: prev.name || authCustomer.fullName || '',
        email: prev.email || authCustomer.email || '',
        phone: prev.phone || authCustomer.phone || '',
      }));
    }
  }, [authCustomer]);

  // Set default date to today or tomorrow
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setFormState((prev) => ({
      ...prev,
      reservationDate: prev.reservationDate || `${yyyy}-${mm}-${dd}`,
    }));
  }, []);

  const handleTypeChange = (type: MessageRequestType) => {
    setRequestType(type);
    let defaultSubject = 'Demande de contact';
    if (type === 'reservation') defaultSubject = 'Réservation de table';
    if (type === 'order_special') defaultSubject = 'Demande pour événement privé ou traiteur';
    if (type === 'information') defaultSubject = 'Demande de renseignement';
    if (type === 'other') defaultSubject = 'Autre demande';

    setFormState((prev) => ({
      ...prev,
      subject: defaultSubject,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formState.name.trim()) {
      setErrorMessage('Veuillez indiquer votre nom.');
      return;
    }
    const contactError = validateContactPair(formState.phone, formState.email);
    if (contactError) {
      setErrorMessage(contactError);
      return;
    }
    if (formState.message.trim().length < 5) {
      setErrorMessage('Veuillez préciser votre message (5 caractères minimum).');
      return;
    }

    setLoading(true);

    try {
      const payload: Partial<ContactMessage> = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        subject: formState.subject.trim() || 'Demande de contact',
        requestType,
        reservationDate: (requestType === 'reservation' || requestType === 'order_special') ? formState.reservationDate : undefined,
        reservationTime: (requestType === 'reservation' || requestType === 'order_special') ? formState.reservationTime : undefined,
        guestsCount: requestType === 'reservation' ? Number(formState.guestsCount) : undefined,
        message: formState.message.trim(),
        [HONEYPOT_FIELD]: honeypot,
        formStartedAt: formStartedAt.current,
      } as Partial<ContactMessage>;

      const created = await api.createMessage(payload);
      setSubmittedMessage(created);
      trackEvent('generate_lead', { request_type: requestType });
    } catch (err: any) {
      console.error('Erreur envoi message:', err);
      setErrorMessage(err.message || "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedMessage(null);
    setFormState((prev) => ({
      ...prev,
      subject: requestType === 'reservation' ? 'Réservation de table' : 'Demande de renseignement',
      message: '',
    }));
  };

  const cleanRestaurantPhone = (settings.whatsappPhone || settings.phone || '+261342088899').replace(/[^0-9]/g, '');

  const generateWhatsAppMessage = () => {
    if (!submittedMessage) return '';
    let txt = `*Demande ${submittedMessage.id} - ${settings.name}*\n`;
    txt += `👤 *Nom :* ${submittedMessage.name}\n`;
    if (submittedMessage.phone) txt += `📞 *Téléphone :* ${submittedMessage.phone}\n`;
    txt += `📋 *Objet :* ${submittedMessage.subject}\n`;
    if (submittedMessage.requestType === 'reservation' || submittedMessage.requestType === 'order_special') {
      if (submittedMessage.reservationDate) {
        txt += `🗓️ *Date prévue :* ${submittedMessage.reservationDate}${submittedMessage.reservationTime ? ` à ${submittedMessage.reservationTime}` : ''}\n`;
      }
      if (submittedMessage.guestsCount) {
        txt += `👥 *Couverts :* ${submittedMessage.guestsCount} personnes\n`;
      }
    }
    txt += `💬 *Message :* ${submittedMessage.message}`;
    return encodeURIComponent(txt);
  };

  return (
    <section id="contact" className="py-24 md:py-28 bg-white border-t border-stone-200 relative overflow-hidden scroll-mt-24">
      {/* Illustrations décoratives en fond */}
      <div className="absolute left-0 top-0 w-96 h-96 bg-radial from-[#111111]/8 to-transparent blur-3xl pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute -right-6 top-8 w-52 h-52 text-[#111111] opacity-[0.08] pointer-events-none rotate-[8deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Épingle de localisation */}
        <path d="M50 12 C34 12, 22 24, 22 40 C22 62, 50 88, 50 88 C50 88, 78 62, 78 40 C78 24, 66 12, 50 12 Z" />
        <circle cx="50" cy="40" r="11" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute left-4 bottom-0 w-44 h-44 text-[#000000] opacity-[0.07] pointer-events-none rotate-[-6deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Table dressée (assiette, baguettes) */}
        <circle cx="50" cy="52" r="26" />
        <circle cx="50" cy="52" r="16" />
        <path d="M18 30 L10 20 M22 26 L16 15 M26 24 L22 12" />
        <path d="M78 28 L88 18" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute right-1/4 bottom-4 w-32 h-32 text-[#C62828] opacity-[0.10] pointer-events-none rotate-[5deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Calendrier de réservation */}
        <rect x="16" y="22" width="68" height="60" rx="8" />
        <path d="M16 40 L84 40" />
        <path d="M32 14 L32 26 M68 14 L68 26" />
        <circle cx="34" cy="56" r="3" fill="currentColor" stroke="none" />
        <circle cx="50" cy="56" r="3" fill="currentColor" stroke="none" />
        <circle cx="66" cy="56" r="3" fill="currentColor" stroke="none" />
        <circle cx="34" cy="68" r="3" fill="currentColor" stroke="none" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute left-1/3 top-4 w-28 h-28 text-[#111111] opacity-[0.09] pointer-events-none rotate-[-5deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Horloge (horaires d'ouverture) */}
        <circle cx="50" cy="50" r="34" />
        <path d="M50 30 L50 50 L66 58" />
        <circle cx="50" cy="50" r="2.2" fill="currentColor" stroke="none" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden md:block absolute right-6 bottom-40 w-28 h-28 text-[#000000] opacity-[0.09] pointer-events-none rotate-[7deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Cloche de service */}
        <path d="M28 66 C28 40, 38 27, 50 27 C62 27, 72 40, 72 66 Z" />
        <path d="M20 66 L80 66" />
        <circle cx="50" cy="74" r="4.5" />
        <path d="M50 18 L50 27" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden xl:block absolute left-6 bottom-8 w-36 h-36 text-[#C62828] opacity-[0.10] pointer-events-none rotate-[-4deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Scooter de livraison */}
        <circle cx="26" cy="76" r="11" />
        <circle cx="76" cy="76" r="11" />
        <path d="M26 76 L44 76 L50 54 L68 54" />
        <path d="M68 54 L76 76" />
        <path d="M44 54 L44 38 L60 38" />
        <path d="M56 34 L64 34" />
      </svg>

      <svg
        viewBox="0 0 100 100"
        className="hidden lg:block absolute right-1/3 top-1/2 -translate-y-1/2 w-32 h-32 text-[#111111] opacity-[0.08] pointer-events-none rotate-[3deg]"
        fill="none" stroke="currentColor" strokeWidth="1.5"
      >
        {/* Table en terrasse avec parasol */}
        <path d="M18 32 C18 20, 82 20, 82 32 C68 26, 32 26, 18 32 Z" />
        <path d="M50 8 L50 15" />
        <path d="M50 32 L50 88" />
        <path d="M32 88 L68 88" />
        <path d="M38 70 L62 70" />
      </svg>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <FadeIn>
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <h2 className="section-title text-xl sm:text-2xl">{home.contactTitle}</h2>

          <p className="mt-8 max-w-xl mx-auto text-[15px] text-stone-500 leading-relaxed">
            {home.contactIntro}
          </p>
        </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Contact details & Map */}
          <FadeIn className="lg:col-span-5 space-y-6">
          <div className="space-y-6">
            {/* Practical info cards */}
            <div className="bg-white p-6 rounded-2xl border border-[#E6DECF] shadow-xs space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#111111]/10 text-[#111111] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Adresse
                  </h4>
                  <p className="text-sm font-semibold text-[#1F1F1F] mt-0.5">
                    {settings.address}
                  </p>
                  <span className="text-xs text-stone-500">
                    Parking surveillé & terrasse couverte
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-10 h-10 rounded-xl bg-[#C62828]/20 text-[#000000] flex items-center justify-center shrink-0 mt-0.5">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Téléphone & Ligne Directe
                  </h4>
                  <p className="text-sm font-semibold text-[#1F1F1F] mt-0.5">
                    {settings.phone}
                  </p>
                  <span className="text-xs text-stone-500">
                    Réception des appels 7j/7 pendant les heures d'ouverture
                  </span>
                </div>
              </div>

              {(settings.facebookUrl || settings.instagramUrl || settings.tiktokUrl || settings.whatsappUrl || settings.whatsappPhone) && (
                <div className="flex items-center gap-2.5 pl-14 -mt-1">
                  {settings.facebookUrl && (
                    <a
                      href={settings.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Facebook"
                      aria-label="Facebook"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E6DECF] hover:border-[#1877F2] hover:bg-[#1877F2]/10 text-[#1877F2] transition-all shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <SocialIcon platform="facebook" size={16} className="text-[#1877F2]" />
                    </a>
                  )}
                  {settings.instagramUrl && (
                    <a
                      href={settings.instagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Instagram"
                      aria-label="Instagram"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E6DECF] hover:border-[#DD2A7B] hover:bg-[#DD2A7B]/10 text-[#DD2A7B] transition-all shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <SocialIcon platform="instagram" size={16} className="text-[#DD2A7B]" />
                    </a>
                  )}
                  {settings.tiktokUrl && (
                    <a
                      href={settings.tiktokUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="TikTok"
                      aria-label="TikTok"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-[#E6DECF] hover:border-black hover:bg-stone-100 text-[#1F1F1F] transition-all shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <SocialIcon platform="tiktok" size={16} />
                    </a>
                  )}
                  {(settings.whatsappUrl || settings.whatsappPhone) && (
                    <a
                      href={settings.whatsappUrl || `https://wa.me/${cleanRestaurantPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      aria-label="WhatsApp"
                      className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-[#25D366]/10 border border-[#25D366]/40 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-all shadow-2xs hover:scale-105 active:scale-95 group"
                    >
                      <SocialIcon platform="whatsapp" size={16} className="text-[#25D366] group-hover:text-white" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#1F1F1F] flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Email
                  </h4>
                  <p className="text-sm font-semibold text-[#1F1F1F] mt-0.5">
                    {settings.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 pt-4 border-t border-stone-100">
                <div className="w-10 h-10 rounded-xl bg-[#111111]/10 text-[#111111] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                    Horaires d'ouverture
                  </h4>
                  <p className="text-sm font-semibold text-[#1F1F1F] mt-0.5">
                    {settings.openingHours}
                  </p>
                  <span className="text-xs text-emerald-600 font-medium">
                    Service en salle & livraison continue
                  </span>
                </div>
              </div>
            </div>

            {/* Google Maps réel (embed sans clé API) */}
            <div className="bg-white rounded-2xl border border-[#E6DECF] overflow-hidden shadow-xs relative aspect-[16/9]">
              <iframe
                title={`Localisation ${settings.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={settings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F1F1F]/90 backdrop-blur-xs text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors shadow-lg"
              >
                <span>Ouvrir dans Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          </FadeIn>

          {/* Right Column: Interactive Functional Form */}
          <FadeIn delay={0.15} className="lg:col-span-7">
          <div>
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E6DECF] shadow-md relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1F1F]">
                    Formulaire de Contact & Réservation
                  </h3>
                  <p className="text-xs text-stone-500">
                    Transmis directement à notre brigade. Réponse rapide garantie.
                  </p>
                </div>
              </div>

              {submittedMessage ? (
                /* Success & Confirmation View */
                <div className="p-6 sm:p-8 text-center bg-emerald-50/70 rounded-2xl border border-emerald-200 animate-in fade-in duration-300 space-y-4">
                  <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-mono text-xs font-bold border border-emerald-300">
                      Réf. {submittedMessage.id}
                    </span>
                    <h4 className="font-serif text-xl font-bold text-emerald-950 mt-2">
                      {submittedMessage.requestType === 'reservation'
                        ? 'Demande de réservation enregistrée !'
                        : submittedMessage.requestType === 'order_special'
                        ? "Demande d'événement enregistrée !"
                        : 'Message envoyé avec succès !'}
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto mt-1">
                      Merci {submittedMessage.name}. Votre demande a bien été transmise à l'équipe de {settings.name}.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="bg-white/80 p-4 rounded-xl border border-emerald-200/80 text-left text-xs space-y-2 max-w-md mx-auto shadow-2xs">
                    <div className="font-bold text-stone-900 border-b border-stone-100 pb-1.5 flex justify-between items-center">
                      <span>{submittedMessage.subject}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        {new Date().toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {(submittedMessage.requestType === 'reservation' || submittedMessage.requestType === 'order_special') && submittedMessage.reservationDate && (
                      <div className={`grid ${submittedMessage.guestsCount ? 'grid-cols-3' : 'grid-cols-2'} gap-2 py-1 text-stone-700 bg-emerald-50/50 p-2 rounded-lg`}>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Date</span>
                          <span className="font-semibold">{submittedMessage.reservationDate}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400 block">Heure</span>
                          <span className="font-semibold">{submittedMessage.reservationTime || '-'}</span>
                        </div>
                        {submittedMessage.guestsCount ? (
                          <div>
                            <span className="text-[10px] text-stone-400 block">Couverts</span>
                            <span className="font-semibold">{submittedMessage.guestsCount} pers.</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <p className="text-stone-600 italic">
                      « {submittedMessage.message} »
                    </p>
                  </div>

                  {/* Dual Action Options */}
                  <div className="space-y-2 pt-2 max-w-md mx-auto">
                    <a
                      href={`https://wa.me/${cleanRestaurantPhone}?text=${generateWhatsAppMessage()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd59] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                    >
                      <SocialIcon platform="whatsapp" size={16} />
                      <span>Envoyer aussi sur WhatsApp pour confirmation instantanée</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${settings.phone}`}
                        className="flex-1 py-2.5 px-3 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#111111]" />
                        <span>Appeler</span>
                      </a>

                      <button
                        onClick={handleReset}
                        className="flex-1 py-2.5 px-3 bg-stone-900 hover:bg-black text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Nouvelle demande</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Fields */
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Champ piège anti-robots : invisible et ignoré par les humains */}
                  <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                    <label>
                      Ne pas remplir
                      <input
                        type="text"
                        name={HONEYPOT_FIELD}
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </label>
                  </div>
                  {errorMessage && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Type of Request Selector */}
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1.5 uppercase tracking-wider">
                      Type de demande
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { type: 'reservation', label: '🍽️ Réservation' },
                        { type: 'order_special', label: '🎉 Événement' },
                        { type: 'information', label: '❓ Information' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleTypeChange(item.type as MessageRequestType)}
                          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center cursor-pointer ${
                            requestType === item.type
                              ? 'bg-[#1F1F1F] text-[#C62828] border-[#1F1F1F] shadow-xs scale-102'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Specific Fields */}
                  {requestType === 'order_special' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-[#111111]" />
                        <span>Date & Heure de l'événement</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Date de l'événement *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formState.reservationDate}
                            onChange={(e) => setFormState({ ...formState, reservationDate: e.target.value })}
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#111111]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Heure souhaitée *
                          </label>
                          <select
                            value={formState.reservationTime}
                            onChange={(e) => setFormState({ ...formState, reservationTime: e.target.value })}
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#111111] font-medium"
                          >
                            <optgroup label="Midi & Déjeuner">
                              <option value="11h30">11h30</option>
                              <option value="12h00">12h00</option>
                              <option value="12h30">12h30</option>
                              <option value="13h00">13h00</option>
                              <option value="13h30">13h30</option>
                            </optgroup>
                            <optgroup label="Après-midi">
                              <option value="14h00">14h00</option>
                              <option value="15h00">15h00</option>
                              <option value="16h00">16h00</option>
                              <option value="17h00">17h00</option>
                            </optgroup>
                            <optgroup label="Soir & Dîner">
                              <option value="18h00">18h00</option>
                              <option value="18h30">18h30</option>
                              <option value="19h00">19h00</option>
                              <option value="19h30">19h30</option>
                              <option value="20h00">20h00</option>
                              <option value="20h30">20h30</option>
                              <option value="21h00">21h00</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reservation Specific Fields */}
                  {requestType === 'reservation' && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-[#111111]" />
                        <span>Créneau & Nombre de personnes</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Date souhaitée *
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formState.reservationDate}
                            onChange={(e) => setFormState({ ...formState, reservationDate: e.target.value })}
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#111111]"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Heure d'arrivée *
                          </label>
                          <select
                            value={formState.reservationTime}
                            onChange={(e) => setFormState({ ...formState, reservationTime: e.target.value })}
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#111111] font-medium"
                          >
                            <optgroup label="Midi (Déjeuner)">
                              <option value="11h45">11h45</option>
                              <option value="12h00">12h00</option>
                              <option value="12h30">12h30</option>
                              <option value="13h00">13h00</option>
                              <option value="13h30">13h30</option>
                            </optgroup>
                            <optgroup label="Soir (Dîner)">
                              <option value="18h45">18h45</option>
                              <option value="19h00">19h00</option>
                              <option value="19h30">19h30</option>
                              <option value="20h00">20h00</option>
                              <option value="20h30">20h30</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                            Nombre de personnes *
                          </label>
                          <select
                            value={formState.guestsCount}
                            onChange={(e) => setFormState({ ...formState, guestsCount: Number(e.target.value) })}
                            className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:border-[#111111] font-medium"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                              <option key={n} value={n}>
                                {n} {n > 1 ? 'personnes' : 'personne'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Coordinates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Votre nom et prénom"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+261 34 00 000 00"
                        value={formState.phone}
                        onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="votre@email.com"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 block mb-1">
                        Sujet
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex. Réservation d'une grande table, etc."
                        value={formState.subject}
                        onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Message / Details */}
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      {requestType === 'reservation'
                        ? 'Détails ou préférences pour votre table (optionnel / allergies / placement) *'
                        : requestType === 'order_special'
                        ? "Détails de l'événement (type d'événement, nombre d'invités estimé, formule souhaitée...) *"
                        : 'Votre Message ou demande détaillée *'}
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={
                        requestType === 'reservation'
                          ? "Ex. Nous fêtons un anniversaire, nous aimerions une table au calme près de la fenêtre..."
                          : requestType === 'order_special'
                          ? "Ex. Anniversaire, repas d'entreprise pour environ 25 personnes avec buffet chaud et nems..."
                          : "Comment pouvons-nous vous régaler ou vous renseigner ?"
                      }
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] hover:bg-[#000000] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-[#111111]/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {loading
                        ? 'Envoi en cours...'
                        : requestType === 'reservation'
                        ? 'Confirmer ma demande de réservation'
                        : requestType === 'order_special'
                        ? "Envoyer ma demande d'événement"
                        : 'Envoyer ma demande'}
                    </span>
                  </button>

                  <p className="text-[11px] text-stone-400 text-center">
                    Vos informations servent uniquement à traiter votre demande. Voir notre{' '}
                    <a href="/confidentialite" className="underline hover:text-stone-600">politique de confidentialité</a>.
                  </p>
                </form>
              )}
            </div>
          </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
