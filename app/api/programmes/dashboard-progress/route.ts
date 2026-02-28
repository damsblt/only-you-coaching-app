import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sortVideosByProgramOrder } from '@/lib/program-orders'

// Régions des programmes prédéfinis (alignées avec app/programmes/page.tsx)
const PROGRAM_REGIONS = [
  { id: 'abdos', displayName: 'Spécial abdominaux' },
  { id: 'brule-graisse', displayName: 'Brûle Graisse' },
  { id: 'haute-intensite', displayName: 'Haute Intensité' },
  { id: 'machine', displayName: 'Spécial machines' },
  { id: 'rehabilitation-dos', displayName: 'Spécial dos + réhabilitation' },
  { id: 'cuisses-abdos-fessiers', displayName: 'Cuisse, Abdos, Fessier' },
  { id: 'dos-abdos', displayName: 'Spécial dos et abdominaux' },
  { id: 'femmes', displayName: 'Spécifique femme' },
  { id: 'homme', displayName: 'Spécifique homme' },
  { id: 'jambes', displayName: 'Spécial jambes' },
] as const

// GET /api/programmes/dashboard-progress - Récupère la progression de tous les programmes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const regionsProgress = await Promise.all(
      PROGRAM_REGIONS.map(async (regionConfig) => {
        const region = regionConfig.id

        // Récupérer les vidéos du programme
        const videosResult = await db
          .from('videos_new')
          .select('id')
          .eq('region', region)
          .eq('videoType', 'PROGRAMMES')
          .eq('isPublished', true)
          .execute()

        if (videosResult.error || !videosResult.data?.length) {
          return {
            region,
            displayName: regionConfig.displayName,
            totalVideos: 0,
            completedCount: 0,
            nextAvailableVideoIndex: 0,
            isComplete: false,
            progressPercent: 0,
          }
        }

        const videos = videosResult.data as Array<{ id: string }>
        const sortedVideos = sortVideosByProgramOrder(videos, region)
        const videoIds = sortedVideos.map((v) => v.id)

        // Récupérer la progression pour ces vidéos
        const videoIdsAsStrings = videoIds.map((id) => String(id))
        const progressResult = await db
          .from('user_video_progress')
          .select('*')
          .eq('user_id', userId)
          .in('video_id', videoIdsAsStrings)
          .execute()

        const progressMap: Record<string, { completed: boolean }> = {}
        let completedCount = 0

        if (progressResult.data) {
          for (const p of progressResult.data) {
            progressMap[p.video_id] = { completed: p.completed || false }
            if (p.completed) completedCount++
          }
        }

        // Index de la prochaine vidéo à faire
        let nextAvailableVideoIndex = 0
        for (let i = 0; i < videoIds.length; i++) {
          const vid = progressMap[videoIds[i]]
          if (!vid?.completed) {
            nextAvailableVideoIndex = i
            break
          }
          if (i === videoIds.length - 1) {
            nextAvailableVideoIndex = videoIds.length
          }
        }

        const totalVideos = videoIds.length
        const isComplete = completedCount === totalVideos && totalVideos > 0
        const progressPercent =
          totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0

        return {
          region,
          displayName: regionConfig.displayName,
          totalVideos,
          completedCount,
          nextAvailableVideoIndex,
          isComplete,
          progressPercent,
        }
      })
    )

    const totalCompleted = regionsProgress.reduce((s, r) => s + r.completedCount, 0)
    const totalVideos = regionsProgress.reduce((s, r) => s + r.totalVideos, 0)
    const completedPrograms = regionsProgress.filter((r) => r.isComplete).length

    return NextResponse.json({
      regions: regionsProgress,
      summary: {
        totalVideos,
        totalCompleted,
        completedPrograms,
        totalPrograms: PROGRAM_REGIONS.length,
        overallProgressPercent:
          totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0,
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching dashboard progress:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
