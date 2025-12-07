#!/usr/bin/env node

/**
 * Script pour tester l'accessibilité des thumbnails
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const https = require('https')
const http = require('http')

// Charger les variables d'environnement depuis .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

/**
 * Teste si une URL est accessible
 */
function testUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url)
    const client = urlObj.protocol === 'https:' ? https : http
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'HEAD',
      timeout: 5000
    }
    
    const req = client.request(options, (res) => {
      resolve({ 
        url, 
        status: res.statusCode, 
        accessible: res.statusCode >= 200 && res.statusCode < 400,
        headers: res.headers
      })
      res.destroy()
    })
    
    req.on('error', (error) => {
      resolve({ url, status: 0, accessible: false, error: error.message })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({ url, status: 0, accessible: false, error: 'Timeout' })
    })
    
    req.end()
  })
}

async function main() {
  console.log('🔍 Test d\'accessibilité des thumbnails...\n')

  // Récupérer quelques vidéos avec leurs thumbnails
  const { data: videos, error } = await supabase
    .from('videos_new')
    .select('id, title, thumbnail')
    .eq('isPublished', true)
    .not('thumbnail', 'is', null)
    .limit(10)

  if (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }

  console.log(`📥 Test de ${videos.length} thumbnails...\n`)

  let accessible = 0
  let inaccessible = 0

  for (const video of videos) {
    console.log(`📹 ${video.title}`)
    console.log(`   URL: ${video.thumbnail}`)
    
    const result = await testUrl(video.thumbnail)
    
    if (result.accessible) {
      accessible++
      console.log(`   ✅ Accessible (${result.status})`)
    } else {
      inaccessible++
      console.log(`   ❌ Inaccessible (${result.status || 'Error'}: ${result.error || 'Unknown'})`)
    }
    console.log()
  }

  console.log('='.repeat(50))
  console.log('📊 Résumé:')
  console.log(`   ✅ Accessibles: ${accessible}`)
  console.log(`   ❌ Inaccessibles: ${inaccessible}`)
  console.log(`   📊 Total testé: ${videos.length}`)
  console.log('='.repeat(50))
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

