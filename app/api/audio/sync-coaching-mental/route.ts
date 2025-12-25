import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { db } from '@/lib/db'

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

    // List all objects in the Audio/coaching mental/ folder
    // Note: S3 keys are case-sensitive, but we'll try both variations
    const prefixes = [
      'Audio/coaching mental/',
      'Audio/Coaching Mental/',
      'Audio/coaching-mental/',
      'Audio/Coaching-Mental/',
    ]

    let allAudioFiles: any[] = []

    // Try each prefix variation
    for (const prefix of prefixes) {
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
        })

        const response = await s3Client.send(command)
        
        if (response.Contents && response.Contents.length > 0) {
          allAudioFiles.push(...response.Contents)
          console.log(`✅ Found ${response.Contents.length} files in ${prefix}`)
        }
      } catch (error) {
        console.log(`⚠️ No files found in ${prefix} or error:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Remove duplicates based on Key
    const uniqueFiles = Array.from(
      new Map(allAudioFiles.map(obj => [obj.Key, obj])).values()
    )

    if (uniqueFiles.length === 0) {
      return NextResponse.json({ 
        message: 'No audio files found in Audio/coaching mental/ folder', 
        synced: 0,
        searchedPrefixes: prefixes
      })
    }

    // Filter for audio files
    const audioFiles = uniqueFiles.filter(obj => {
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
        
        // Generate signed URL for the audio file (valid for 1 week)
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        })
        
        const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 }) // 1 week
        
        // Set category to Coaching Mental
        const category = 'Coaching Mental'
        
        // Generate detailed tags based on filename content
        const lowerName = nameWithoutExt.toLowerCase()
        let tags: string[] = ['audio', 'coaching', 'mental', 'performance']
        
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
        
        // Generate better descriptions based on content
        let description = `Audio de coaching mental: ${nameWithoutExt.replace(/[-_]/g, ' ')}`
        
        if (lowerName.includes('anxiété') || lowerName.includes('anxiete')) {
          description = 'Coaching mental pour gérer l\'anxiété et retrouver la sérénité'
        } else if (lowerName.includes('gratitude')) {
          description = 'Pratique de gratitude pour cultiver la positivité au quotidien'
        } else if (lowerName.includes('valeurs')) {
          description = 'Exploration de vos valeurs personnelles et de leur importance'
        } else if (lowerName.includes('détente') || lowerName.includes('detente')) {
          description = 'Séance de détente corporelle pour relâcher les tensions'
        } else if (lowerName.includes('lâcher') || lowerName.includes('lacher')) {
          description = 'Technique de lâcher-prise pour accepter et libérer le stress'
        } else if (lowerName.includes('estime')) {
          description = 'Coaching pour renforcer l\'estime de soi et la confiance'
        } else if (lowerName.includes('affirmation')) {
          description = 'Exercices d\'affirmation de soi et d\'assertivité'
        } else if (lowerName.includes('couleurs')) {
          description = 'Visualisation guidée avec les couleurs pour la relaxation'
        } else if (lowerName.includes('confiance')) {
          description = 'Coaching pour développer la confiance en soi'
        } else if (lowerName.includes('paysages')) {
          description = 'Voyage mental à travers des paysages apaisants'
        } else if (lowerName.includes('sport')) {
          description = 'Coaching mental spécialement conçu pour les sportifs'
        }

        // Check if audio already exists in database (by S3 key or title)
        // First check by s3key
        const { data: existingByKey } = await db
          .from('audios')
          .select('id')
          .eq('s3key', key)
          .execute()

        if (existingByKey && existingByKey.length > 0) {
          console.log(`Audio already exists (by s3key): ${nameWithoutExt}`)
          continue
        }

        // Then check by title (case-insensitive)
        const titleSearch = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const { data: existingByTitle } = await db
          .from('audios')
          .select('id')
          .ilike('title', `%${titleSearch}%`)
          .execute()

        if (existingByTitle && existingByTitle.length > 0) {
          console.log(`Audio already exists (by title): ${nameWithoutExt}`)
          continue
        }

        // Generate a UUID for the audio (PostgreSQL format)
        // Use crypto.randomUUID() if available, otherwise generate a v4 UUID
        const generateUUID = () => {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID()
          }
          // Fallback: generate a v4 UUID manually
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0
            const v = c === 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
          })
        }
        const audioId = generateUUID()
        
        // Insert audio into database
        // Store the S3 key instead of the signed URL to avoid expiration issues
        const now = new Date().toISOString()
        const audioData: any = {
          id: audioId,
          title: nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: description,
          s3key: key, // Store S3 key instead of signed URL
          thumbnail: null,
          duration: 300, // Default duration (can be updated later)
          category: category,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
        }
        
        // Add tags as JSONB array for PostgreSQL
        // The db.insert() method will automatically JSON.stringify arrays
        // If tags column doesn't exist, we'll try without it
        audioData.tags = tags
        
        // Also store audioUrl for backward compatibility, but generate fresh ones in API
        audioData.audioUrl = signedUrl
        
        // Insert audio into database
        // The insert() method returns { data, error } directly
        const { data: newAudio, error } = await db
          .from('audios')
          .insert(audioData)

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
      message: `Sync completed. ${syncedCount} audios synced from Audio/coaching mental/ folder.`,
      synced: syncedCount,
      total: audioFiles.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error syncing coaching mental audios from S3:', error)
    return NextResponse.json(
      { error: 'Failed to sync coaching mental audios from S3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

