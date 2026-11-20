# 🥢 Guide d'Installation Locale – Saveurs d'Asie
> Guide complet et pas-à-pas pour installer, configurer et exécuter le projet en local (Frontend React, Backend Express & Base de données PostgreSQL).

---

## 📋 Table des Matières
1. [Architecture du Projet](#-architecture-du-projet)
2. [Prérequis Système](#-prérequis-système)
3. [Étape 1 : Récupération du Projet](#-étape-1--récupération-du-projet)
4. [Étape 2 : Installation des Dépendances](#-étape-2--installation-des-dépendances)
5. [Étape 3 : Configuration de PostgreSQL](#-étape-3--configuration-de-postgresql)
   - [Option A : PostgreSQL installé sur votre machine](#option-a--postgresql-installé-en-local-natif)
   - [Option B : PostgreSQL via Docker (Recommandé)](#option-b--postgresql-via-docker-le-plus-rapide)
6. [Étape 4 : Variables d'Environnement (.env)](#-étape-4--variables-denvironnement-env)
7. [Étape 5 : Schéma et Initialisation de la Base de Données](#-étape-5--schéma-et-initialisation-de-la-base-de-données)
   - [Méthode automatique (Drizzle ORM)](#méthode-automatique-recommandée--drizzle-kit)
   - [Méthode manuelle (Script SQL brut pour pgAdmin / DBeaver)](#méthode-alternative--script-sql-brut)
8. [Étape 6 : Lancement de l'Application](#-étape-6--lancement-de-lapplication)
   - [Mode Développement (Recommandé)](#mode-développement-recommandé)
   - [Mode Production](#mode-production)
9. [Étape 7 : Accès à l'Administration](#-étape-7--accès-à-ladministration)
10. [Résolution des Problèmes Fréquents (Troubleshooting)](#-résolution-des-problèmes-fréquents-troubleshooting)

---

## 🏗 Architecture du Projet

Le projet fonctionne avec une architecture full-stack unifiée :
- **Frontend (Client)** : React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, animations fluides avec Motion.
- **Backend (API Serveur)** : Node.js avec Express et TypeScript (`tsx`). Il expose toutes les routes REST sous `/api/*` (produits, catégories, commandes, factures N°8, messages, paramètres).
- **Base de Données** : PostgreSQL, gérée via **Drizzle ORM** (schémas stricts typés en TypeScript, migrations automatiques et outil visuel Drizzle Studio).
- **Mode Unifié** : En développement, Express intègre directement le middleware Vite. **Un seul serveur tourne sur le port `3000`**, ce qui élimine tout problème de CORS ou de double configuration de ports.

---

## 💻 Prérequis Système

Avant de commencer, vérifiez que votre ordinateur dispose des outils suivants :

1. **Node.js** : Version **18.x** ou **20.x** (ou supérieur).
   - Vérifier dans votre terminal :
     ```bash
     node -v
     npm -v
     ```
   - Si Node.js n'est pas installé, téléchargez-le sur [nodejs.org](https://nodejs.org/).
2. **PostgreSQL** : Version **14**, **15** ou **16** (soit installé en local natif, soit via Docker Desktop).
3. **Git** (optionnel) : Pour cloner le dépôt.

---

## 📦 Étape 1 : Récupération du Projet

Si vous avez téléchargé le projet au format ZIP depuis Google AI Studio :
1. Décompressez l'archive ZIP dans le dossier de votre choix (ex: `~/projets/saveurs-dasie`).
2. Ouvrez un terminal dans ce dossier :
   ```bash
   cd chemin/vers/saveurs-dasie
   ```

---

## 📥 Étape 2 : Installation des Dépendances

Installez l'ensemble des modules Node.js nécessaires (Express, React, Drizzle ORM, pg, Tailwind, etc.) :

```bash
npm install
```

Cette commande télécharge et installe les bibliothèques déclarées dans `package.json`.

---

## 🐘 Étape 3 : Configuration de PostgreSQL

Vous avez deux façons simples de faire tourner PostgreSQL. Choisissez celle qui vous convient le mieux :

### Option A : PostgreSQL installé en local (natif)
*(Si vous avez installé PostgreSQL avec l'installateur officiel ou via Homebrew / apt)*

1. Assurez-vous que le service PostgreSQL est bien démarré.
2. Ouvrez l'outil de ligne de commande `psql` (ou **pgAdmin**) avec l'utilisateur superadmin :
   ```bash
   psql -U postgres
   ```
3. Créez la base de données dédiée au restaurant :
   ```sql
   CREATE DATABASE saveurs_asie;
   ```
4. Quittez `psql` :
   ```sql
   \q
   ```

### Option B : PostgreSQL via Docker (Le plus rapide)
*(Si vous avez Docker Desktop installé sur votre machine, une seule commande suffit !)*

Exécutez la commande suivante dans votre terminal :
```bash
docker run --name saveurs-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=saveurs_asie \
  -p 5432:5432 \
  -d postgres:16
```

Votre serveur PostgreSQL tourne immédiatement sur le port standard `5432` avec les identifiants :
- **Hôte** : `localhost`
- **Port** : `5432`
- **Utilisateur** : `postgres`
- **Mot de passe** : `postgres`
- **Base** : `saveurs_asie`

---

## ⚙️ Étape 4 : Variables d'Environnement (.env)

Créez un fichier nommé `.env` à la racine du projet (au même niveau que `package.json`) en copiant le modèle :

### Sur Linux / macOS :
```bash
cp .env.example .env
```

### Sur Windows (PowerShell) :
```powershell
Copy-Item .env.example .env
```

Ouvrez ensuite le fichier `.env` et adaptez l'URL de connexion selon votre configuration :

```env
# URL de connexion PostgreSQL
# Format : postgresql://<UTILISATEUR>:<MOT_DE_PASSE>@<HOTE>:<PORT>/<NOM_BASE>
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saveurs_asie"

# Port d'écoute du serveur unifié (Frontend + Backend)
PORT=3000

# URL de l'application en local
APP_URL="http://localhost:3000"

# (Optionnel) Clé API Gemini si vous activez les fonctionnalités d'IA avancées
GEMINI_API_KEY=""
```

> 💡 **Remarque** : Si votre mot de passe PostgreSQL local contient des caractères spéciaux (comme `@`, `#`, `/`), veillez à les encoder en URL (ex: `@` devient `%40`).

---

## 🗄 Étape 5 : Schéma et Initialisation de la Base de Données

Le projet est équipé de **Drizzle ORM** pour automatiser la création des tables et le remplissage initial des données.

### Méthode Automatique (Recommandée : Drizzle Kit)

1. **Créer et synchroniser les tables PostgreSQL** :
   ```bash
   npm run db:push
   ```
   *Drizzle-kit se connecte à votre base `saveurs_asie` et crée automatiquement les 5 tables : `categories`, `products`, `customers`, `orders` et `restaurant_settings`.*

2. **Insérer les données initiales du restaurant (Seed)** :
   ```bash
   npm run db:seed
   ```
   *Ce script insère l'ensemble de la carte (soupes, mine sao, nems, raviolis, boissons, desserts), les comptes clients de test, les paramètres du restaurant ainsi que les mentions légales pour la Facturation N°8.*

3. **(Optionnel) Ouvrir l'explorateur visuel de base de données** :
   ```bash
   npm run db:studio
   ```
   *Drizzle Studio s'ouvre dans votre navigateur et vous permet de consulter, modifier et ajouter des lignes directement via une interface graphique moderne.*

---

### Méthode Alternative : Script SQL Brut

Si vous préférez exécuter un script SQL classique dans **pgAdmin**, **DBeaver** ou en console `psql`, voici la structure complète à copier-coller :

```sql
-- 1. Catégories du Menu
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Plats & Produits culinaires
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL,
  image TEXT NOT NULL,
  badge TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  preparation_time TEXT DEFAULT '15 min',
  spice_level INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Clients & Utilisateurs
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  district TEXT,
  order_count INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  last_order_date TIMESTAMP NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. Commandes passées
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  customer_district TEXT DEFAULT 'Antananarivo',
  customer_instructions TEXT,
  items_json JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  delivery_type TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Nouvelle',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  estimated_delivery TEXT
);

-- 5. Paramètres du Restaurant & Facturation N°8
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_text TEXT NOT NULL DEFAULT '味',
  logo_url TEXT,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_phone TEXT,
  email TEXT NOT NULL,
  opening_hours TEXT NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 3000,
  free_delivery_threshold INTEGER NOT NULL DEFAULT 50000,
  facebook_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  tiktok_url TEXT DEFAULT '',
  whatsapp_url TEXT DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'Ar',
  is_ordering_enabled BOOLEAN NOT NULL DEFAULT true,
  nif_number TEXT DEFAULT '3000845219',
  stat_number TEXT DEFAULT '56101 11 2021 0 10582',
  rcs_number TEXT DEFAULT 'RCS Antananarivo 2021 B 00458',
  invoice_notice TEXT DEFAULT 'Merci de votre fidélité ! Bon appétit et à très bientôt !',
  slides_json JSONB,
  chef_json JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 🚀 Étape 6 : Lancement de l'Application

### Mode Développement (Recommandé)

Lancez la commande suivante à la racine du projet :

```bash
npm run dev
```

1. Le serveur Express démarre sur le port `3000`.
2. Vite compile et sert l'application React en temps réel.
3. Ouvrez votre navigateur internet à l'adresse :
   👉 **http://localhost:3000**

Tout fonctionne ensemble :
- L'interface client (Menu, Composeur de Soupe, Panier, Commande en ligne)
- Les API REST sur `http://localhost:3000/api/...`

---

### Mode Production

Si vous souhaitez tester l'application dans les conditions de production réelles :

1. **Compiler le Frontend et le Serveur** :
   ```bash
   npm run build
   ```
   *Cette commande génère le dossier statique `dist/` pour le client React et compile le serveur en `dist/server.cjs` via esbuild.*

2. **Démarrer le serveur de production** :
   ```bash
   npm run start
   ```

3. Ouvrez **http://localhost:3000**.

---

## 🔐 Étape 7 : Accès à l'Administration

Le restaurant possède un tableau de bord complet pour gérer la carte, suivre les commandes, imprimer les factures N°8 et modifier les tarifs :

1. Sur le site (`http://localhost:3000`), cliquez sur le bouton **« Admin »** (icône de cadenas) situé dans la barre de navigation supérieure ou dans le pied de page.
2. Renseignez les identifiants de sécurité par défaut :
   - **Identifiant / Nom d'utilisateur** : `admin` *(ou `admin@saveursdasie.mg`)*
   - **Mot de passe** : `admin123`
3. Une fois connecté, vous pouvez :
   - Ajouter, modifier ou réorganiser des catégories et plats du menu.
   - Gérer les commandes en direct (confirmer, passer en préparation, livrer).
   - Générer et imprimer les factures officielles N°8 (Madagascar).
   - Modifier les coordonnées, réseaux sociaux et informations du Chef.

---

## 🛠 Résolution des Problèmes Fréquents (Troubleshooting)

### 1. `ECONNREFUSED 127.0.0.1:5432`
- **Cause** : Votre serveur PostgreSQL n'est pas démarré ou n'écoute pas sur le port 5432.
- **Solution** :
  - Si vous utilisez Docker, vérifiez avec `docker ps` que le conteneur `saveurs-postgres` est en cours d'exécution.
  - Si vous êtes sous Windows, vérifiez dans l'application *Services* que le service *postgresql-x64* est bien démarré.
  - Sous macOS : `brew services start postgresql@16`.
  - Sous Linux : `sudo systemctl start postgresql`.

### 2. `password authentication failed for user "postgres"`
- **Cause** : Le mot de passe indiqué dans `DATABASE_URL` ne correspond pas à celui de votre utilisateur PostgreSQL.
- **Solution** : Modifiez la variable `DATABASE_URL` dans le fichier `.env` avec le bon mot de passe configuré lors de l'installation de PostgreSQL.

### 3. Le port 3000 est déjà occupé (`EADDRINUSE: address already in use :::3000`)
- **Cause** : Une autre application utilise déjà le port 3000.
- **Solution** :
  - Soit fermer l'autre processus occupant le port.
  - Soit modifier la variable `PORT` dans votre fichier `.env` (ex: `PORT=3001`), puis relancer `npm run dev` et ouvrir `http://localhost:3001`.

### 4. Mode de secours sans base de données
- Le backend a été conçu avec un système de tolérance aux pannes : si PostgreSQL n'est temporairement pas disponible, le serveur continue de fonctionner en conservant les modifications dans un fichier local persistant (`.data_store.json`), vous garantissant ainsi une application toujours fonctionnelle même pendant la maintenance de votre base de données.

---

## 🔔 Étape 8 : Configuration des Notifications de Commande (Email & Téléphone)

Dès qu'un client passe une commande sur votre site, le système peut vous alerter instantanément de 3 manières complémentaires :

### 1. Configuration via l'Interface d'Administration (Le plus simple)
1. Rendez-vous dans **Administration > Paramètres du Restaurant > Notifications Commandes**.
2. Renseignez votre adresse email (ex: `votre.email@gmail.com`) et votre numéro de téléphone (ex: `+261 34 20 888 99`).
3. Activez ou désactivez les canaux souhaités :
   - **Notification par Email** (reçoit le bon de commande détaillé avec plats, adresse et contact).
   - **Notification Téléphone / WhatsApp** (alerte mobile instantanée + lien direct WhatsApp client-gérant).
   - **Carillon Sonore** (fait retentir une sonnerie de cuisine dans le portail admin dès qu'une commande arrive).
4. Cliquez sur **"Tester l'envoi Email"** ou **"Tester WhatsApp"** pour valider votre configuration en direct !

### 2. Configuration SMTP pour l'envoi réel d'emails (Production)
Dans votre fichier `.env`, renseignez les identifiants de votre fournisseur de messagerie :

#### Exemple avec Gmail (gratuit) :
1. Activez la validation en deux étapes sur votre compte Google.
2. Créez un **Mot de passe d'application** dans *Sécurité > Validation en deux étapes > Mots de passe des applications*.
3. Renseignez dans votre `.env` :
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre.email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM="Saveurs d'Asie <votre.email@gmail.com>"
```

#### Exemple avec Brevo (Sendinblue), Outlook ou OVH :
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre_login_brevo
SMTP_PASS=votre_cle_smtp_brevo
SMTP_FROM="Saveurs d'Asie <contact@saveursdasie.mg>"
```

> 💡 **Remarque** : En l'absence de variables SMTP définies, le système bascule automatiquement en **Mode Simulation** : le contenu HTML complet de l'email est généré et journalisé dans la console et dans l'historique du back-office sans bloquer l'application.

### 3. Notification Téléphone / WhatsApp
- **WhatsApp Direct** fonctionne sans aucun coût ni abonnement API : à chaque validation de commande, un lien sécurisé WhatsApp pré-rempli avec tous les détails (numéro de commande, client, plats, suppléments, total) est généré. Le client peut transmettre sa commande en 1 clic au gérant.
- **SMS Automatisé (Optionnel avec Twilio)** :
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

Bon développement et bonne dégustation avec **Saveurs d'Asie** ! 🍜
