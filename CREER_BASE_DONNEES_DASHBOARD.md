# 🗄️ Créer Vercel Postgres via le Dashboard

La commande `vercel postgres` n'est pas disponible dans le CLI actuel. Voici comment créer la base de données via le dashboard Vercel.

## 🚀 Étapes Rapides

### 1. Ouvrir le Dashboard Vercel

Allez sur : **https://vercel.com/dashboard**

### 2. Sélectionner votre projet

Cliquez sur le projet : **only-you-coaching**

### 3. Accéder à Storage

1. Dans le menu de gauche, cliquez sur **"Storage"**
2. Ou allez directement sur : **https://vercel.com/dashboard/storage**

### 4. Créer la base de données

1. Cliquez sur le bouton **"Create Database"** (en haut à droite)
2. Sélectionnez **"Postgres"**
3. Remplissez le formulaire :
   - **Name** : `pilates-app-db`
   - **Region** : `iad1` (US East) ou la région la plus proche de vos utilisateurs
   - **Plan** : `Free` (256 MB)
4. Cliquez sur **"Create"**

### 5. Lier la base au projet

Une fois créée, la base de données sera automatiquement liée à votre projet et les variables d'environnement seront créées automatiquement.

## 📥 Récupérer les variables d'environnement

Après la création, récupérez les variables d'environnement localement :

```bash
vercel env pull .env.local --token="[REDACTED_VERCEL_TOKEN]"
```

Ou via npm script :

```bash
npm run vercel:env:pull
```

## ✅ Vérifier la création

Vérifiez que les variables sont bien présentes :

```bash
cat .env.local | grep POSTGRES
```

Vous devriez voir :
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

## 🧪 Tester la connexion

```bash
npm run test-vercel-postgres
```

## 📋 Prochaines étapes

1. ✅ Base de données créée
2. ⏭️ Migrer le schéma SQL (via SQL Editor dans le dashboard)
3. ⏭️ Migrer les données : `npm run migrate-to-vercel-postgres`
4. ⏭️ Mettre à jour le code pour utiliser `lib/db-vercel.ts`

---

**💡 Astuce** : Une fois créée, vous pouvez gérer la base de données directement depuis le dashboard Vercel dans l'onglet "Storage".

