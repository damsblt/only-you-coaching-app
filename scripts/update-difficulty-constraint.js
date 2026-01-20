#!/usr/bin/env node
/**
 * Script pour mettre à jour la contrainte CHECK sur la colonne difficulty
 * pour accepter les valeurs en majuscules (BEGINNER, INTERMEDIATE, ADVANCED)
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function updateDifficultyConstraint() {
  try {
    console.log('🔧 Mise à jour de la contrainte CHECK sur la colonne difficulty...\n')
    
    // 1. Supprimer l'ancienne contrainte
    console.log('📝 Suppression de l\'ancienne contrainte...')
    try {
      await sql`
        ALTER TABLE videos_new 
        DROP CONSTRAINT IF EXISTS videos_new_difficulty_check
      `
      console.log('✅ Ancienne contrainte supprimée\n')
    } catch (error) {
      console.log(`⚠️  Erreur lors de la suppression (peut-être n'existe pas): ${error.message}\n`)
    }
    
    // 2. Créer une nouvelle contrainte qui accepte toutes les variantes
    console.log('📝 Création de la nouvelle contrainte...')
    await sql`
      ALTER TABLE videos_new 
      ADD CONSTRAINT videos_new_difficulty_check 
      CHECK (difficulty IN (
        'debutant', 
        'débutant',
        'intermediaire', 
        'intermédiaire',
        'avance', 
        'avancé',
        'beginner', 
        'BEGINNER',
        'intermediate', 
        'INTERMEDIATE',
        'advanced',
        'ADVANCED'
      ))
    `
    console.log('✅ Nouvelle contrainte créée\n')
    
    // 3. Vérifier que la contrainte fonctionne
    console.log('🔍 Vérification de la contrainte...')
    const testResult = await sql`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'videos_new'::regclass
        AND conname = 'videos_new_difficulty_check'
    `
    
    if (testResult && testResult.length > 0) {
      console.log('✅ Contrainte vérifiée:')
      console.log(`   ${testResult[0].constraint_definition}\n`)
    }
    
    console.log('='.repeat(100))
    console.log('✅ MODIFICATION TERMINÉE AVEC SUCCÈS')
    console.log('='.repeat(100))
    console.log('La colonne difficulty accepte maintenant:')
    console.log('   - debutant, débutant, beginner, BEGINNER')
    console.log('   - intermediaire, intermédiaire, intermediate, INTERMEDIATE')
    console.log('   - avance, avancé, advanced, ADVANCED')
    console.log('='.repeat(100))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

updateDifficultyConstraint()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
