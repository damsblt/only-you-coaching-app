#!/usr/bin/env node
/**
 * Script pour exécuter la migration qui ajoute la colonne videoNumber
 * 
 * Usage: node scripts/run-migration-videoNumber.js
 */

import { neon } from '@neondatabase/serverless'
import ws from 'ws'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Configure Neon for Node.js
if (typeof window === 'undefined') {
  const { neonConfig } = await import('@neondatabase/serverless')
  neonConfig.webSocketConstructor = ws
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function runMigration() {
  console.log('🔄 Exécution de la migration : Ajout de la colonne videoNumber\n')
  
  try {
    // Lire le fichier SQL
    const sqlFile = path.join(process.cwd(), 'scripts', 'add-videoNumber-column.sql')
    const sqlContent = await fs.readFile(sqlFile, 'utf-8')
    
    // Exécuter la migration
    // Note: Neon ne supporte pas directement les blocs DO $$, donc on va faire les commandes séparément
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'videos_new' 
      AND column_name = 'videoNumber'
    `
    
    if (checkColumn && checkColumn.length > 0) {
      console.log('✅ La colonne videoNumber existe déjà\n')
      
      // Vérifier les index
      const checkIndex = await sql`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'videos_new' 
        AND indexname = 'idx_videos_new_video_number'
      `
      
      if (!checkIndex || checkIndex.length === 0) {
        console.log('📋 Création des index...\n')
        await sql`CREATE INDEX IF NOT EXISTS idx_videos_new_video_number ON videos_new("videoNumber")`
        await sql`CREATE INDEX IF NOT EXISTS idx_videos_new_video_number_region ON videos_new("videoNumber", region)`
        console.log('✅ Index créés\n')
      } else {
        console.log('✅ Les index existent déjà\n')
      }
    } else {
      console.log('📋 Ajout de la colonne videoNumber...\n')
      
      // Ajouter la colonne
      await sql`
        ALTER TABLE videos_new 
        ADD COLUMN "videoNumber" DECIMAL(10, 2)
      `
      
      console.log('✅ Colonne ajoutée\n')
      
      // Créer les index
      console.log('📋 Création des index...\n')
      await sql`CREATE INDEX IF NOT EXISTS idx_videos_new_video_number ON videos_new("videoNumber")`
      await sql`CREATE INDEX IF NOT EXISTS idx_videos_new_video_number_region ON videos_new("videoNumber", region)`
      console.log('✅ Index créés\n')
    }
    
    // Vérifier la colonne
    const verify = await sql`
      SELECT 
        column_name, 
        data_type, 
        numeric_precision, 
        numeric_scale
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'videos_new' 
      AND column_name = 'videoNumber'
    `
    
    if (verify && verify.length > 0) {
      const col = verify[0]
      console.log('✅ Vérification de la colonne :')
      console.log(`   - Nom : ${col.column_name}`)
      console.log(`   - Type : ${col.data_type}`)
      console.log(`   - Précision : ${col.numeric_precision}`)
      console.log(`   - Échelle : ${col.numeric_scale}\n`)
    }
    
    console.log('✅ Migration terminée avec succès!\n')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

runMigration()
