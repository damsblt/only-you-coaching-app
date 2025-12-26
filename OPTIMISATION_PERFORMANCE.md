# Plan d'optimisation des performances du site

## Diagnostic actuel (26 Dec 2025)

### Points positifs ✅
- Les images S3 se chargent correctement (URLs publiques)
- Cache client implémenté pour les assets S3 (6h images, 1h vidéos)
- Préchargement des headers critiques en place

### Points à améliorer 🔧

## 1. Optimisation des Images (Impact: ÉLEVÉ)

### Problèmes identifiés:
- Images non compressées/optimisées
- Pas de formats modernes (WebP/AVIF)
- Toutes les images chargées immédiatement (pas de lazy loading)

### Solutions:

#### A. Compression et formats modernes
```typescript
// next.config.js - Activer l'optimisation d'images
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 an
  },
}
```

#### B. Lazy loading pour images below-the-fold
```typescript
// Ajouter loading="lazy" aux images non critiques
<Image
  src={imageUrl}
  alt={alt}
  loading="lazy" // ou "eager" pour images above-the-fold
  priority={false} // true seulement pour LCP images
/>
```

#### C. Responsive images
```typescript
// Utiliser sizes pour servir la bonne taille
<Image
  src={imageUrl}
  alt={alt}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## 2. Optimisation des Vidéos (Impact: TRÈS ÉLEVÉ)

### Problèmes identifiés:
- Vidéos lourdes chargées immédiatement
- Pas de compression optimale
- Pas de poster images

### Solutions:

#### A. Poster images pour vidéos
```typescript
<video
  poster="/path/to/poster.jpg" // Image de prévisualisation
  preload="metadata" // Charger seulement les métadonnées
>
```

#### B. Lazy loading vidéos
```typescript
// Charger vidéos seulement quand visibles
const videoRef = useRef<HTMLVideoElement>(null)

useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && videoRef.current) {
        videoRef.current.load()
      }
    })
  })
  
  if (videoRef.current) {
    observer.observe(videoRef.current)
  }
  
  return () => observer.disconnect()
}, [])
```

#### C. Compression vidéos
- Utiliser H.264 pour compatibilité
- Bitrate optimal: 2-5 Mbps pour 1080p
- Considérer VP9/AV1 pour navigateurs modernes

## 3. Optimisation JavaScript (Impact: MOYEN)

### Problèmes identifiés:
- Bundles potentiellement trop gros
- Pas de code splitting optimal

### Solutions:

#### A. Dynamic imports
```typescript
// Charger composants lourds à la demande
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // Si pas besoin de SSR
})
```

#### B. Analyser les bundles
```bash
npm run build
npx @next/bundle-analyzer
```

## 4. Cache HTTP (Impact: ÉLEVÉ)

### Solutions:

#### A. Headers S3
```javascript
// Ajouter dans update-s3-headers-policy.js
const cacheControl = {
  images: 'public, max-age=31536000, immutable', // 1 an
  videos: 'public, max-age=31536000, immutable',
}
```

#### B. API Routes
```typescript
// Dans les API routes
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  },
})
```

## 5. Optimisation Fonts et CSS (Impact: FAIBLE)

### Solutions:

#### A. Preload fonts critiques
```typescript
// app/layout.tsx
<link
  rel="preload"
  href="/fonts/inter.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

#### B. Critical CSS inline
- Extraire CSS critique
- Inline dans <head>
- Charger reste en async

## 6. CDN et Edge (Impact: MOYEN)

### Solutions déjà en place:
- ✅ Vercel Edge Network
- ✅ ISR (Incremental Static Regeneration)

### À améliorer:
- Configurer revalidate sur plus de pages
- Utiliser Edge Functions pour API routes critiques

## Priorités d'implémentation

### Phase 1 (Impact immédiat) 🔥
1. Lazy loading vidéos + poster images
2. Compression images existantes
3. Cache HTTP headers

### Phase 2 (Optimisation continue) ⚡
4. Formats modernes (WebP/AVIF)
5. Lazy loading images below-the-fold
6. Code splitting optimisé

### Phase 3 (Fine-tuning) 🎯
7. Fonts optimization
8. Bundle analysis et réduction
9. Critical CSS

## Métriques à suivre

### Core Web Vitals:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Outils:
- Lighthouse (Chrome DevTools)
- PageSpeed Insights
- WebPageTest
- Vercel Analytics

## Estimation des gains

| Optimisation | Gain temps chargement | Gain poids page |
|--------------|----------------------|-----------------|
| Compression images | -30% | -50% |
| Lazy loading vidéos | -60% | -70% |
| Formats modernes | -20% | -30% |
| Cache HTTP | -80% (visites répétées) | 0% |
| **TOTAL ESTIMÉ** | **-50-70%** | **-60-80%** |

## Notes

- Les vidéos sont le plus gros point d'amélioration
- Le cache est déjà bien implémenté côté client
- Les URLs publiques S3 fonctionnent maintenant correctement




