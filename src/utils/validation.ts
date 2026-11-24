/**
 * Règles de validation partagées entre le site (formulaires) et le serveur (API).
 * Le serveur applique toujours ces règles : la vérification côté navigateur
 * n'est qu'un confort pour l'utilisateur, jamais une protection.
 */

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

export function isValidEmail(email: string): boolean {
  const v = email.trim();
  return v.length <= 100 && EMAIL_RE.test(v);
}

/**
 * Téléphone : chiffres, espaces, tirets, points, parenthèses et « + » initial.
 * Entre 8 et 15 chiffres (ex. 034 12 345 67, +261 34 12 345 67).
 */
export function isValidPhone(phone: string): boolean {
  const v = phone.trim();
  if (!/^\+?[0-9\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 8 && digits <= 15;
}

/**
 * Vérifie le couple téléphone / email d'un formulaire :
 * au moins l'un des deux, et chacun bien formé s'il est rempli.
 * Renvoie un message d'erreur, ou null si tout est correct.
 */
export function validateContactPair(phone: string | undefined, email: string | undefined): string | null {
  const p = (phone || '').trim();
  const e = (email || '').trim();
  if (!p && !e) return 'Veuillez renseigner au moins un numéro de téléphone ou une adresse email.';
  if (p && !isValidPhone(p)) return 'Le numéro de téléphone semble invalide (8 à 15 chiffres, ex. 034 12 345 67).';
  if (e && !isValidEmail(e)) return "L'adresse email semble invalide (ex. nom@exemple.com).";
  return null;
}

/** Nom du champ piège anti-robots : invisible pour les humains, rempli par les robots. */
export const HONEYPOT_FIELD = 'website';
