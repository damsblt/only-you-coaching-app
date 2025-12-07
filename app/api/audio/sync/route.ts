import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'

// Check if AWS credentials are available
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

const s3Client = hasAwsCredentials ? new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

export async function POST(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    // List all objects in the Audio/ folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Audio/',
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents) {
      return NextResponse.json({ message: 'No audio files found in S3', synced: 0 })
    }

    // Filter for audio files
    const audioFiles = response.Contents.filter(obj => {
      const key = obj.Key || ''
      const extension = key.split('.').pop()?.toLowerCase()
      return ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension || '')
    })

    let syncedCount = 0
    const errors: string[] = []

    // Process each audio file
    for (const obj of audioFiles) {
      try {
        const key = obj.Key || ''
        const filename = key.split('/').pop() || ''
        const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
        
        // Generate signed URL for the audio file (valid for 1 year for storage)
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        
        const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 }) // 1 week
        
        // Determine category based on S3 folder structure
        let category = 'Méditation Guidée' // Default
        if (key.includes('coaching mental')) {
          category = 'Coaching Mental'
        }
        
        // Generate detailed tags based on filename content
        const lowerName = nameWithoutExt.toLowerCase()
        let tags = ['audio']
        
        // Add content-specific tags
        if (lowerName.includes('anxiété') || lowerName.includes('anxiete')) {
          tags.push('anxiété', 'relaxation', 'gestion-stress')
        } else if (lowerName.includes('gratitude')) {
          tags.push('gratitude', 'méditation', 'positivité')
        } else if (lowerName.includes('valeurs')) {
          tags.push('valeurs', 'méditation', 'développement-personnel')
        } else if (lowerName.includes('détente') || lowerName.includes('detente')) {
          tags.push('détente', 'relaxation', 'corporel')
        } else if (lowerName.includes('lâcher') || lowerName.includes('lacher')) {
          tags.push('lâcher-prise', 'relaxation', 'stress')
        } else if (lowerName.includes('estime')) {
          tags.push('estime-de-soi', 'méditation', 'confiance')
        } else if (lowerName.includes('affirmation')) {
          tags.push('affirmation', 'méditation', 'assertivité')
        } else if (lowerName.includes('couleurs')) {
          tags.push('couleurs', 'visualisation', 'relaxation')
        } else if (lowerName.includes('confiance')) {
          tags.push('confiance', 'méditation', 'développement-personnel')
        } else if (lowerName.includes('paysages')) {
          tags.push('paysages', 'visualisation', 'relaxation')
        } else if (lowerName.includes('sport')) {
          tags.push('sport', 'méditation', 'performance')
        }
        
        // Add category-specific tags
        if (category === 'Coaching Mental') {
          tags.push('coaching', 'mental', 'performance')
        } else {
          tags.push('méditation', 'guidée')
        }
        
        // Generate better descriptions based on content
        let description = `Audio de ${category.toLowerCase()}: ${nameWithoutExt.replace(/[-_]/g, ' ')}`
        
        if (lowerName.includes('anxiété') || lowerName.includes('anxiete')) {
          description = 'Méditation guidée pour gérer l\'anxiété et retrouver la sérénité'
        } else if (lowerName.includes('gratitude')) {
          description = 'Pratique de gratitude pour cultiver la positivité au quotidien'
        } else if (lowerName.includes('valeurs')) {
          description = 'Exploration de vos valeurs personnelles et de leur importance'
        } else if (lowerName.includes('détente') || lowerName.includes('detente')) {
          description = 'Séance de détente corporelle pour relâcher les tensions'
        } else if (lowerName.includes('lâcher') || lowerName.includes('lacher')) {
          description = 'Technique de lâcher-prise pour accepter et libérer le stress'
        } else if (lowerName.includes('estime')) {
          description = 'Méditation pour renforcer l\'estime de soi et la confiance'
        } else if (lowerName.includes('affirmation')) {
          description = 'Exercices d\'affirmation de soi et d\'assertivité'
        } else if (lowerName.includes('couleurs')) {
          description = 'Visualisation guidée avec les couleurs pour la relaxation'
        } else if (lowerName.includes('confiance')) {
          description = 'Méditation pour développer la confiance en soi'
        } else if (lowerName.includes('paysages')) {
          description = 'Voyage mental à travers des paysages apaisants'
        } else if (lowerName.includes('sport')) {
          description = 'Méditation spécialement conçue pour les sportifs'
        }

        // Check if audio already exists in Supabase (by S3 key or title)
        const { data: existingAudio } = await supabase
          .from('audios')
          .select('id')
          .or(`s3key.eq.${key},title.eq.${nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
          .maybeSingle()

        if (existingAudio) {
          console.log(`Audio already exists: ${nameWithoutExt}`)
          continue
        }

        // Generate a unique ID for the audio
        const audioId = `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Insert audio into Supabase
        // Store the S3 key instead of the signed URL to avoid expiration issues
        // Note: PostgreSQL column names are lowercase unless quoted, so use s3key not s3Key
        const now = new Date().toISOString()
        const audioData: any = {
          id: audioId,
          title: nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: description,
          s3key: key, // Store S3 key instead of signed URL (lowercase to match PostgreSQL)
          thumbnail: null,
          duration: 300, // Default duration
          category: category,
          tags: tags,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
        }
        
        // Also store audioUrl for backward compatibility, but generate fresh ones in API
        audioData.audioUrl = signedUrl
        
        const { data: newAudio, error } = await supabase
          .from('audios')
          .insert(audioData)
          .select()
          .single()

        if (error) {
          console.error(`Error inserting audio ${nameWithoutExt}:`, error)
          errors.push(`${nameWithoutExt}: ${error.message}`)
        } else {
          console.log(`✅ Synced audio: ${nameWithoutExt}`)
          syncedCount++
        }

      } catch (error) {
        console.error(`Error processing audio file:`, error)
        errors.push(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedCount} audios synced.`,
      synced: syncedCount,
      total: audioFiles.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error syncing audios from S3:', error)
    return NextResponse.json(
      { error: 'Failed to sync audios from S3' },
      { status: 500 }
    )
  }
}
