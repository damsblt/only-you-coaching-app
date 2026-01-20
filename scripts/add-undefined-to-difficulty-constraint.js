#!/usr/bin/env node
/**
 * Script pour ajouter "indéfini" aux valeurs acceptées pour la colonne difficulty
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL manquant dans .env.local')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function addUndefinedToDifficultyConstraint() {
  try {
    console.log('🔧 Ajout de "indéfini" à la contrainte CHECK sur difficulty...\n')
    
    // 1. Supprimer l'ancienne contrainte
    console.log('📝 Suppression de l\'ancienne contrainte...')
    await sql`
      ALTER TABLE videos_new 
      DROP CONSTRAINT IF EXISTS videos_new_difficulty_check
    `
    console.log('✅ Ancienne contrainte supprimée\n')
    
    // 2. Créer une nouvelle contrainte qui accepte "indéfini"
    console.log('📝 Création de la nouvelle contrainte avec "indéfini"...')
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
        'ADVANCED',
        'indéfini'
      ))
    `
    console.log('✅ Nouvelle contrainte créée\n')
    
    // 3. Vérifier
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
      console.log('✅ Contrainte vérifiée')
    }
    
    console.log('='.repeat(80))
    console.log('✅ MODIFICATION TERMINÉE')
    console.log('='.repeat(80))
    console.log('La colonne difficulty accepte maintenant aussi: "indéfini"')
    console.log('='.repeat(80))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

addUndefinedToDifficultyConstraint()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
