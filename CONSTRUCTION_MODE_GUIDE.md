# Guide du Mode Construction

Ce guide explique comment activer et désactiver le mode construction qui bloque l'accès au site entier sauf pour les utilisateurs autorisés.

## 🚀 Activation du Mode Construction

### 1. Définir les variables d'environnement

Ajoutez les variables d'environnement suivantes dans votre fichier `.env.local` :

```bash
CONSTRUCTION_MODE=true
CONSTRUCTION_JWT_SECRET=votre-secret-jwt-tres-securise-changez-en-production
```

**⚠️ IMPORTANT** : Changez `CONSTRUCTION_JWT_SECRET` par une valeur aléatoire sécurisée en production !

### 2. Sur Vercel (Production)

1. Allez dans votre projet Vercel
2. Ouvrez **Settings** → **Environment Variables**
3. Ajoutez les variables suivantes :
   - **Name** : `CONSTRUCTION_MODE`
     - **Value** : `true`
     - **Environment** : Production (et/ou Preview si nécessaire)
   - **Name** : `CONSTRUCTION_JWT_SECRET`
     - **Value** : (générez une clé secrète aléatoire, par exemple avec `openssl rand -base64 32`)
     - **Environment** : Production (et/ou Preview si nécessaire)
4. Redéployez l'application

## 🔓 Désactivation du Mode Construction (Mise en ligne)

### Option 1 : Supprimer la variable d'environnement

1. **En local** : Supprimez ou commentez la ligne dans `.env.local` :
   ```bash
   # CONSTRUCTION_MODE=true
   ```

2. **Sur Vercel** :
   - Allez dans **Settings** → **Environment Variables**
   - Supprimez la variable `CONSTRUCTION_MODE`
   - Ou changez sa valeur à `false`
   - Redéployez l'application

### Option 2 : Mettre la valeur à `false`

```bash
CONSTRUCTION_MODE=false
```

## 📋 Comportement

### Quand le mode construction est **ACTIVÉ** (`CONSTRUCTION_MODE=true`) :

- 🔒 **TOUTES les pages du site sont bloquées** et redirigent vers `/construction/login`
- ✅ Seules les pages suivantes sont accessibles sans authentification :
  - `/construction/login` (page de connexion)
  - `/api/construction-auth` (API d'authentification)
  - `/api/construction-verify` (API de vérification)
  - `/api/construction-logout` (API de déconnexion)
  - Assets statiques (`/_next/*`, `/favicon.ico`, etc.)
- ✅ **Après authentification réussie**, les utilisateurs autorisés peuvent accéder à toutes les pages du site
- 🔐 L'authentification est vérifiée **côté serveur** via un cookie HTTP-only sécurisé
- 🚫 **Impossible de contourner** en modifiant l'URL ou localStorage

### Quand le mode construction est **DÉSACTIVÉ** (`CONSTRUCTION_MODE=false` ou non défini) :

- ✅ Toutes les pages du site fonctionnent normalement
- ✅ Le site est accessible au public

## 🔐 Authentification

### Utilisateurs autorisés

Seuls les utilisateurs suivants peuvent accéder au site en mode construction :
- `blmarieline@gmail.com`
- `damien.balet@me.com`

### Comment se connecter

1. Accéder à n'importe quelle page du site (vous serez redirigé vers `/construction/login`)
2. Se connecter avec un email autorisé et le mot de passe défini dans la base de données
3. Après connexion réussie, un cookie sécurisé est créé et vous pouvez accéder à toutes les pages

### Créer les utilisateurs

Si les utilisateurs n'existent pas encore dans la base de données :

```bash
node scripts/create-construction-users.js
```

Ce script va :
- Créer les utilisateurs s'ils n'existent pas
- Ajouter un mot de passe temporaire (`ChangeMe123!`) s'ils existent déjà sans mot de passe
- Hasher les mots de passe avec bcrypt

**⚠️ IMPORTANT** : Changez les mots de passe après la première connexion !

### Sécurité

- ✅ Authentification vérifiée **côté serveur** dans le middleware
- ✅ Cookie HTTP-only (non accessible via JavaScript)
- ✅ Token JWT signé avec secret
- ✅ Expiration automatique après 24 heures
- ✅ Impossible de contourner en modifiant l'URL ou localStorage

## 📝 Notes importantes

- Le middleware vérifie la variable d'environnement et l'authentification à chaque requête
- Les changements nécessitent un redéploiement sur Vercel
- En développement local, modifiez `.env.local` et redémarrez le serveur
- Les routes API d'authentification sont accessibles sans authentification
- **Toutes les autres pages sont bloquées** tant que le mode construction est activé
- L'authentification est vérifiée côté serveur, impossible de contourner

## 🛠️ Fichiers concernés

- `middleware.ts` - Middleware Next.js qui vérifie l'authentification et bloque l'accès
- `app/construction/page.tsx` - Page en construction (accessible après authentification)
- `app/construction/login/page.tsx` - Page de connexion
- `app/construction/layout.tsx` - Layout sans Header/Footer pour les pages de construction
- `app/api/construction-auth/route.ts` - API d'authentification (crée le cookie)
- `app/api/construction-verify/route.ts` - API de vérification de l'authentification
- `app/api/construction-logout/route.ts` - API de déconnexion (supprime le cookie)

## 🔧 Dépannage

### Le site ne bloque pas l'accès

1. Vérifiez que `CONSTRUCTION_MODE=true` est défini dans les variables d'environnement
2. Redéployez l'application sur Vercel
3. Vérifiez les logs du middleware dans la console Vercel

### Impossible de se connecter

1. Vérifiez que les utilisateurs existent dans la base de données
2. Vérifiez que les mots de passe sont correctement hashés
3. Vérifiez que `CONSTRUCTION_JWT_SECRET` est défini
4. Vérifiez les logs de l'API dans la console Vercel

### Le cookie n'est pas créé

1. Vérifiez que `CONSTRUCTION_JWT_SECRET` est défini
2. En production, vérifiez que le cookie est créé avec `secure: true` (HTTPS requis)
