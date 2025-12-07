#!/usr/bin/env node

/**
 * Script pour corriger la structure de la table users dans Supabase
 * Ce script exécute les corrections SQL nécessaires
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixUsersTable() {
  console.log('🔧 Correction de la structure de la table users...')
  
  try {
    // Vérifier d'abord la structure actuelle
    console.log('\n📋 Structure actuelle de la table users:')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
    
    if (columnsError) {
      console.log('   (Impossible de récupérer la structure - normal si la fonction n\'existe pas)')
    } else {
      console.log('   Colonnes:', columns)
    }
    
    // Exécuter les corrections SQL
    const corrections = [
      // Ajouter les colonnes manquantes
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50) DEFAULT 'essentiel'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      
      // Créer des index
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_subscription_id ON users(subscription_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_plan_id ON users(plan_id)`
    ]
    
    console.log('\n🔨 Exécution des corrections...')
    
    for (const sql of corrections) {
      try {
        console.log(`   Exécution: ${sql.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql })
        
        if (error) {
          console.log(`   ⚠️  ${error.message}`)
        } else {
          console.log(`   ✅ Succès`)
        }
      } catch (err) {
        console.log(`   ❌ Erreur: ${err.message}`)
      }
    }
    
    // Test de création d'un utilisateur
    console.log('\n🧪 Test de création d\'utilisateur...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        email: testEmail,
        full_name: 'Test User',
        role: 'USER',
        plan_id: 'essentiel',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (testError) {
      console.log(`   ❌ Erreur lors du test: ${testError.message}`)
    } else {
      console.log(`   ✅ Utilisateur de test créé avec succès`)
      
      // Nettoyer le test
      await supabase
        .from('users')
        .delete()
        .eq('id', testUser.id)
      
      console.log(`   🧹 Utilisateur de test supprimé`)
    }
    
    console.log('\n✅ Correction terminée !')
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

// Vérifier si crypto est disponible
if (typeof crypto === 'undefined') {
  console.error('❌ crypto.randomUUID() n\'est pas disponible dans cette version de Node.js')
  console.error('   Utilisez Node.js 19+ ou installez le module crypto')
  process.exit(1)
}

fixUsersTable().catch(console.error)
