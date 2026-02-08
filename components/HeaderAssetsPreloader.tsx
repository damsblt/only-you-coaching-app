'use client'

import { useEffect } from 'react'

// Configuration S3
const S3_BUCKET = 'only-you-coaching'
const S3_REGION = 'eu-north-1'

// Liste de toutes les images et vidéos utilisées dans les headers
const HEADER_ASSETS = {
  images: [
    'Photos/Illustration/brooke-lark-jUPOXXRNdcA-unsplash.jpg',
    'Photos/Illustration/element5-digital-OBbliBNuJlk-unsplash_edited.jpg',
    'Photos/Illustration/reverie-calme-femme-portant-ecouteurs-se-detendre-ecouter-livre-audio-dans-plantes-vertes-exotiques-surround.jpg',
    'Photos/Illustration/balanced-stone.jpg',
    'Photos/Training/ok (8).JPG',
  ],
  videos: [
    'Photos/Illustration/5033410_Fitness_Beach_Exercise_1920x1080 (1) (1).mp4',
    'Photos/Illustration/1860009_Lunges_Resistance Training_Exercise_1920x1080 (1).mp4',
  ]
}

/**
 * Génère directement l'URL publique S3 côté client
 * Évite un aller-retour API inutile puisque les URLs sont publiques
 */
function getDirectS3Url(s3Key: string): string {
  const segments = s3Key.split('/')
  const encodedSegments = segments.map(segment => {
    try {
      const decoded = decodeURIComponent(segment)
      return encodeURIComponent(decoded)
    } catch {
      return encodeURIComponent(segment)
    }
  })
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${encodedSegments.join('/')}`
}

function preloadImage(s3Key: string): void {
  const rawUrl = getDirectS3Url(s3Key)
  
  // Utiliser l'optimiseur d'images Next.js pour précharger en webp/avif optimisé
  // au lieu de l'image originale brute (beaucoup plus légère)
  const optimizedUrl = `/_next/image?url=${encodeURIComponent(rawUrl)}&w=1920&q=85`
  
  // Précharger l'image optimisée dans le navigateur avec priorité haute
  const img = new window.Image()
  img.fetchPriority = 'high'
  img.src = optimizedUrl
  
  // Utiliser aussi un link preload pour optimiser encore plus
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = optimizedUrl
  link.fetchPriority = 'high'
  link.type = 'image/webp'
  document.head.appendChild(link)
}

function preloadVideo(s3Key: string): void {
  const url = getDirectS3Url(s3Key)
  
  // Précharger la vidéo dans le navigateur (méta-données seulement)
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.src = url
}

export default function HeaderAssetsPreloader() {
  useEffect(() => {
    // Précharger immédiatement, sans délai
    // Images en priorité haute
    HEADER_ASSETS.images.forEach(s3Key => {
      try {
        preloadImage(s3Key)
      } catch (error) {
        console.warn(`Failed to preload image ${s3Key}:`, error)
      }
    })
    
    // Vidéos en priorité normale
    HEADER_ASSETS.videos.forEach(s3Key => {
      try {
        preloadVideo(s3Key)
      } catch (error) {
        console.warn(`Failed to preload video ${s3Key}:`, error)
      }
    })
  }, [])

  // Ce composant ne rend rien
  return null
}
