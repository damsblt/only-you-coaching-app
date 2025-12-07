#!/usr/bin/env node

/**
 * Script pour créer un utilisateur admin dans Supabase
 * Usage: node scripts/create-admin-user.js
 * 
 * Crée un utilisateur avec:
 * - Email: blmarieline@gmail.com
 * - Password: marieline123
 * - Role: ADMIN
 * - Tous les accès
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

// Configuration de l'utilisateur admin
const adminConfig = {
  email: 'blmarieline@gmail.com',
  password: 'marieline123',
  fullName: 'Marie-Line Admin',
  role: 'ADMIN'
}

async function createAdminUser() {
  console.log('👤 Création de l\'utilisateur admin...')
  console.log(`   Email: ${adminConfig.email}`)
  console.log(`   Role: ${adminConfig.role}`)
  console.log('')
  
  try {
    // 1. Vérifier si l'utilisateur existe déjà dans Auth
    console.log('🔍 Vérification si l\'utilisateur existe déjà...')
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.warn('   ⚠️  Impossible de lister les utilisateurs:', listError.message)
    } else {
      const existingUser = existingUsers.users.find(u => u.email === adminConfig.email)
      if (existingUser) {
        console.log(`   ✅ Utilisateur trouvé dans Auth (ID: ${existingUser.id})`)
        console.log('   📝 Mise à jour du rôle dans la table users...')
        
        // Mettre à jour ou créer dans la table users
        const { data: existingDbUser, error: checkError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', existingUser.id)
          .single()
        
        if (checkError && checkError.code !== 'PGRST116') {
          console.error('   ❌ Erreur lors de la vérification:', checkError)
        }
        
        if (existingDbUser) {
          // Mettre à jour le rôle
          const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              role: adminConfig.role,
              email: adminConfig.email,
              name: adminConfig.fullName,
              updatedAt: new Date().toISOString()
            })
            .eq('id', existingUser.id)
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
          console.log('\n✅ Utilisateur admin créé/mis à jour avec succès!')
          return
        } else {
          // Créer dans la table users
          console.log('   📝 Création dans la table users...')
          const { data: newDbUser, error: createDbError } = await supabaseAdmin
            .from('users')
            .insert({
              id: existingUser.id,
              email: adminConfig.email,
              name: adminConfig.fullName,
              role: adminConfig.role,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .select()
            .single()
          
          if (createDbError) {
            console.error('   ❌ Erreur lors de la création dans users:', createDbError)
            throw createDbError
          }
          
          console.log('   ✅ Utilisateur créé dans la table users!')
          console.log('\n📊 Utilisateur admin:')
          console.log(`   ID: ${newDbUser.id}`)
          console.log(`   Email: ${newDbUser.email}`)
          console.log(`   Role: ${newDbUser.role}`)
          console.log(`   Nom: ${newDbUser.name || newDbUser.full_name || 'N/A'}`)
          console.log('\n✅ Utilisateur admin créé avec succès!')
          return
        }
      }
    }
    
    // 2. Créer l'utilisateur dans Supabase Auth
    console.log('🔐 Création de l\'utilisateur dans Supabase Auth...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminConfig.email,
      password: adminConfig.password,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        full_name: adminConfig.fullName,
        role: adminConfig.role
      }
    })
    
    if (authError) {
      console.error('❌ Erreur lors de la création dans Auth:', authError)
      throw authError
    }
    
    if (!authData.user) {
      throw new Error('Aucun utilisateur créé dans Auth')
    }
    
    console.log('   ✅ Utilisateur créé dans Auth (ID: ' + authData.user.id + ')')
    
    // 3. Créer l'utilisateur dans la table users avec le rôle ADMIN
    console.log('💾 Création de l\'utilisateur dans la table users avec rôle ADMIN...')
    
    // Construire les données utilisateur avec toutes les colonnes nécessaires
    const now = new Date().toISOString()
    const userData = {
      id: authData.user.id,
      email: adminConfig.email,
      name: adminConfig.fullName,
      role: adminConfig.role,
      createdAt: now,
      updatedAt: now
    }
    
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (dbError) {
      // Si l'utilisateur existe déjà dans la table, on le met à jour
      if (dbError.code === '23505') {
        console.log('   ⚠️  Utilisateur existe déjà dans la table users, mise à jour...')
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            role: adminConfig.role,
            email: adminConfig.email,
            name: adminConfig.fullName,
            updatedAt: new Date().toISOString()
          })
          .eq('id', authData.user.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('   ❌ Erreur lors de la mise à jour:', updateError)
          throw updateError
        }
        
        console.log('   ✅ Utilisateur mis à jour dans la table users!')
        console.log('\n📊 Utilisateur admin:')
        console.log(`   ID: ${updatedUser.id}`)
        console.log(`   Email: ${updatedUser.email}`)
        console.log(`   Role: ${updatedUser.role}`)
        console.log(`   Nom: ${updatedUser.name || updatedUser.full_name || 'N/A'}`)
      } else {
        console.error('   ❌ Erreur lors de la création dans users:', dbError)
        throw dbError
      }
    } else {
      console.log('   ✅ Utilisateur créé dans la table users!')
      console.log('\n📊 Utilisateur admin:')
      console.log(`   ID: ${dbUser.id}`)
      console.log(`   Email: ${dbUser.email}`)
      console.log(`   Role: ${dbUser.role}`)
      console.log(`   Nom: ${dbUser.name || dbUser.full_name || 'N/A'}`)
    }
    
    console.log('\n✅ Utilisateur admin créé avec succès!')
    console.log('\n🔑 Informations de connexion:')
    console.log(`   Email: ${adminConfig.email}`)
    console.log(`   Password: ${adminConfig.password}`)
    console.log(`   Role: ${adminConfig.role}`)
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces identifiants')
    console.log('   et accéder à toutes les fonctionnalités admin.')
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'utilisateur admin:', error)
    console.error('   Message:', error.message)
    if (error.details) {
      console.error('   Détails:', error.details)
    }
    process.exit(1)
  }
}

// Exécuter le script
createAdminUser().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
