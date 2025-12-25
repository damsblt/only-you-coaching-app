import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get all audios using direct SQL query with template literal
    const allAudios = await sql`SELECT id, title, thumbnail, s3key, category, "isPublished", "createdAt" FROM "audios"`

    if (!allAudios || allAudios.length === 0) {
      return NextResponse.json({ 
        message: 'No audios found',
        deleted: 0,
        kept: 0
      })
    }

    if (!allAudios || allAudios.length === 0) {
      return NextResponse.json({ 
        message: 'No audios found',
        deleted: 0,
        kept: 0
      })
    }

    // Group by title (normalized) and s3key to find duplicates
    const duplicates: { [key: string]: any[] } = {}
    const toDelete: string[] = []
    const toKeep: string[] = []

    // Normalize title for comparison (remove extra spaces, convert to lowercase)
    const normalizeTitle = (title: string) => {
      return title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, '') // Keep French accents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for comparison
    }

    // Check if audio has a real thumbnail (not default/placeholder)
    const hasRealThumbnail = (audio: any) => {
      const thumb = audio.thumbnail
      if (!thumb || thumb.trim() === '') return false
      // Exclude default placeholders
      if (thumb.includes('unsplash.com')) return false
      if (thumb.includes('placeholder')) return false
      // Must be an S3 URL or valid URL
      return thumb.startsWith('http') || thumb.startsWith('https')
    }

    // Group audios by normalized title
    const byTitle: { [key: string]: any[] } = {}
    for (const audio of allAudios) {
      const normalizedTitle = normalizeTitle(audio.title || '')
      if (!byTitle[normalizedTitle]) {
        byTitle[normalizedTitle] = []
      }
      byTitle[normalizedTitle].push(audio)
    }

    // Find duplicates and decide which to keep
    for (const [normalizedTitle, audios] of Object.entries(byTitle)) {
      if (audios.length > 1) {
        // Sort: first by thumbnail (has real thumbnail first), then by creation date (newest first)
        const sorted = audios.sort((a, b) => {
          const aHasThumbnail = hasRealThumbnail(a)
          const bHasThumbnail = hasRealThumbnail(b)
          
          if (aHasThumbnail && !bHasThumbnail) return -1
          if (!aHasThumbnail && bHasThumbnail) return 1
          
          // If both have or both don't have thumbnails, keep the newest
          const aDate = new Date(a.createdAt || 0).getTime()
          const bDate = new Date(b.createdAt || 0).getTime()
          return bDate - aDate
        })

        // Keep the first one (best candidate)
        const toKeepId = sorted[0].id
        toKeep.push(toKeepId)
        
        // Mark others for deletion
        for (let i = 1; i < sorted.length; i++) {
          toDelete.push(sorted[i].id)
        }

        duplicates[normalizedTitle] = {
          total: sorted.length,
          kept: sorted[0],
          deleted: sorted.slice(1).map(a => ({ id: a.id, title: a.title, thumbnail: a.thumbnail }))
        }
      } else {
        // No duplicates, keep it
        toKeep.push(audios[0].id)
      }
    }

    // Also check for duplicates by s3key
    const byS3Key: { [key: string]: any[] } = {}
    for (const audio of allAudios) {
      const s3key = audio.s3key || ''
      if (s3key && s3key.trim() !== '') {
        if (!byS3Key[s3key]) {
          byS3Key[s3key] = []
        }
        byS3Key[s3key].push(audio)
      }
    }

    // Find duplicates by s3key
    for (const [s3key, audios] of Object.entries(byS3Key)) {
      if (audios.length > 1) {
        // Sort: first by thumbnail, then by creation date
        const sorted = audios.sort((a, b) => {
          const aHasThumbnail = hasRealThumbnail(a)
          const bHasThumbnail = hasRealThumbnail(b)
          
          if (aHasThumbnail && !bHasThumbnail) return -1
          if (!aHasThumbnail && bHasThumbnail) return 1
          
          const aDate = new Date(a.createdAt || 0).getTime()
          const bDate = new Date(b.createdAt || 0).getTime()
          return bDate - aDate
        })

        // Keep the first one if not already marked for deletion
        const toKeepId = sorted[0].id
        if (!toDelete.includes(toKeepId)) {
          toKeep.push(toKeepId)
        }
        
        // Mark others for deletion (if not already marked to keep)
        for (let i = 1; i < sorted.length; i++) {
          const id = sorted[i].id
          if (!toKeep.includes(id) && !toDelete.includes(id)) {
            toDelete.push(id)
          }
        }
      }
    }

    // Remove duplicates from toDelete array (in case an audio was marked both ways)
    const uniqueToDelete = Array.from(new Set(toDelete)).filter(id => !toKeep.includes(id))

    // Delete duplicates
    let deletedCount = 0
    const errors: string[] = []

    for (const id of uniqueToDelete) {
      try {
        // Use SQL DELETE directly with template literal
        await sql`DELETE FROM "audios" WHERE "id" = ${id}`
        deletedCount++
      } catch (deleteError: any) {
        errors.push(`Failed to delete ${id}: ${deleteError?.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `Cleanup completed. ${deletedCount} duplicates deleted.`,
      deleted: deletedCount,
      kept: toKeep.length,
      totalBefore: allAudios.length,
      totalAfter: allAudios.length - deletedCount,
      duplicatesFound: Object.keys(duplicates).length,
      duplicates: duplicates,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error cleaning up duplicates:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup duplicates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

