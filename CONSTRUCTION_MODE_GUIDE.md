# Guide du Mode Construction

Ce guide explique comment activer et désactiver le mode construction qui redirige toutes les pages vers la page en construction.

## 🚀 Activation du Mode Construction

### 1. Définir la variable d'environnement

Ajoutez la variable d'environnement suivante dans votre fichier `.env.local` :

```bash
CONSTRUCTION_MODE=true
```

### 2. Sur Vercel (Production)

1. Allez dans votre projet Vercel
2. Ouvrez **Settings** → **Environment Variables**
3. Ajoutez une nouvelle variable :
   - **Name** : `CONSTRUCTION_MODE`
   - **Value** : `true`
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

- ✅ Toutes les pages du site redirigent vers `/construction/login`
- ✅ Seules les pages suivantes sont accessibles :
  - `/construction` (page en construction)
  - `/construction/login` (page de connexion)
  - `/api/*` (toutes les routes API)
  - Assets statiques (`/_next/*`, `/favicon.ico`, etc.)

### Quand le mode construction est **DÉSACTIVÉ** (`CONSTRUCTION_MODE=false` ou non défini) :

- ✅ Toutes les pages du site fonctionnent normalement
- ✅ Le site est accessible au public

## 🔐 Authentification

Pour accéder à la page en construction, vous devez :

1. Accéder à `/construction/login`
2. Vous connecter avec un email autorisé :
   - `blmarieline@gmail.com`
   - `damien.balet@me.com`
3. Utiliser le mot de passe défini dans la base de données

**Créer les utilisateurs** :
```bash
node scripts/create-construction-users.js
```

## 📝 Notes importantes

- Le middleware vérifie la variable d'environnement à chaque requête
- Les changements nécessitent un redéploiement sur Vercel
- En développement local, modifiez `.env.local` et redémarrez le serveur
- Les routes API ne sont pas affectées par le mode construction

## 🛠️ Fichiers concernés

- `middleware.ts` - Middleware Next.js qui gère les redirections
- `app/construction/page.tsx` - Page en construction
- `app/construction/login/page.tsx` - Page de connexion
- `app/construction/layout.tsx` - Layout sans Header/Footer pour les pages de construction
- `app/api/construction-auth/route.ts` - API d'authentification
