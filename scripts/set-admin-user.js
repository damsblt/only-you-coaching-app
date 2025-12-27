#!/usr/bin/env node

/**
 * Script pour définir un utilisateur comme admin dans Neon/Supabase
 * Usage: node scripts/set-admin-user.js <email>
 * 
 * Met à jour l'utilisateur avec:
 * - Role: ADMIN
 * - Accès complet à tout le contenu
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  console.error('\n💡 Assurez-vous que ces variables sont définies dans .env.local')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Email de l'utilisateur à promouvoir admin
const userEmail = process.argv[2] || 'damien.balet@me.com'

async function setAdminUser() {
  console.log('👤 Promotion de l\'utilisateur en admin...')
  console.log(`   Email: ${userEmail}`)
  console.log('')
  
  try {
    // 1. Trouver l'utilisateur dans Supabase Auth
    console.log('🔍 Recherche de l\'utilisateur dans Auth...')
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Erreur lors de la recherche:', listError.message)
      throw listError
    }
    
    const authUser = authUsers.users.find(u => u.email === userEmail)
    
    if (!authUser) {
      console.error(`❌ Utilisateur ${userEmail} non trouvé dans Supabase Auth`)
      console.error('\n💡 Vérifiez que l\'utilisateur existe et que l\'email est correct')
      process.exit(1)
    }
    
    console.log(`   ✅ Utilisateur trouvé dans Auth (ID: ${authUser.id})`)
    
    // 2. Vérifier/Créer dans la table users
    console.log('💾 Vérification dans la table users...')
    const { data: existingDbUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('   ❌ Erreur lors de la vérification:', checkError)
      throw checkError
    }
    
    if (existingDbUser) {
      // Mettre à jour le rôle
      console.log('   📝 Mise à jour du rôle à ADMIN...')
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role: 'ADMIN',
          updated_at: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('   ❌ Erreur lors de la mise à jour:', updateError)
        throw updateError
      }
      
      console.log('   ✅ Rôle mis à jour avec succès!')
      console.log('\n📊 Utilisateur admin:')
      console.log(`   ID: ${updatedUser.id}`)
      console.log(`   Email: ${updatedUser.email}`)
      console.log(`   Role: ${updatedUser.role}`)
      console.log(`   Nom: ${updatedUser.name || updatedUser.full_name || 'N/A'}`)
      console.log('\n✅ Utilisateur promu admin avec succès!')
      console.log('\n🔑 L\'utilisateur a maintenant:')
      console.log('   ✅ Accès complet à tous les contenus')
      console.log('   ✅ Accès au dashboard admin')
      console.log('   ✅ Permissions de gestion sur tous les utilisateurs')
      console.log('   ✅ Accès à toutes les vidéos (publiées et non publiées)')
      return
    } else {
      // Créer dans la table users avec rôle ADMIN
      console.log('   📝 Création dans la table users avec rôle ADMIN...')
      const { data: newDbUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: userEmail,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || userEmail.split('@')[0],
          role: 'ADMIN',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('   ❌ Erreur lors de la création:', createError)
        throw createError
      }
      
      console.log('   ✅ Utilisateur créé dans la table users avec rôle ADMIN!')
      console.log('\n📊 Utilisateur admin:')
      console.log(`   ID: ${newDbUser.id}`)
      console.log(`   Email: ${newDbUser.email}`)
      console.log(`   Role: ${newDbUser.role}`)
      console.log(`   Nom: ${newDbUser.name || newDbUser.full_name || 'N/A'}`)
      console.log('\n✅ Utilisateur promu admin avec succès!')
      console.log('\n🔑 L\'utilisateur a maintenant:')
      console.log('   ✅ Accès complet à tous les contenus')
      console.log('   ✅ Accès au dashboard admin')
      console.log('   ✅ Permissions de gestion sur tous les utilisateurs')
      console.log('   ✅ Accès à toutes les vidéos (publiées et non publiées)')
      return
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la promotion de l\'utilisateur:', error)
    console.error('   Message:', error.message)
    if (error.details) {
      console.error('   Détails:', error.details)
    }
    process.exit(1)
  }
}

// Exécuter le script
setAdminUser().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})















