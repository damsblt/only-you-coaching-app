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
    // Toujours utiliser l'origine actuelle pour éviter les problèmes CORS
    const baseUrl = window.location.origin
    const apiUrl = `${baseUrl}/api/gallery/specific-photo?key=${encodeURIComponent(s3Key)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'force-cache', // Utiliser le cache agressivement
      priority: 'high' as RequestPriority
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.url && globalThis.s3ImageCache) {
        globalThis.s3ImageCache.set(s3Key, { url: data.url, timestamp: Date.now() })
        
        // Précharger l'image dans le navigateur avec priorité haute
        const img = new Image()
        img.fetchPriority = 'high'
        img.src = data.url
        
        // Utiliser aussi un link preload pour optimiser encore plus
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = data.url
        link.fetchPriority = 'high'
        document.head.appendChild(link)
      }
    }
  } catch (error) {
    console.warn(`Failed to preload image ${s3Key}:`, error)
  }
}

async function preloadS3Video(s3Key: string): Promise<void> {
  try {
    // Toujours utiliser l'origine actuelle pour éviter les problèmes CORS
    const baseUrl = window.location.origin
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
    // Précharger immédiatement, sans délai
    const preloadAssets = () => {
      // Précharger toutes les images en parallèle (priorité haute)
      const imagePromises = HEADER_ASSETS.images.map(s3Key => 
        preloadS3Image(s3Key).catch(() => {}) // Ignorer les erreurs silencieusement
      )
      
      // Précharger toutes les vidéos en parallèle (priorité normale)
      const videoPromises = HEADER_ASSETS.videos.map(s3Key => 
        preloadS3Video(s3Key).catch(() => {}) // Ignorer les erreurs silencieusement
      )
      
      // Exécuter en parallèle mais ne pas bloquer
      Promise.all([...imagePromises, ...videoPromises]).catch(() => {})
    }
    
    // Démarrer immédiatement le préchargement
    preloadAssets()
  }, [])

  // Ce composant ne rend rien
  return null
}







