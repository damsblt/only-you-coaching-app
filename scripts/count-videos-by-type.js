#!/usr/bin/env node
/**
 * Script pour compter les vidéos par type dans Neon
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function countVideos() {
  try {
    console.log('🔍 Comptage des vidéos dans Neon...\n')

    // Total publiées
    const totalResult = await sql`
      SELECT COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = true
    `
    const total = parseInt(totalResult[0]?.count || 0)

    // Par videoType
    const byTypeResult = await sql`
      SELECT "videoType", COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = true 
      GROUP BY "videoType"
      ORDER BY "videoType"
    `

    // Non publiées
    const unpublishedResult = await sql`
      SELECT COUNT(*) as count 
      FROM videos_new 
      WHERE "isPublished" = false OR "isPublished" IS NULL
    `
    const unpublished = parseInt(unpublishedResult[0]?.count || 0)

    console.log('📊 Résultats:')
    console.log(`   Total publiées: ${total}`)
    console.log(`   Non publiées: ${unpublished}`)
    console.log(`   Total toutes: ${total + unpublished}\n`)

    console.log('📈 Par type (publiées uniquement):')
    const countsByType = {}
    byTypeResult.forEach((row) => {
      const count = parseInt(row.count)
      countsByType[row.videoType] = count
      console.log(`   ${row.videoType}: ${count}`)
    })

    console.log('\n✅ Détail:')
    console.log(`   MUSCLE_GROUPS: ${countsByType['MUSCLE_GROUPS'] || 0}`)
    console.log(`   PROGRAMMES: ${countsByType['PROGRAMMES'] || 0}`)

    // Vérification
    const expectedMuscleGroups = 187
    const expectedProgrammes = 86
    const actualMuscleGroups = countsByType['MUSCLE_GROUPS'] || 0
    const actualProgrammes = countsByType['PROGRAMMES'] || 0

    console.log('\n🔍 Vérification:')
    if (actualMuscleGroups === expectedMuscleGroups) {
      console.log(`   ✅ MUSCLE_GROUPS: ${actualMuscleGroups} (correct)`)
    } else {
      console.log(`   ❌ MUSCLE_GROUPS: ${actualMuscleGroups} (attendu: ${expectedMuscleGroups})`)
    }

    if (actualProgrammes === expectedProgrammes) {
      console.log(`   ✅ PROGRAMMES: ${actualProgrammes} (correct)`)
    } else {
      console.log(`   ❌ PROGRAMMES: ${actualProgrammes} (attendu: ${expectedProgrammes})`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

countVideos()







