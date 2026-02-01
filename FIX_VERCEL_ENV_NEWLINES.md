# Correction des Newlines dans les Variables Vercel

## 🎯 Problème Identifié

Les variables d'environnement dans Vercel contiennent des caractères de nouvelle ligne (`\n`) à la fin, ce qui cause l'erreur :
```
Region not accepted: region="eu-north-1\n" is not a valid hostname component.
```

## ✅ Solution 1 : Code Corrigé (Déjà Fait)

Le code a été mis à jour pour nettoyer automatiquement les variables d'environnement. Les routes API utilisent maintenant `cleanEnvVar()` qui supprime les newlines.

**Cependant**, il est recommandé de corriger les variables dans Vercel pour éviter tout problème futur.

## 🔧 Solution 2 : Corriger les Variables dans Vercel

### Étape 1 : Supprimer les Variables Existantes

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. **Supprimez** ces variables (si elles existent) :
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET_NAME`

### Étape 2 : Réajouter les Variables (Sans Newlines)

**Important :** Lors de l'ajout, copiez-collez les valeurs **sans** appuyer sur Entrée à la fin.

#### Variable 1 : AWS_REGION
- **Key:** `AWS_REGION`
- **Value:** `eu-north-1` (copiez exactement, sans espace ni newline)
- **Environments:** ✅ Production, ✅ Preview

#### Variable 2 : AWS_ACCESS_KEY_ID
- **Key:** `AWS_ACCESS_KEY_ID`
- **Value:** `VOTRE_ACCESS_KEY_ID` (remplacez par votre vraie clé, sans espace ni newline)
- **Environments:** ✅ Production, ✅ Preview

#### Variable 3 : AWS_SECRET_ACCESS_KEY
- **Key:** `AWS_SECRET_ACCESS_KEY`
- **Value:** `VOTRE_SECRET_ACCESS_KEY` (remplacez par votre vraie clé secrète, sans espace ni newline)
- **Environments:** ✅ Production, ✅ Preview

#### Variable 4 : AWS_S3_BUCKET_NAME
- **Key:** `AWS_S3_BUCKET_NAME`
- **Value:** `only-you-coaching` (copiez exactement, sans espace ni newline)
- **Environments:** ✅ Production, ✅ Preview

### Étape 3 : Vérifier les Valeurs

Après avoir ajouté chaque variable, vérifiez dans la liste que :
- ✅ La valeur affichée ne contient pas de caractères invisibles
- ✅ Il n'y a pas d'espaces en début/fin
- ✅ Le nombre de caractères correspond à la valeur attendue

### Étape 4 : Redéployer

**Important :** Après avoir modifié les variables, vous DEVEZ redéployer :

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** du dernier déploiement
3. Sélectionnez **Redeploy**

## ✅ Vérification

### Test 1 : Endpoint de Diagnostic
Visitez : `https://only-you-coaching.com/api/gallery/debug`

Vous devriez maintenant voir :
```json
{
  "checks": {
    "awsCredentials": {
      "region": "eu-north-1",  // ✅ Pas de \n
      "bucket": "only-you-coaching"  // ✅ Pas de \n
    },
    "s3Listing": {
      "success": true,  // ✅ Plus d'erreur
      "foundObjects": 8
    }
  },
  "summary": {
    "status": "OK"  // ✅ Plus d'erreur
  }
}
```

### Test 2 : Galerie
Visitez : `https://only-you-coaching.com/methode`

La galerie devrait maintenant afficher les 8 images.

## 🔍 Comment Éviter les Newlines à l'Avenir

### Méthode 1 : Via le Dashboard Vercel
- **Ne pas** appuyer sur Entrée après avoir collé la valeur
- **Ne pas** avoir d'espaces en début/fin
- Utiliser **Ctrl+V** (ou Cmd+V) pour coller, puis cliquer directement sur **Save**

### Méthode 2 : Via Vercel CLI
```bash
# Utiliser echo -n pour éviter les newlines
echo -n "eu-north-1" | vercel env add AWS_REGION production

# Ou utiliser printf
printf "eu-north-1" | vercel env add AWS_REGION production
```

### Méthode 3 : Via l'API Vercel
Les valeurs sont automatiquement nettoyées si vous utilisez l'API Vercel.

## 📝 Notes Techniques

- Le code utilise maintenant `cleanEnvVar()` qui supprime automatiquement les newlines
- Même si les variables contiennent des newlines, le code devrait fonctionner
- Cependant, il est recommandé de corriger les variables à la source pour éviter tout problème

## 🎯 Résultat Attendu

Après correction et redéploiement :
- ✅ L'endpoint `/api/gallery/debug` retourne `status: "OK"`
- ✅ L'endpoint `/api/gallery/training-photos` retourne les 8 images
- ✅ La galerie sur `/methode` affiche les images correctement
- ✅ Plus d'erreur "Region not accepted"
