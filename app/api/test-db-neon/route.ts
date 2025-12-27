import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test de connexion Neon...')
    
    // Test simple de connexion
    const result = await pool.query('SELECT version(), current_database(), current_user')
    
    console.log('✅ Connexion réussie!')
    console.log('Result:', result.rows[0])
    
    // Vérifier si la table existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'videos_new'
      ) as exists;
    `)
    
    const tableExists = tableCheck.rows[0].exists
    
    let tableInfo = null
    if (tableExists) {
      const count = await pool.query('SELECT COUNT(*) as count FROM videos_new')
      tableInfo = {
        exists: true,
        rowCount: parseInt(count.rows[0].count)
      }
    } else {
      // Lister les tables existantes
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `)
      tableInfo = {
        exists: false,
        availableTables: tables.rows.map(t => t.table_name)
      }
    }
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      postgresVersion: result.rows[0].version,
      videos_new_table: tableInfo
    })
  } catch (error: any) {
    console.error('❌ Erreur de test:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: String(error)
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
















