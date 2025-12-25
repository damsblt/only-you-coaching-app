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
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/machine/machine.md"
 * 
 * Ordre: 46, 6, 18, 1, 16, 8, 9, 3
 */
export const MACHINE_PROGRAM_ORDER: Record<number, string> = {
  1: 'f86535ad-803f-454e-ac79-802aaa167e2f', // Vidéo 46: Gainage planche sur les pieds h    x
  2: 'c592198c-a334-4307-ba65-e662c463d7b2', // Vidéo 6: Fessier jambe squat guidé à la machine smith
  3: 'c31f4504-e035-401d-84fc-44b2df8ee273', // Vidéo 18: Dos rowing
  4: 'a7a7f203-a284-450d-8af0-dfea984bfed3', // Vidéo 1: Fessier jambe presse à cuisse horizontale
  5: '13b4989a-a4e6-44c6-b762-961063f7387a', // Vidéo 16: Pectoraux dv couché à la barre guidée smith
  6: 'e5177938-fb91-42cd-af50-cc7bb6f8127d', // Vidéo 8: Cuisse leg extension
  7: '321dd494-2d9d-48c9-9b72-46cfa7c93201', // Vidéo 9: Arrière cuisse leg curl
  8: 'd03a5854-0d51-44dc-8b1d-d0b2ef157f54', // Vidéo 3: Triceps debout + poulie haute et corde
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
 * Ordre des vidéos pour le programme Cuisses-Abdos (CUISSE ABDOS)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/cuisses-abdos/cuisses-abdos.md"
 * 
 * Ordre: 14, 7, 9, 42, 67, 46, 62, 74
 */
export const CUISSES_ABDOS_PROGRAM_ORDER: Record<number, string> = {
  1: '0a48b945-82bc-4661-8ce9-40eae4eaa4bf', // Vidéo 14: Crunch sur ballon avec pieds au sol
  2: 'd1ac9a8b-bc01-4b51-97d9-90744e7af110', // Vidéo 7: Fente pied avant sur le step + haltère
  3: '4bf0e733-906f-4a79-ad1c-00e05c769a8c', // Vidéo 9: Extension de jambes tendues tête décollée
  4: 'dacd849a-8eb5-4e35-8e25-0ab47ab370ec', // Vidéo 42: Squat + biceps curl
  5: '925d1dae-79ad-463a-91cd-f594a871427f', // Vidéo 67: Relevé de bassin + 2 pieds sur banc (région cuisses-abdos-fessiers)
  6: '1b5efb73-09a7-4b7d-be1e-0f5a3cc7db03', // Vidéo 46: Gainage planche sur les pieds
  7: '43550373-247d-45e3-8e28-1ad3f3117bc0', // Vidéo 62: Extension de hanche à quatre pattes + élastique
  8: '54d93405-205b-4572-b539-6c510dd74e69', // Vidéo 74: Abduction couché sol avec ballon aux chevilles
}

/**
 * Ordre des vidéos pour le programme Dos-Abdos (DOS ABDOS)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/dos-abdos/dos-abdos.md"
 * 
 * Ordre: 5, 17, 47, 58, 24.1, 3, 14, 46
 */
export const DOS_ABDOS_PROGRAM_ORDER: Record<number, string> = {
  1: 'f0bbd94c-2723-42f0-bff4-e57d8308aa01', // Vidéo 5: Crunch au sol jambes tendues + ballon cheville
  2: 'aeb35301-13e3-4ff2-a204-00cd68834e6b', // Vidéo 17: Tirage poitrine position de fente + 2 bras + élastique
  3: 'ba862f26-6af6-4c71-9b1f-16f15828fbce', // Vidéo 47: Gainage planche au sol + relevé de pieds h
  4: '0ec1e14c-2701-4df3-8067-43d4824b254d', // Vidéo 58: Oiseau position de fente
  5: 'a63d941f-b58c-4be6-90d8-4e1035d87104', // Vidéo 24.1: Gainage oblique au sol couché sur dos + toucher talon
  6: 'b0412a86-a446-46cb-984d-33514147a905', // Vidéo 3: Tirage assis à la poulie basse
  7: 'b1c4e593-1c9b-4055-b3d3-2499b1ef79a6', // Vidéo 14: Crunch ballon f   x
  8: 'ab8111b0-6ecb-46d5-ab02-be629fc0f7e3', // Vidéo 46: Bucheron un genou bosu + main step et haltère
}

/**
 * Ordre des vidéos pour le programme Cuisses-Abdos-Fessiers (CUISSE ABDOS FESSIER)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/cuisses-abdos-fessiers/brule-graisse.md"
 * 
 * Ordre: 14, 7, 9, 42, 67, 46, 62, 74
 */
export const CUISSES_ABDOS_FESSIERS_PROGRAM_ORDER: Record<number, string> = {
  1: 'b2cc15f1-8c5a-47a3-a0e8-2f7703504840', // Vidéo 14: Crunch sur ballon avec pieds au sol
  2: '4145a2a3-f9d6-40fd-b3f7-57653d30ff46', // Vidéo 7: Fente pied avant sur le step + haltère
  3: 'b4e23c94-1842-4cb0-8535-e1ef593f193f', // Vidéo 9: Extension de jambes tendues tête décollée
  4: '602c9a37-4e58-4c25-b252-3507491e5a53', // Vidéo 42: Squat + biceps curl
  5: '925d1dae-79ad-463a-91cd-f594a871427f', // Vidéo 67: Relevé de bassin + 2 pieds sur banc
  6: '867e0a01-56b9-49d5-92ef-8f3e2912461a', // Vidéo 46: Gainage planche sur les pieds
  7: '5e21ea25-6534-4284-9adf-8283ed502020', // Vidéo 62: Extension de hanche à quatre pattes + élastique
  8: '904550df-6447-4165-94fb-fb6425774e40', // Vidéo 74: Abduction couché sol avec ballon aux chevilles
}

/**
 * Ordre des vidéos pour le programme Femmes (SPECIAL FEMME)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/femmes/femmes.md"
 * 
 * Ordre: 26, 23, 2, 19, 13, 16, 73, 78
 */
export const FEMMES_PROGRAM_ORDER: Record<number, string> = {
  1: 'eda539c5-6b4a-42ee-8afc-3952a4d17872', // Vidéo 26: Gainage planche avec tap côté et élastique bande
  2: '2b6bd42a-a4b3-4c31-954f-b4f8d6d3b577', // Vidéo 23: Fente avant et fente arrière
  3: '80729612-2701-49f8-804d-f58103b32b16', // Vidéo 2: Crunch au sol + genoux à 90° x
  4: '24027dbf-4d6f-4d7d-926f-bcca464bf0f8', // Vidéo 19: Squat de profil avec élastique bande
  5: 'bb810c53-5ec8-47e4-b61e-64a0ca35281a', // Vidéo 13: Tirage poitrine debout position de squat + corde
  6: '5c2058f1-f67f-4f8e-9142-d14fdf7622bd', // Vidéo 16: Pullover couché au sol + haltère
  7: '06653b69-8e23-4d3e-9c90-e341c0e25994', // Vidéo 73: Abduction coucher sur le côté avec deux jambes
  8: 'e258be1d-9c81-48a0-a623-ca7d1f53099b', // Vidéo 78: Adduction couché sur le côté
}

/**
 * Ordre des vidéos pour le programme Haute Intensité (SPECIAL HAUTE INTENSITE)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/haute-intensite/haute-intensite.md"
 * 
 * Ordre: 33, 11, 21, 1, 58, 17, 39, 25
 */
export const HAUTE_INTENSITE_PROGRAM_ORDER: Record<number, string> = {
  1: '372e518a-1ae4-42fd-ba3f-bc671a9a5b63', // Vidéo 33: Pompe sur les pieds avec mains écartées
  2: 'c650eddc-e302-4827-bd31-a310b3231c29', // Vidéo 11: Saut latéral skating
  3: '96a58cc4-6425-4334-8cf2-768e02966b21', // Vidéo 21: Fente arrière skating
  4: '475b2f8b-11df-4e36-afac-d0c23d7eddd2', // Vidéo 1: Fente sauté main à la taille
  5: 'a9425bc9-c3e9-4466-a94f-80195d541f5e', // Vidéo 58: Oiseau position de fente
  6: '8fb57e9d-a340-4aaa-a228-b7fa1817c26e', // Vidéo 17: Jumping jack touché sol niveau 1
  7: 'fad66118-c406-4b1b-82d6-8cdaf2c7cd48', // Vidéo 39: Squat avec haltère
  8: '55c5dddd-38eb-4c84-a139-1f5b631278b4', // Vidéo 25: Squat jump f
}

/**
 * Ordre des vidéos pour le programme Homme (SPECIAL HOMME)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/homme/homme.md"
 * 
 * Ordre: 50, 57, 39 (Squat), 33, 3, 39 (Rowing), 13, 5
 */
export const HOMME_PROGRAM_ORDER: Record<number, string> = {
  1: '082b6543-4cfe-4d35-b8d9-58aa97200257', // Vidéo 50: Gainage planche + remonter sur les mains h
  2: '1e0b28e8-447a-47d7-a80a-05fde9128013', // Vidéo 57: Oiseau position de squat
  3: 'cd11edb4-935e-4dcd-aea0-3f61abe9d9ab', // Vidéo 39: Squat avec haltère
  4: 'a0a12c1e-d213-4d00-bb90-51535cbc9446', // Vidéo 33: Pompe sur les pieds avec mains écartées
  5: '425fa2b9-acd5-4f36-9914-f4b5ad3cb6d8', // Vidéo 3: Crunch au sol + ramener de genoux
  6: '83029c9a-bc59-4a0f-97ed-7d5f41f8e56b', // Vidéo 39: Rowing planche + haltère
  7: 'cc610aa2-a422-4f92-af37-57c448ef2b1e', // Vidéo 13: Triceps à plat ventre ballon + haltère
  8: '960be379-ab29-4d04-95c1-4040a8ed2fcf', // Vidéo 5: Biceps debout + barre libre
}

/**
 * Ordre des vidéos pour le programme Jambes (SPECIALE JAMBE)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/jambes/jambes.md"
 * 
 * Ordre: 23, 23.1, 39, 46, 55, 63, 69, 73
 */
export const JAMBES_PROGRAM_ORDER: Record<number, string> = {
  1: '47845003-e734-4b02-9b01-baca36315a60', // Vidéo 23: Fente avant et fente arrière
  2: '19f9cb70-e698-41c4-bd69-9704595a91ac', // Vidéo 23.1: Oblique debout + élastique ou poulie milieu h
  3: 'd1c041ca-a7c4-4a78-8406-451f854cc8e5', // Vidéo 39: Squat avec haltère
  4: 'a7cce2e1-eb68-4053-a9a0-b4ae8a121449', // Vidéo 46: Gainage planche sur les pieds h    x
  5: '5109c556-461c-4acf-8a6c-209a932eb09c', // Vidéo 55: Squat statique contre le mur
  6: '156e1ea9-f814-4275-b8e1-ae00340a98b4', // Vidéo 63: Extension de hanche à quatre pattes avec genoux fléchit + élastique
  7: 'e4f8c14e-b748-40d7-96e6-8083b2b65d4e', // Vidéo 69: Ischio leg curl + 2 pieds ballon
  8: 'bacb6b53-17a3-4654-9c5e-41b0fd6d75df', // Vidéo 73: Abduction coucher sur le côté avec deux jambes
}

/**
 * Ordre des vidéos pour le programme Réhabilitation Dos (SPECIAL REHABILITATION DU DOS)
 * Basé sur le fichier: "Dossier Cliente/Video/programmes-predefinis/rehabilitation-dos/rehabilitation-dos.md"
 * 
 * Ordre: 80, 25, 66, 63, 18, 61, 1, 17
 */
export const REHABILITATION_DOS_PROGRAM_ORDER: Record<number, string> = {
  1: '1c8ea87b-d165-46d9-b960-7260c1494d77', // Vidéo 80: Gainage assis sur le ballon + relevé de jambe
  2: 'f980172f-ad3c-4b47-acd1-0144638c9dc8', // Vidéo 25: Tirage bras tendu en appui sur le ballon
  3: '17c3df87-5e1b-468a-9b74-b31fe4ff5b71', // Vidéo 66: Bascule du bassin sur le ballon assis ballon
  4: '2c2bc066-e121-478f-920f-6c9e8a98f6e7', // Vidéo 63: Superman couché au sol
  5: '25439c37-17cc-45b7-bd64-0d44fef39590', // Vidéo 18: Dos couché sol +genoux sur la poitrine
  6: '01fcb7b5-9688-4c3d-983c-b21cd0ca6ac1', // Vidéo 61: Adduction des omoplates contre mur
  7: '1bd80754-5e78-4365-88b9-800bcc67741d', // Vidéo 1: Rotation externe des épaules assis ballon + élastique
  8: '8c73019c-1d58-42f8-91b6-cf8a76d39dfd', // Vidéo 17: Dos position de l'enfant
}

/**
 * Mapping des régions vers leurs configurations d'ordre
 */
const PROGRAM_ORDERS: Record<string, Record<number, string>> = {
  'machine': MACHINE_PROGRAM_ORDER,
  'abdos': ABDOS_PROGRAM_ORDER,
  'brule-graisse': BRULE_GRAISSE_PROGRAM_ORDER,
  'cuisses-abdos': CUISSES_ABDOS_PROGRAM_ORDER,
  'cuisses-abdos-fessiers': CUISSES_ABDOS_FESSIERS_PROGRAM_ORDER,
  'dos-abdos': DOS_ABDOS_PROGRAM_ORDER,
  'femmes': FEMMES_PROGRAM_ORDER,
  'haute-intensite': HAUTE_INTENSITE_PROGRAM_ORDER,
  'homme': HOMME_PROGRAM_ORDER,
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
