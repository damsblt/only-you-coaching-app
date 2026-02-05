/**
 * Configuration de l'ordre des audios pour le coaching mental
 * 
 * Cette configuration définit l'ordre spécifique dans lequel les audios
 * doivent être affichés sur la page /coaching-mental.
 */

/**
 * Ordre des audios de coaching mental
 * Mapping: orderIndex -> titre de l'audio
 */
export const COACHING_MENTAL_ORDER: Record<number, string> = {
  1: 'Travailler son auto-discipline',
  2: 'L\'importance de se fixer des objectifs',
  3: 'L\'importance de la pensée positive',
  4: 'L\'importance de l\'instant présent',
}

/**
 * Normalise un titre pour la comparaison (supprime accents, majuscules, etc.)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, ' ') // Normalise les espaces
}

/**
 * Trouve l'ordre d'un audio basé sur son titre
 * @param title - Le titre de l'audio
 * @returns L'ordre (1-based) ou null si non trouvé
 */
export function getCoachingMentalOrder(title: string): number | null {
  const normalizedTitle = normalizeTitle(title)
  
  for (const [orderStr, expectedTitle] of Object.entries(COACHING_MENTAL_ORDER)) {
    const normalizedExpected = normalizeTitle(expectedTitle)
    
    // Correspondance exacte
    if (normalizedTitle === normalizedExpected) {
      return parseInt(orderStr, 10)
    }
    
    // Correspondance partielle (tous les mots-clés présents)
    const expectedWords = normalizedExpected.split(' ').filter(w => w.length > 2)
    const titleWords = normalizedTitle.split(' ').filter(w => w.length > 2)
    
    if (expectedWords.length > 0 && expectedWords.every(word => 
      titleWords.some(tWord => tWord.includes(word) || word.includes(tWord))
    )) {
      return parseInt(orderStr, 10)
    }
  }
  
  return null
}

/**
 * Trie les audios selon l'ordre défini pour le coaching mental
 * @param audios - Liste des audios à trier
 * @returns Liste des audios triées
 */
export function sortCoachingMentalAudios<T extends { title: string; orderIndex?: number | null }>(
  audios: T[]
): T[] {
  // Séparer les audios ordonnés et non ordonnés
  const orderedAudios: Array<{ audio: T; order: number }> = []
  const unorderedAudios: T[] = []

  audios.forEach(audio => {
    // D'abord, essayer d'utiliser orderIndex de la base de données
    if (audio.orderIndex && audio.orderIndex > 0) {
      orderedAudios.push({ audio, order: audio.orderIndex })
      return
    }
    
    // Sinon, essayer de trouver l'ordre basé sur le titre
    const order = getCoachingMentalOrder(audio.title)
    if (order !== null) {
      orderedAudios.push({ audio, order })
    } else {
      unorderedAudios.push(audio)
    }
  })

  // Trier les audios ordonnés par leur ordre
  orderedAudios.sort((a, b) => a.order - b.order)

  // Retourner les audios ordonnés suivis des non ordonnés
  return [
    ...orderedAudios.map(item => item.audio),
    ...unorderedAudios
  ]
}
