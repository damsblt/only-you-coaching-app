# Implémentation Vidéo Mobile - Mode Paysage

## Date: 2026-01-18

## Fonctionnalités Implémentées

### 1. Rotation Automatique en Mode Paysage sur Mobile

**Objectif**: Lorsqu'une vidéo démarre sur un appareil mobile, encourager l'utilisateur à tourner son téléphone en mode paysage pour une meilleure expérience de visionnage.

**Approche Implémentée**:
- Utilisation de l'API Screen Orientation pour verrouiller l'écran en mode paysage
- Si l'API n'est pas disponible ou échoue, affichage d'un overlay visuel avec animation
- L'overlay disparaît automatiquement après 5 secondes ou lorsque l'utilisateur tourne son téléphone
- Déverrouillage automatique de l'orientation lorsque la vidéo se met en pause ou se ferme

**Fichiers Modifiés**:
- `app/globals.css`: Ajout des styles pour l'overlay de rotation
- `components/video/ComputerStreamPlayer.tsx`: Ajout de la logique de détection d'orientation et du hint
- `components/video/MobileStreamPlayer.tsx`: Ajout de la même logique pour la cohérence

### 2. Optimisation du Scroll TikTok

**État Actuel**:
Le scroll TikTok est déjà implémenté avec:
- Détection des gestes de swipe vertical (minimum 50px)
- Distinction entre swipe horizontal et vertical (tolérance de 50px horizontal)
- Indicateur visuel de scroll pour la première vidéo
- Snap automatique sur chaque vidéo
- Support du scroll via clavier (flèches)

**Comportement**:
- Swipe up: Vidéo suivante
- Swipe down: Vidéo précédente
- Indicateur de progression du swipe en temps réel
- Prévention du scroll du body pendant la navigation vidéo

## CSS Ajouté

```css
/* Mobile video rotation hint */
.rotate-hint-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-in;
}

.rotate-hint-icon {
  font-size: 4rem;
  color: white;
  margin-bottom: 1rem;
  animation: rotate-pulse 2s ease-in-out infinite;
}

@keyframes rotate-pulse {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(90deg) scale(1.1);
  }
  75% {
    transform: rotate(90deg) scale(1.1);
  }
}

/* Hide in landscape */
@media (orientation: landscape) {
  .rotate-hint-overlay {
    display: none !important;
  }
}
```

## API Screen Orientation

L'implémentation tente d'utiliser `screen.orientation.lock('landscape')` qui est supporté sur:
- Chrome/Edge sur Android
- Safari sur iOS (avec limitations)

En cas d'échec, un fallback visuel est affiché.

## Tests à Effectuer

### Sur Appareil Mobile Réel:
1. **Test iPhone (Safari)**:
   - Ouvrir l'app en mode portrait
   - Lancer une vidéo
   - Vérifier l'affichage de l'overlay de rotation ou le verrouillage automatique
   - Tourner le téléphone en paysage
   - Vérifier que l'overlay disparaît
   - Tester le scroll TikTok (swipe up/down)

2. **Test Android (Chrome)**:
   - Mêmes tests qu'iPhone
   - Vérifier le verrouillage automatique de l'orientation (plus probable que iOS)
   
3. **Test du Scroll TikTok**:
   - Vérifier le snap sur chaque vidéo
   - Tester la fluidité du swipe
   - Vérifier l'indicateur de scroll sur la première vidéo
   - Tester le swipe avec différentes vitesses

### Tests Desktop:
✅ Compilé sans erreurs
✅ Interface en mode feed fonctionne
✅ Contrôles vidéo présents
✅ Navigation possible

## Notes Importantes

1. **Comportement par Défaut Mobile**: Les vidéos sur mobile démarrent en `muted: true` pour permettre l'autoplay (politique des navigateurs).

2. **Object-fit**: Les vidéos utilisent `object-fit: cover` pour remplir l'écran sans déformation, avec centrage.

3. **Safe Areas**: L'implémentation respecte les safe areas iOS (notch) avec `env(safe-area-inset-*)`.

4. **Performance**: Le scroll utilise `scroll-snap` CSS natif pour de meilleures performances.

## Prochaines Étapes

1. Tester sur un vrai appareil mobile (iPhone/Android)
2. Ajuster l'animation de l'overlay selon les retours
3. Possiblement ajouter une vibration haptique lors du changement de vidéo (si souhaité)
4. Considérer l'ajout d'un bouton pour forcer le plein écran si l'API Screen Orientation échoue
