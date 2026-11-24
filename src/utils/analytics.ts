/**
 * Mesure d'audience (Google Analytics 4), chargée UNIQUEMENT après accord du visiteur.
 *
 * L'identifiant de mesure (G-XXXXXXX) n'est pas un secret : il est lu au
 * démarrage depuis /api/public-config (variable GA_MEASUREMENT_ID côté serveur).
 * Sans identifiant configuré, rien n'est chargé et le bandeau cookies ne s'affiche pas.
 */

export type ConsentChoice = 'accepted' | 'refused';

const CONSENT_KEY = 'cookie_consent';
// Le choix est redemandé au bout de 13 mois, comme le recommandent les autorités de protection des données.
const CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 3600 * 1000;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let measurementId: string | null = null;
let configPromise: Promise<string | null> | null = null;
let loaded = false;

/** Récupère (une seule fois) l'identifiant de mesure configuré sur le serveur. */
export function getMeasurementId(): Promise<string | null> {
  if (!configPromise) {
    configPromise = fetch('/api/public-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        measurementId = cfg?.gaMeasurementId || null;
        return measurementId;
      })
      .catch(() => null);
  }
  return configPromise;
}

export function getStoredConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const { choice, date } = JSON.parse(raw);
    if ((choice !== 'accepted' && choice !== 'refused') || Date.now() - Number(date) > CONSENT_MAX_AGE_MS) return null;
    return choice;
  } catch {
    return null;
  }
}

export function storeConsent(choice: ConsentChoice) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ choice, date: Date.now() }));
  if (choice === 'accepted') {
    loadAnalytics();
  } else {
    disableAnalytics();
  }
}

/** Charge Google Analytics si l'identifiant existe et que le visiteur a accepté. */
export async function loadAnalytics() {
  const id = await getMeasurementId();
  if (!id || loaded || getStoredConsent() !== 'accepted') return;
  loaded = true;
  window[`ga-disable-${id}`] = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** Coupe la mesure et supprime les cookies Google Analytics déjà posés. */
function disableAnalytics() {
  if (measurementId) window[`ga-disable-${measurementId}`] = true;
  const host = window.location.hostname;
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name === '_ga' || name.startsWith('_ga_') || name === '_gid') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${host}`;
    }
  });
}

/** Envoie un événement (ex. commande passée) si la mesure est active. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (loaded && window.gtag) window.gtag('event', name, params || {});
}

/** Rouvre le bandeau cookies (lien « Gérer les cookies » du pied de page). */
export const OPEN_COOKIE_SETTINGS_EVENT = 'open-cookie-settings';
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
