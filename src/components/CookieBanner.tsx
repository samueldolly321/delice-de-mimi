import React, { useEffect, useState } from 'react';
import {
  getMeasurementId,
  getStoredConsent,
  loadAnalytics,
  storeConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
} from '../utils/analytics';

/**
 * Bandeau de consentement aux cookies.
 * Le site n'utilise sans accord que le stockage indispensable (panier, session).
 * Seule la mesure d'audience demande l'accord : « Refuser » est aussi simple qu'« Accepter ».
 * Si aucune mesure d'audience n'est configurée, le bandeau ne s'affiche pas.
 */
export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [hasAnalytics, setHasAnalytics] = useState(false);

  useEffect(() => {
    getMeasurementId().then((id) => {
      if (!id) return;
      setHasAnalytics(true);
      const consent = getStoredConsent();
      if (consent === 'accepted') loadAnalytics();
      if (consent === null) setVisible(true);
    });

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const choose = (choice: 'accepted' | 'refused') => {
    storeConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentement aux cookies"
      className="fixed bottom-0 inset-x-0 z-[60] bg-[#111111] text-white border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
    >
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 py-5 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        <p className="text-[13px] leading-relaxed text-white/80 flex-1">
          <span className="label-caps text-[11px] text-white block mb-1">Cookies</span>
          Nous utilisons uniquement les cookies nécessaires au panier et à votre compte.
          {hasAnalytics && (
            <> Avec votre accord, nous mesurons aussi l'audience du site (Google Analytics) pour l'améliorer.</>
          )}{' '}
          <a href="/confidentialite" className="underline underline-offset-2 hover:text-white">
            En savoir plus
          </a>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => choose('refused')}
            className="btn-outline !py-2.5 text-white border-white/60 hover:bg-white hover:text-ink"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="btn-outline !py-2.5 bg-white text-ink border-white hover:bg-accent hover:text-white hover:border-accent"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
};
