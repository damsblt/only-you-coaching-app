import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json({ error: 'Database client not initialized' }, { status: 500 })
    }

    // Count total videos (published)
    const totalResult = await sql`
      SELECT COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = true
    `
    const total = totalResult[0]?.count || 0

    // Count by videoType (published only)
    const byTypeResult = await sql`
      SELECT "videoType", COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = true 
      GROUP BY "videoType"
      ORDER BY "videoType"
    `

    // Count unpublished
    const unpublishedResult = await sql`
      SELECT COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = false OR "isPublished" IS NULL
    `
    const unpublished = unpublishedResult[0]?.count || 0

    const countsByType: Record<string, number> = {}
    byTypeResult.forEach((row: any) => {
      countsByType[row.videoType] = parseInt(row.count)
    })

    return NextResponse.json({
      total: parseInt(total),
      byType: countsByType,
      unpublished: parseInt(unpublished),
      breakdown: {
        MUSCLE_GROUPS: countsByType['MUSCLE_GROUPS'] || 0,
        PROGRAMMES: countsByType['PROGRAMMES'] || 0
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 })
  }
}


