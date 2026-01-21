# 🔧 Guide de Configuration DNS pour Vercel

## 📋 Vue d'ensemble

Pour que vos domaines `only-you-coaching.com` et `www.only-you-coaching.com` fonctionnent avec Vercel, vous devez mettre à jour vos enregistrements DNS.

## 🎯 Étapes à suivre

### 1. Vérifier les instructions DNS dans Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet : **pilates-coaching-app**
3. Allez dans **Settings** → **Domains**
4. Pour chaque domaine (`only-you-coaching.com` et `www.only-you-coaching.com`), Vercel affiche les instructions DNS exactes à utiliser

### 2. Choisir la configuration DNS appropriée

#### Option A : Si Infomaniak supporte ALIAS/ANAME (recommandé)

Utilisez le fichier **`DNS_CONFIG_VERCEL_ALTERNATIVE.txt`** qui utilise :
- `ALIAS` pour le domaine racine (`@`) vers `cname.vercel-dns.com`
- `CNAME` pour `www` vers `cname.vercel-dns.com`

**Avantage** : Permet de conserver tous les enregistrements MX, NS, TXT existants.

#### Option B : Configuration standard (recommandée)

Utilisez le fichier **`DNS_CONFIG_VERCEL_MISE_A_JOUR.txt`** qui utilise :
- Enregistrement `A` pour le domaine racine (`@`) vers `216.198.79.1` (nouvelle IP Vercel)
- `CNAME` pour `www` vers `cname.vercel-dns.com`

**Note** : Cette IP (`216.198.79.1`) est celle affichée dans votre Vercel Dashboard.

### 3. Mettre à jour les enregistrements DNS dans Infomaniak

1. Connectez-vous à votre compte Infomaniak
2. Allez dans la gestion DNS de votre domaine `only-you-coaching.com`
3. Modifiez les enregistrements suivants :

#### Pour le domaine racine (`@` ou `only-you-coaching.com`) :

**Selon Vercel Dashboard (requis) :**
```
Type: A
Nom: @ (ou laissez vide)
Valeur: 216.198.79.1
TTL: 300
```

**Note :** Vercel recommande maintenant `216.198.79.1` (nouvelle IP). L'ancienne IP `76.76.21.21` fonctionne toujours mais n'est plus recommandée.

#### Pour le sous-domaine `www` :

```
Type: CNAME
Nom: www
Valeur: cname.vercel-dns.com
TTL: 3600
```

### 4. Conserver les enregistrements existants

Assurez-vous de **conserver** tous les enregistrements suivants :
- `NS` (serveurs de noms)
- `MX` (mail)
- `TXT` (SPF, Brevo, DMARC)
- `CNAME` (autoconfig, autodiscover)

### 5. Supprimer les anciens enregistrements

**Supprimez** les anciens enregistrements A/AAAA pour `www` qui pointaient vers `83.166.133.33` :
- ❌ `www IN A 83.166.133.33`
- ❌ `www IN AAAA 2001:1600:4:11::8f`

### 6. Vérifier la propagation DNS

1. Attendez quelques minutes (la propagation peut prendre jusqu'à 48h, mais généralement c'est rapide)
2. Vérifiez avec des outils en ligne :
   - [whatsmydns.net](https://www.whatsmydns.net/)
   - [dnschecker.org](https://dnschecker.org/)
3. Vérifiez que :
   - `only-you-coaching.com` pointe vers l'IP Vercel ou résout via ALIAS
   - `www.only-you-coaching.com` résout vers `cname.vercel-dns.com`

### 7. Valider dans Vercel

1. Retournez dans Vercel Dashboard → **Settings** → **Domains**
2. Cliquez sur **"Refresh"** pour chaque domaine
3. Vercel vérifiera automatiquement la configuration DNS
4. Une fois validé, le statut passera de "Invalid Configuration" à "Valid"

## ✅ Configuration finale attendue

Après configuration, vos domaines devraient :
- ✅ Résoudre correctement vers Vercel
- ✅ Être validés dans Vercel Dashboard
- ✅ Rediriger automatiquement `www` → `non-www` (si configuré dans Vercel)
- ✅ Conserver le fonctionnement de l'email (MX, SPF, DMARC)

## 🔍 Dépannage

### Le domaine n'est toujours pas validé après 24h

1. Vérifiez que les enregistrements DNS sont correctement configurés
2. Vérifiez la propagation DNS avec les outils mentionnés ci-dessus
3. Cliquez sur "Refresh" dans Vercel Dashboard
4. Contactez le support Vercel si le problème persiste

### L'email ne fonctionne plus

Si vous avez utilisé un enregistrement A au lieu d'ALIAS pour le domaine racine, vérifiez que les enregistrements MX sont toujours présents et corrects.

### Le site ne charge pas

1. Vérifiez que les domaines sont bien ajoutés dans Vercel Dashboard
2. Vérifiez que le dernier déploiement est en production
3. Vérifiez les logs dans Vercel Dashboard → **Logs**

## 📞 Support

- **Vercel** : [vercel.com/support](https://vercel.com/support)
- **Infomaniak** : [infomaniak.com/support](https://www.infomaniak.com/support)
