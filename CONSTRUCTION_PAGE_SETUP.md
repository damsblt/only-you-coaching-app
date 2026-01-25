# Page en Construction - Guide d'Installation

Ce guide explique comment configurer et utiliser la page "en construction" protégée par authentification.

## 📋 Vue d'ensemble

La page en construction est accessible uniquement aux utilisateurs autorisés :
- `blmarieline@gmail.com`
- `damien.balet@me.com`

## 🚀 Installation

### 1. Vérifier la colonne password dans la base de données

Assurez-vous que la colonne `password` existe dans la table `users`. Si ce n'est pas le cas, exécutez :

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);
```

Ou utilisez le script existant :
```bash
node scripts/add-password-column.js
```

### 2. Créer les utilisateurs autorisés

Exécutez le script pour créer ou mettre à jour les utilisateurs autorisés :

```bash
node scripts/create-construction-users.js
```

Ce script va :
- Créer les utilisateurs s'ils n'existent pas
- Ajouter un mot de passe temporaire (`ChangeMe123!`) s'ils existent déjà sans mot de passe
- Hasher les mots de passe avec bcrypt

**⚠️ IMPORTANT** : Changez les mots de passe après la première connexion !

### 3. Accéder à la page

1. Allez sur `/construction/login`
2. Connectez-vous avec votre email autorisé et le mot de passe temporaire
3. Vous serez redirigé vers `/construction`

## 🔐 Sécurité

- Les mots de passe sont hashés avec bcrypt (10 rounds)
- L'authentification est vérifiée côté serveur
- Seuls les emails autorisés peuvent se connecter
- La session expire après 24 heures

## 📁 Fichiers créés

- `app/api/construction-auth/route.ts` - API d'authentification
- `app/construction/login/page.tsx` - Page de connexion
- `app/construction/page.tsx` - Page en construction protégée
- `scripts/create-construction-users.js` - Script de création des utilisateurs

## 🔄 Changer un mot de passe

Pour changer le mot de passe d'un utilisateur, vous pouvez :

1. Utiliser SQL directement :
```sql
-- Hasher le nouveau mot de passe avec bcrypt (utilisez un script Node.js pour générer le hash)
UPDATE users 
SET password = '$2a$10$...' -- Remplacez par le hash bcrypt
WHERE email = 'blmarieline@gmail.com';
```

2. Utiliser un script Node.js :
```javascript
const bcrypt = require('bcryptjs');
const newPassword = 'VotreNouveauMotDePasse';
const hashed = await bcrypt.hash(newPassword, 10);
console.log(hashed); // Utilisez ce hash dans la requête SQL
```

## 🛠️ Personnalisation

Pour ajouter d'autres emails autorisés, modifiez le tableau `AUTHORIZED_EMAILS` dans :
- `app/api/construction-auth/route.ts`

Et ajoutez les utilisateurs dans :
- `scripts/create-construction-users.js`

## 📝 Notes

- L'authentification est stockée dans `localStorage` côté client
- La session expire après 24 heures
- Les utilisateurs doivent se reconnecter après expiration
