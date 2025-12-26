import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test simple videos_new...')
    
    // Test très simple : juste compter les vidéos
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = true 
        AND "videoType" = 'PROGRAMMES'
        AND region = 'abdos'
    `)
    
    console.log('✅ Requête réussie!')
    console.log('Count:', result.rows[0].count)
    
    // Test avec quelques colonnes
    const sample = await pool.query(`
      SELECT id, title, region, "videoType", "isPublished"
      FROM videos_new 
      WHERE "isPublished" = true 
        AND "videoType" = 'PROGRAMMES'
        AND region = 'abdos'
      LIMIT 5
    `)
    
    return NextResponse.json({
      success: true,
      count: parseInt(result.rows[0].count),
      sample: sample.rows
    })
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}












