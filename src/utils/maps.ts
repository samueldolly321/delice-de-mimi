import { RestaurantSettings } from '../types';

const MAP_HOSTS = ['www.google.com', 'google.com', 'maps.google.com', 'www.google.mg'];

/**
 * Adresse de carte intégrable à partir du code collé dans l'admin.
 * Accepte le code <iframe> de Google Maps (« Partager → Intégrer une carte ») ou son adresse src.
 * Renvoie une chaîne vide si le code n'est pas une carte Google Maps en https.
 * (Utilisé aussi par le serveur pour nettoyer ce champ.)
 */
export function mapEmbedUrl(raw: unknown): string {
  let value = typeof raw === 'string' ? raw.trim() : '';
  if (!value) return '';
  value = value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const m = value.match(/src\s*=\s*["']([^"']+)["']/i);
  if (m) value = m[1];
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return '';
    if (!MAP_HOSTS.includes(u.hostname.toLowerCase())) return '';
    if (!u.pathname.startsWith('/maps')) return '';
    return u.toString().slice(0, 2000);
  } catch {
    return '';
  }
}

/** Adresse complète pour Google Maps (la ville est ajoutée si besoin). */
export function fullAddress(settings: Partial<RestaurantSettings>): string {
  const address = (settings.address || '').trim();
  if (!address) return '';
  return /antananarivo/i.test(address) ? address : `${address}, Antananarivo, Madagascar`;
}

/** Lien « Ouvrir dans Google Maps » : celui de l'admin, sinon une recherche de l'adresse. */
export function mapsLink(settings: Partial<RestaurantSettings>): string {
  if (settings.googleMapsUrl) return settings.googleMapsUrl;
  const address = fullAddress(settings);
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
}

/** Carte affichée : code collé dans l'admin, sinon carte centrée sur l'adresse ('' = pas de carte). */
export function mapSrc(settings: Partial<RestaurantSettings>): string {
  if (settings.home?.mapShow === false) return '';
  const embed = mapEmbedUrl(settings.home?.mapEmbed);
  if (embed) return embed;
  const address = fullAddress(settings);
  return address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed` : '';
}
