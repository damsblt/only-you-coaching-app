'use client'

import { useEffect } from 'react'

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

// Cache global pour les URLs S3 (partagé avec S3Image et PageHeader)
declare global {
  var s3ImageCache: Map<string, { url: string; timestamp: number }> | undefined
  var s3VideoCache: Map<string, { url: string; timestamp: number }> | undefined
}

// Initialiser les caches globaux s'ils n'existent pas
if (typeof window !== 'undefined') {
  if (!globalThis.s3ImageCache) {
    globalThis.s3ImageCache = new Map()
  }
  if (!globalThis.s3VideoCache) {
    globalThis.s3VideoCache = new Map()
  }
}

async function preloadS3Image(s3Key: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const apiUrl = `${baseUrl}/api/gallery/specific-photo?key=${encodeURIComponent(s3Key)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'default'
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.url && globalThis.s3ImageCache) {
        globalThis.s3ImageCache.set(s3Key, { url: data.url, timestamp: Date.now() })
        // Précharger l'image dans le navigateur
        const img = new Image()
        img.src = data.url
      }
    }
  } catch (error) {
    console.warn(`Failed to preload image ${s3Key}:`, error)
  }
}

async function preloadS3Video(s3Key: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const apiUrl = `${baseUrl}/api/videos/s3-video?key=${encodeURIComponent(s3Key)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'default'
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.url && globalThis.s3VideoCache) {
        globalThis.s3VideoCache.set(s3Key, { url: data.url, timestamp: Date.now() })
        // Précharger la vidéo dans le navigateur (méta-données seulement)
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = data.url
      }
    }
  } catch (error) {
    console.warn(`Failed to preload video ${s3Key}:`, error)
  }
}

export default function HeaderAssetsPreloader() {
  useEffect(() => {
    // Attendre que le DOM soit prêt
    const preloadAssets = async () => {
      // Délai court pour ne pas bloquer le rendu initial
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Précharger toutes les images en parallèle
      const imagePromises = HEADER_ASSETS.images.map(s3Key => 
        preloadS3Image(s3Key).catch(() => {}) // Ignorer les erreurs silencieusement
      )
      
      // Précharger toutes les vidéos en parallèle
      const videoPromises = HEADER_ASSETS.videos.map(s3Key => 
        preloadS3Video(s3Key).catch(() => {}) // Ignorer les erreurs silencieusement
      )
      
      // Exécuter en parallèle mais ne pas bloquer
      Promise.all([...imagePromises, ...videoPromises]).catch(() => {})
    }
    
    preloadAssets()
  }, [])

  // Ce composant ne rend rien
  return null
}




