# 🥢 Saveurs d'Asie – Application Restaurant & Commande en Ligne

Application web full-stack pour le restaurant asiatique **Saveurs d'Asie** :
- Carte interactive & Atelier sur-mesure pour composer sa soupe
- Panier d'achat en temps réel et passage de commande (livraison & à emporter)
- Portail d'administration complet (gestion du menu, commandes, clients, diaporama, factures N°8 Madagascar)
- Persistance locale et support PostgreSQL avec Drizzle ORM

---

## 🚀 Démarrage Rapide en Local

Pour installer et configurer l'application sur votre machine locale (avec Frontend React, Backend Express et base de données PostgreSQL), consultez le guide complet pas-à-pas :

👉 **[Voir le Guide d'Installation Locale Détaillé (INSTALLATION_LOCALE.md)](./INSTALLATION_LOCALE.md)**

### Résumé des commandes :

```bash
# 1. Cloner ou dézipper le projet, puis installer les dépendances
npm install

# 2. Créer le fichier .env à partir du modèle
cp .env.example .env

# 3. Configurer PostgreSQL et déployer les tables
npm run db:push
npm run db:seed

# 4. Lancer le serveur unifié (Frontend + Backend)
npm run dev
```

Rendez-vous sur **http://localhost:3000** !

---

## 🔐 Identifiants Administrateur

- **Identifiant** : `admin`
- **Mot de passe** : `admin123`
