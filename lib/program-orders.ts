/**
 * Configuration de l'ordre des vidéos pour les programmes prédéfinis
 * 
 * Cette configuration définit l'ordre spécifique dans lequel les vidéos
 * doivent être affichées pour chaque programme.
 * 
 * Pour ajouter un nouveau programme :
 * 1. Créer une constante PROGRAM_NAME_ORDER avec l'ordre des IDs de vidéos
 * 2. Ajouter le mapping dans PROGRAM_ORDERS
 * 3. La fonction sortVideosByProgramOrder appliquera automatiquement l'ordre
 */

/**
 * Ordre des vidéos pour le programme Machine (SPECIAL MACHINE)
 * Basé sur le document Word: "Descriptif des exercices programme pré établit SPECIAL MACHINE"
 * 
 * Ordre: 46, 6, 18, 1, 16, 8, 9, 3
 */
export const MACHINE_PROGRAM_ORDER: Record<number, string> = {
  1: '3427a1c1-1d44-41af-9a6c-c8a4f19d8ecf', // Vidéo 46: Gainage Planche Sur Les Pieds H    X
  2: '0933d4c9-fbd4-47ee-9216-b8759700e045', // Vidéo 6: Fessier Jambe Squat Guidé À La Machine Smith
  3: '20426fe1-82a4-4e20-9408-58a7a325f95f', // Vidéo 18: Dos Rowing
  4: '893e464d-12e8-49e7-831b-1ba43d15907e', // Vidéo 1: Fessier Jambe Presse À Cuisse Horizontale
  5: '22f4d0e9-3d9e-4539-aca3-04784afa66a2', // Vidéo 16: Pectoraux Dv Couché À La Barre Guidée Smith
  6: 'e93d32cb-d7b4-408d-a2af-712537cbee35', // Vidéo 8: Cuisse Leg Extension
  7: '7eced650-9c28-4f3b-8e6c-e1c39c544b2c', // Vidéo 9: Arrière Cuisse Leg Curl
  8: '6e36390f-1283-45b4-98d0-6ec3ab3a5034', // Vidéo 3: Triceps Debout + Poulie Haute Et Corde
}

/**
 * Ordre des vidéos pour le programme Abdos (SPECIAL ABDOMINAUX)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const ABDOS_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Brûle Graisse (SPECIAL BRULE GRAISSE)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const BRULE_GRAISSE_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Cuisses-Abdos (CUISSE ABDOS FESSIER)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const CUISSES_ABDOS_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Dos-Abdos (SPECIAL DOS-ABDOMINAUX)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const DOS_ABDOS_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Femmes (SPECIAL FEMME)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const FEMMES_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Haute Intensité (SPECIAL HAUTE INTENSITE)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const HAUTE_INTENSITE_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Jambes (SPECIALE JAMBE)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const JAMBES_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Ordre des vidéos pour le programme Réhabilitation Dos (SPECIAL REHABILITATION DU DOS)
 * À compléter avec les IDs des vidéos dans l'ordre spécifié dans le fichier Word
 */
export const REHABILITATION_DOS_PROGRAM_ORDER: Record<number, string> = {
  // TODO: Ajouter l'ordre des vidéos après identification
}

/**
 * Mapping des régions vers leurs configurations d'ordre
 */
const PROGRAM_ORDERS: Record<string, Record<number, string>> = {
  'machine': MACHINE_PROGRAM_ORDER,
  'abdos': ABDOS_PROGRAM_ORDER,
  'brule-graisse': BRULE_GRAISSE_PROGRAM_ORDER,
  'cuisses-abdos': CUISSES_ABDOS_PROGRAM_ORDER,
  'dos-abdos': DOS_ABDOS_PROGRAM_ORDER,
  'femmes': FEMMES_PROGRAM_ORDER,
  'haute-intensite': HAUTE_INTENSITE_PROGRAM_ORDER,
  'jambes': JAMBES_PROGRAM_ORDER,
  'rehabilitation-dos': REHABILITATION_DOS_PROGRAM_ORDER,
}

/**
 * Obtient l'ordre d'une vidéo dans un programme spécifique
 * @param region - La région du programme (ex: 'machine')
 * @param videoId - L'ID de la vidéo
 * @returns L'ordre de la vidéo (1-based) ou null si non trouvé
 */
export function getVideoOrder(region: string, videoId: string): number | null {
  const programOrder = PROGRAM_ORDERS[region]
  if (!programOrder || Object.keys(programOrder).length === 0) {
    return null
  }
  
  const order = Object.entries(programOrder).find(
    ([_, id]) => id === videoId
  )?.[0]
  return order ? parseInt(order, 10) : null
}

/**
 * Trie les vidéos selon l'ordre défini pour un programme
 * @param videos - Liste des vidéos à trier
 * @param region - La région du programme
 * @returns Liste des vidéos triées
 */
export function sortVideosByProgramOrder<T extends { id: string }>(
  videos: T[],
  region: string
): T[] {
  const programOrder = PROGRAM_ORDERS[region]
  
  // Si pas d'ordre défini pour cette région, retourner l'ordre par défaut
  if (!programOrder || Object.keys(programOrder).length === 0) {
    return videos
  }

  // Créer un map pour un accès rapide
  const orderMap = new Map<string, number>()
  Object.entries(programOrder).forEach(([order, videoId]) => {
    orderMap.set(videoId, parseInt(order, 10))
  })

  // Séparer les vidéos ordonnées et non ordonnées
  const orderedVideos: Array<{ video: T; order: number }> = []
  const unorderedVideos: T[] = []

  videos.forEach(video => {
    const order = orderMap.get(video.id)
    if (order !== undefined) {
      orderedVideos.push({ video, order })
    } else {
      unorderedVideos.push(video)
    }
  })

  // Trier les vidéos ordonnées par leur ordre
  orderedVideos.sort((a, b) => a.order - b.order)

  // Retourner les vidéos ordonnées suivies des non ordonnées
  return [
    ...orderedVideos.map(item => item.video),
    ...unorderedVideos
  ]
}
