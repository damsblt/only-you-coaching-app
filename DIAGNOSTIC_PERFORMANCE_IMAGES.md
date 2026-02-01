# 🔍 Diagnostic Performance - Images et Espace Disque

## 📊 Résumé Exécutif

**Problème principal :** Le site est lent au chargement des images car le dossier `public/` contient **237 MB** de fichiers non optimisés, principalement des images de 8-9 MB chacune.

## 🚨 Problèmes Identifiés

### 1. Images Énormes dans `public/about/` (≈200 MB)

**Taille totale du dossier :** ~200 MB

#### Images de coaching (16 images) : ~140 MB
- `coaching-1.jpg` à `coaching-16.jpg` : **7-9 MB chacune**
- Total : ~140 MB

#### Images de clients (dossier `clients/`) : ~68 MB
- `client-1.jpg` à `client-6.jpg` : **8-9 MB chacune**
- Autres fichiers PNG : ~10 MB

#### Autres fichiers :
- `ok-13.JPG` : **8.9 MB**
- `about-hero.png` : 532 KB
- `coaching-gallery.png` : 764 KB
- `marie-line-portrait.jpg` : 172 KB
- `marie-line-portrait.png` : 324 KB

### 2. Vidéo de Test Non Optimisée

- `public/test-video.mp4` : **22 MB**
- Cette vidéo ne devrait pas être en production

### 3. Problèmes Techniques

#### A. Images Non Optimisées
- ❌ Format JPEG non compressé (qualité 100%)
- ❌ Pas de conversion WebP/AVIF
- ❌ Pas de redimensionnement selon l'usage
- ❌ Toutes les images chargées en pleine résolution

#### B. Chargement Non Optimisé
- Les images dans `public/` sont servies directement sans optimisation Next.js
- Même si Next.js Image est utilisé, les fichiers source sont trop lourds
- Pas de lazy loading systématique
- Pas de responsive images (sizes)

#### C. Utilisation comme Fallback
- Les images lourdes sont utilisées comme `fallbackSrc` dans `S3Image`
- Si S3 échoue, l'utilisateur télécharge une image de 8-9 MB

## 📈 Impact sur les Performances

### Temps de Chargement Estimé (4G)

| Fichier | Taille | Temps (4G) | Impact |
|---------|--------|------------|--------|
| `coaching-1.jpg` | 8.9 MB | ~2-3 secondes | 🔴 Critique |
| `client-1.jpg` | 8.9 MB | ~2-3 secondes | 🔴 Critique |
| `test-video.mp4` | 22 MB | ~5-6 secondes | 🔴 Critique |
| **Total page About** | ~200 MB | **~50-60 secondes** | 🔴🔴🔴 Critique |

### Métriques Web Vitals Affectées

- **LCP (Largest Contentful Paint)** : Dégradé par les images lourdes
- **FID (First Input Delay)** : Bloqué par le téléchargement des images
- **CLS (Cumulative Layout Shift)** : Causé par le chargement tardif
- **TBT (Total Blocking Time)** : Augmenté par le parsing des grandes images

## ✅ Solutions Recommandées

### 1. Compression et Optimisation des Images (PRIORITÉ HAUTE)

#### A. Compression JPEG
```bash
# Utiliser ImageMagick ou Sharp pour compresser
# Objectif : Réduire de 8-9 MB à 200-500 KB (95% de réduction)
```

**Outils recommandés :**
- **Sharp** (Node.js) : Automatisation
- **ImageOptim** (Mac) : Interface graphique
- **Squoosh** (Web) : Compression en ligne

**Paramètres cibles :**
- Qualité JPEG : 75-85% (au lieu de 100%)
- Largeur max : 1920px (au lieu de 4000-6000px)
- Format : WebP pour modern browsers, JPEG pour fallback

#### B. Conversion en Formats Modernes
- **WebP** : -30% de taille vs JPEG
- **AVIF** : -50% de taille vs JPEG (support limité)
- **Fallback JPEG** : Pour compatibilité

#### C. Redimensionnement selon Usage
- **Thumbnails** : 400x400px (50-100 KB)
- **Images moyennes** : 1200x1200px (200-400 KB)
- **Images full** : 1920x1920px (500 KB - 1 MB max)

### 2. Optimisation Next.js Image

#### A. Vérifier que toutes les images utilisent Next.js Image
```typescript
// ✅ BON
<Image src="/about/coaching-1.jpg" width={800} height={600} />

// ❌ MAUVAIS
<img src="/about/coaching-1.jpg" />
```

#### B. Ajouter `sizes` pour responsive
```typescript
<Image
  src="/about/coaching-1.jpg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

#### C. Lazy loading systématique
```typescript
<Image
  src="/about/coaching-1.jpg"
  loading="lazy" // Sauf pour images above-the-fold
  priority={false} // true seulement pour LCP
/>
```

### 3. Suppression des Fichiers Inutiles

#### A. Supprimer la vidéo de test
```bash
rm public/test-video.mp4  # 22 MB économisés
```

#### B. Déplacer les images vers S3
- Les images de `public/about/` devraient être sur S3
- Utiliser `S3Image` au lieu de `Image` avec `/about/`
- Garder seulement les petits assets dans `public/`

### 4. Script d'Optimisation Automatique

Créer un script pour :
1. Compresser toutes les images
2. Générer des versions WebP/AVIF
3. Créer des thumbnails
4. Mettre à jour les références dans le code

## 📋 Plan d'Action Immédiat

### Étape 1 : Compression Manuelle (Quick Win)
1. Compresser les 16 images `coaching-*.jpg` : 8-9 MB → 200-500 KB
2. Compresser les 6 images `client-*.jpg` : 8-9 MB → 200-500 KB
3. **Gain estimé :** ~180 MB (de 200 MB à ~20 MB)

### Étape 2 : Suppression Fichiers Inutiles
1. Supprimer `public/test-video.mp4` (22 MB)
2. Vérifier si toutes les images sont utilisées
3. **Gain estimé :** ~22 MB

### Étape 3 : Migration vers S3
1. Uploader les images optimisées sur S3
2. Remplacer les références `/about/` par `S3Image`
3. Supprimer les images de `public/about/` (sauf petits assets)

### Étape 4 : Optimisation Code
1. Vérifier que toutes les images utilisent `Image` ou `S3Image`
2. Ajouter `sizes` et `loading="lazy"`
3. Optimiser les `fallbackSrc` (utiliser des images légères)

## 🎯 Objectifs de Performance

### Avant Optimisation
- **Taille totale public/** : 237 MB
- **Temps chargement page About** : 50-60 secondes (4G)
- **LCP** : > 4 secondes
- **Score Lighthouse** : ~40-50

### Après Optimisation
- **Taille totale public/** : < 10 MB (images optimisées + petits assets)
- **Temps chargement page About** : 2-3 secondes (4G)
- **LCP** : < 2.5 secondes
- **Score Lighthouse** : > 90

## 🔧 Outils et Commandes

### Compression avec Sharp (Node.js)
```javascript
const sharp = require('sharp')

async function compressImage(input, output) {
  await sharp(input)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(output)
}
```

### Vérifier la taille des fichiers
```bash
# Taille totale
du -sh public/

# Top 20 fichiers les plus lourds
find public -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr | head -20
```

### Conversion WebP
```bash
# Avec cwebp (Google)
cwebp -q 80 input.jpg -o output.webp
```

## 📝 Checklist d'Optimisation

- [ ] Compresser toutes les images > 1 MB
- [ ] Convertir en WebP pour modern browsers
- [ ] Créer des thumbnails pour les galeries
- [ ] Supprimer `test-video.mp4`
- [ ] Vérifier que toutes les images utilisent `Image` ou `S3Image`
- [ ] Ajouter `sizes` pour responsive images
- [ ] Ajouter `loading="lazy"` pour images below-the-fold
- [ ] Migrer les images vers S3
- [ ] Optimiser les `fallbackSrc` (images légères)
- [ ] Tester les performances avec Lighthouse

## 🚀 Résultat Attendu

Après optimisation :
- ✅ **Réduction de 95% de la taille** (237 MB → ~10 MB)
- ✅ **Chargement 10x plus rapide** (50s → 5s)
- ✅ **Meilleure expérience utilisateur**
- ✅ **Score Lighthouse > 90**
- ✅ **SEO amélioré** (Google favorise les sites rapides)

---

**Date du diagnostic :** 2025-01-27
**Prochaine révision :** Après implémentation des optimisations
