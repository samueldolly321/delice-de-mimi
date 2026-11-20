# Guide d'installation locale avec PostgreSQL & Drizzle ORM

Ce projet est prêt pour être exécuté sur votre ordinateur personnel (PC / Mac / Linux) avec **PostgreSQL** et **Drizzle ORM**.

---

## 🚀 Étape 1 : Lancer la base PostgreSQL locale

Deux options s'offrent à vous :

### Option A : Avec Docker (Le plus simple et rapide)
Dans le terminal du projet, lancez :
```bash
docker compose up -d
```
Cela démarre automatiquement un conteneur PostgreSQL 16 configuré avec la base `saveurs_asie` sur le port `5432`.

### Option B : Avec PostgreSQL installé en local (pgAdmin / Postgres.app / apt / brew)
Créez une base de données nommée `saveurs_asie` :
```sql
CREATE DATABASE saveurs_asie;
```

---

## ⚙️ Étape 2 : Configuration du fichier `.env`

Copiez ou créez un fichier `.env` à la racine :
```bash
cp .env.example .env
```
Et vérifiez votre variable de connexion :
```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/saveurs_asie"
```
*(Remplacez par votre mot de passe et identifiant PostgreSQL s'ils sont différents).*

---

## 📦 Étape 3 : Créer les tables et insérer les données

Exécutez la synchronisation du schéma Drizzle vers PostgreSQL :
```bash
# 1. Pousser le schéma vers votre base PostgreSQL
npm run db:push

# 2. Insérer les plats, catégories, clients, réglages et Factures N°8 de départ
npm run db:seed
```

---

## 🛠️ Commandes utiles Drizzle ORM

- `npm run db:push` : Applique les changements de schéma `src/db/schema.ts` sur PostgreSQL.
- `npm run db:studio` : Ouvre l'interface visuelle Drizzle Studio dans votre navigateur pour explorer et modifier les tables.
- `npm run db:seed` : Réinitialise et insère les données de démarrage.

---

## 🖥️ Étape 4 : Lancer l'application

```bash
# Lancer en mode développement
npm run dev
```
L'application se lance sur `http://localhost:3000`.
Le Back-Office Admin est accessible avec :
- **Identifiant** : `admin` ou `admin@saveursdasie.mg`
- **Mot de passe** : `admin123`
