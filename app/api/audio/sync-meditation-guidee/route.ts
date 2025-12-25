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

    // List all objects in the Audio/ folder and filter for meditation guidée
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'Audio/',
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents || response.Contents.length === 0) {
      return NextResponse.json({ 
        message: 'No audio files found in S3 Audio/ folder', 
        synced: 0
      })
    }

    // Filter for audio files in meditation guidée folder
    // The folder name is "méditation guidée" with accents
    const audioFiles = response.Contents.filter(obj => {
      const key = obj.Key || ''
      
      // Skip the folder marker itself (Audio/)
      if (key === 'Audio/' || key.endsWith('/')) {
        return false
      }
      
      // Check if it's an audio file
      const extension = key.split('.').pop()?.toLowerCase()
      if (!['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(extension || '')) {
        return false
      }
      
      // Check if it's in a meditation guidée folder
      // Exclude coaching mental files
      const lowerKey = key.toLowerCase()
      if (lowerKey.includes('coaching mental') || lowerKey.includes('coaching-mental')) {
        return false
      }
      
      // Check if it's in the méditation guidée folder
      // The folder name can have various forms: "méditation guidée", "meditation guidee", etc.
      const normalizedKey = key.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
      
      const isMeditationGuidee = normalizedKey.includes('meditation guidee') || 
                                  normalizedKey.includes('meditation-guidee') ||
                                  normalizedKey.includes('meditation_guidee')
      
      // Also check with original accents
      const hasMeditationGuidee = key.includes('méditation guidée') || 
                                  key.includes('Méditation Guidée')
      
      // Include files in meditation guidée folder
      return isMeditationGuidee || hasMeditationGuidee
    })

    // Remove duplicates based on S3 key
    const uniqueAudioFiles = Array.from(
      new Map(audioFiles.map(obj => [obj.Key, obj])).values()
    )

    if (uniqueAudioFiles.length === 0) {
      return NextResponse.json({ 
        message: 'No audio files found in S3 meditation guidée folder', 
        synced: 0
      })
    }

    let syncedCount = 0
    const errors: string[] = []

    // Process each audio file
    for (const obj of uniqueAudioFiles) {
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
        
        // Set category to meditation_guidee (database constraint requires lowercase with underscore)
        const category = 'meditation_guidee'
        
        // Generate detailed tags based on filename content
        const lowerName = nameWithoutExt.toLowerCase()
        let tags = ['audio', 'méditation', 'guidée']
        
        // Add content-specific tags
        if (lowerName.includes('anxiété') || lowerName.includes('anxiete')) {
          tags.push('anxiété', 'relaxation', 'gestion-stress')
        } else if (lowerName.includes('gratitude')) {
          tags.push('gratitude', 'positivité')
        } else if (lowerName.includes('valeurs')) {
          tags.push('valeurs', 'développement-personnel')
        } else if (lowerName.includes('détente') || lowerName.includes('detente')) {
          tags.push('détente', 'relaxation', 'corporel')
        } else if (lowerName.includes('lâcher') || lowerName.includes('lacher')) {
          tags.push('lâcher-prise', 'relaxation', 'stress')
        } else if (lowerName.includes('estime')) {
          tags.push('estime-de-soi', 'confiance')
        } else if (lowerName.includes('affirmation')) {
          tags.push('affirmation', 'assertivité')
        } else if (lowerName.includes('couleurs')) {
          tags.push('couleurs', 'visualisation', 'relaxation')
        } else if (lowerName.includes('confiance')) {
          tags.push('confiance', 'développement-personnel')
        } else if (lowerName.includes('paysages')) {
          tags.push('paysages', 'visualisation', 'relaxation')
        } else if (lowerName.includes('sport')) {
          tags.push('sport', 'performance')
        }
        
        // Generate better descriptions based on content
        let description = `Méditation guidée: ${nameWithoutExt.replace(/[-_]/g, ' ')}`
        
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

        // Check if audio already exists in database (by S3 key or title)
        const title = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        const { data: existingAudios } = await db
          .from('audios')
          .select('id')
          .or(`s3key.eq.${key},title.eq.${title}`)
        
        const existingAudio = existingAudios && existingAudios.length > 0 ? existingAudios[0] : null

        if (existingAudio) {
          console.log(`Audio already exists: ${nameWithoutExt}`)
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
          s3key: key, // Store S3 key instead of signed URL (lowercase to match PostgreSQL)
          thumbnail: null,
          duration: 300, // Default duration
          category: category,
          isPublished: true,
          createdAt: now,
          updatedAt: now,
        }
        
        // Also store audioUrl for backward compatibility, but generate fresh ones in API
        audioData.audioUrl = signedUrl
        
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
      message: `Sync completed. ${syncedCount} meditation guidée audios synced.`,
      synced: syncedCount,
      total: uniqueAudioFiles.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error syncing meditation guidée audios from S3:', error)
    return NextResponse.json(
      { error: 'Failed to sync meditation guidée audios from S3' },
      { status: 500 }
    )
  }
}

