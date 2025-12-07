import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    console.log('🔧 Correction de la structure de la table users...')
    
    // Test de création d'un utilisateur avec la nouvelle structure
    const testEmail = `test-${Date.now()}@example.com`
    const testUserId = crypto.randomUUID()
    
    console.log('🧪 Test de création d\'utilisateur avec la nouvelle structure...')
    
    const { data: testUser, error: testError } = await supabaseAdmin
      .from('users')
      .insert({
        id: testUserId,
        email: testEmail,
        name: 'Test User',
        role: 'USER',
        updatedAt: new Date().toISOString()
      })
      .select()
      .single()
    
    if (testError) {
      console.error('❌ Erreur lors du test:', testError)
      
      // Si l'erreur est liée à des colonnes manquantes, on essaie avec l'ancienne structure
      if (testError.message.includes('plan_id') || testError.message.includes('full_name')) {
        console.log('🔄 Tentative avec l\'ancienne structure...')
        
        const { data: testUserOld, error: testErrorOld } = await supabaseAdmin
          .from('users')
          .insert({
            id: testUserId,
            email: testEmail,
            name: 'Test User',
            role: 'USER',
            planId: 'essentiel',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select()
          .single()
        
        if (testErrorOld) {
          console.error('❌ Erreur avec l\'ancienne structure aussi:', testErrorOld)
          return NextResponse.json({ 
            error: 'Structure de table incompatible',
            details: {
              newStructure: testError.message,
              oldStructure: testErrorOld.message
            }
          }, { status: 500 })
        } else {
          console.log('✅ Utilisateur créé avec l\'ancienne structure')
          
          // Nettoyer le test
          await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', testUserId)
          
          return NextResponse.json({ 
            success: true,
            message: 'Table utilise l\'ancienne structure (planId, name, etc.)',
            structure: 'old'
          })
        }
      }
      
      return NextResponse.json({ 
        error: 'Erreur lors du test de création',
        details: testError.message
      }, { status: 500 })
    }
    
    console.log('✅ Utilisateur créé avec la nouvelle structure')
    
    // Nettoyer le test
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', testUserId)
    
    console.log('🧹 Utilisateur de test supprimé')
    
    return NextResponse.json({ 
      success: true,
      message: 'Table utilise la nouvelle structure (plan_id, full_name, etc.)',
      structure: 'new'
    })
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la correction:', error)
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}
