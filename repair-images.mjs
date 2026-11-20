/**
 * Répare les images corrompues dans .data_store.json
 *
 * Détecte les data URLs base64 tronquées (coupées par l'ancien
 * sanitizeText à 500 caractères) et les remplace par une image
 * de remplacement, pour que tu puisses réimporter proprement.
 *
 * Usage :  node repair-images.mjs
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '.data_store.json');
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80';

/**
 * Une data URL base64 valide a une longueur de partie encodée
 * multiple de 4 et se termine correctement. Une image réelle fait
 * toujours bien plus de 2000 caractères : en dessous, c'est tronqué.
 */
const isBroken = (val) => {
  if (typeof val !== 'string') return false;
  if (!val.startsWith('data:image/')) return false;

  const commaIndex = val.indexOf(',');
  if (commaIndex === -1) return true;

  const payload = val.slice(commaIndex + 1);
  if (payload.length < 2000) return true;      // beaucoup trop court
  if (payload.length % 4 !== 0) return true;   // base64 incomplet
  return false;
};

if (!fs.existsSync(DATA_FILE)) {
  console.error('❌ .data_store.json introuvable. Lance ce script à la racine du projet.');
  process.exit(1);
}

// Sauvegarde avant toute modification
const backup = `${DATA_FILE}.backup-${Date.now()}`;
fs.copyFileSync(DATA_FILE, backup);
console.log(`💾 Sauvegarde créée : ${path.basename(backup)}\n`);

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let repaired = 0;

// --- Images des plats ---
for (const product of data.products ?? []) {
  if (isBroken(product.image)) {
    console.log(`🔧 Plat « ${product.name} » : image tronquée (${product.image.length} car.) → réinitialisée`);
    product.image = PLACEHOLDER;
    repaired++;
  }
}

// --- Logo du restaurant ---
if (data.settings && isBroken(data.settings.logoUrl)) {
  console.log(`🔧 Logo du restaurant : image tronquée → réinitialisée`);
  data.settings.logoUrl = '';
  repaired++;
}

// --- Photo du chef ---
if (data.settings?.chef && isBroken(data.settings.chef.imageUrl)) {
  console.log(`🔧 Photo du chef : image tronquée → réinitialisée`);
  data.settings.chef.imageUrl = PLACEHOLDER;
  repaired++;
}

// --- Images des slides du carrousel ---
for (const [i, slide] of (data.settings?.slides ?? []).entries()) {
  if (isBroken(slide.imageUrl)) {
    console.log(`🔧 Slide n°${i + 1} : image tronquée → réinitialisée`);
    slide.imageUrl = PLACEHOLDER;
    repaired++;
  }
}

if (repaired === 0) {
  console.log('✅ Aucune image corrompue détectée.');
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ ${repaired} image(s) réparée(s). Tu peux maintenant les réimporter depuis l'administration.`);
}
