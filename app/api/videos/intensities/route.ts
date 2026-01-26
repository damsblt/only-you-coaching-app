import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/videos/intensities
 * Returns unique intensity values from MUSCLE_GROUPS videos
 */
export async function GET(request: NextRequest) {
  try {
    // Get unique intensity values from MUSCLE_GROUPS videos
    const { data, error } = await db
      .from('videos_new')
      .select('intensity')
      .eq('videoType', 'MUSCLE_GROUPS')
      .eq('isPublished', true)
      .execute()
    
    if (error) {
      console.error('Error fetching intensities:', error)
      return NextResponse.json(
        { error: 'Failed to fetch intensities' },
        { status: 500 }
      )
    }
    
    // Filter out null/empty values in JavaScript (since .not() is not available)
    const validData = (data || []).filter(v => v.intensity !== null && v.intensity !== undefined && v.intensity !== '')
    
    // Extract unique intensity values
    const uniqueIntensities = Array.from(
      new Set(
        validData.map(v => v.intensity.trim())
      )
    )
    
    // Ordre spécifique pour l'affichage (selon les 7 niveaux standardisés)
    const order = [
      'Tout niveau',
      'Débutant',
      'Débutant et intermédiaire',
      'Intermédiaire',
      'Intermédiaire et avancé',
      'Avancé',
      'Très Avancé'
    ]
    
    // Trier selon l'ordre spécifié, puis alphabétiquement pour les autres
    const sortedIntensities = uniqueIntensities.sort((a, b) => {
      const indexA = order.indexOf(a)
      const indexB = order.indexOf(b)
      
      // Si les deux sont dans l'ordre spécifié
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      // Si seulement A est dans l'ordre, il vient en premier
      if (indexA !== -1) return -1
      // Si seulement B est dans l'ordre, il vient en premier
      if (indexB !== -1) return 1
      // Sinon, tri alphabétique
      return a.localeCompare(b)
    })
    
    return NextResponse.json(sortedIntensities)
  } catch (error) {
    console.error('Error in intensities API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
