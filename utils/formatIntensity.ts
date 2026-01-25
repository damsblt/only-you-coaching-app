/**
 * Fonction pour nettoyer l'affichage de l'intensité
 * Supprime les points après les deux-points et capitalise si nécessaire
 * 
 * Exemples:
 * ". Intermédiaire et avancé" → "Intermédiaire et avancé"
 * ". avancé" → "Avancé"
 * "Tout niveau" → "Tout niveau"
 */
export function formatIntensity(intensity: string | null | undefined): string {
  if (!intensity) return ''
  
  let cleaned = intensity.trim()
  
  // Supprimer les points au début (après les deux-points)
  cleaned = cleaned.replace(/^\.\s*/, '')
  
  // Capitaliser la première lettre si elle est en minuscule
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toLowerCase()) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }
  
  return cleaned.trim()
}
