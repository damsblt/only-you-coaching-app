/**
 * API Route pour synchroniser les vidéos depuis S3 ET mettre à jour les métadonnées depuis Word
 * 
 * POST /api/videos/sync-with-metadata
 * Body: { wordPath: string, region: string }
 * 
 * Ce endpoint :
 * 1. Parse le fichier Word pour extraire les métadonnées
 * 2. Synchronise les vidéos depuis S3 vers Neon
 * 3. Match les métadonnées avec les vidéos par numéro
 * 4. Met à jour Neon avec les métadonnées
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { db, query } from '@/lib/db'
import fs from 'fs'
import path from 'path'

// Dynamic imports for Node.js-only modules
let mammoth: any = null
let AdmZip: any = null

async function loadWordParsers() {
  if (!mammoth) {
    mammoth = (await import('mammoth')).default
  }
  if (!AdmZip) {
    AdmZip = (await import('adm-zip')).default
  }
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

/**
 * Encode S3 key to properly formatted URL path
 * Encodes each segment separately to preserve slashes
 * Example: "thumbnails/Video/file name + special.jpg" 
 * -> "thumbnails/Video/file+name+%2B+special.jpg"
 */
function encodeS3KeyToUrl(key: string): string {
  // Split by slashes, encode each segment, then rejoin
  return key.split('/').map(segment => encodeURIComponent(segment)).join('/')
}

/**
 * Build properly encoded S3 URL from key
 */
function buildS3Url(key: string): string {
  const encodedKey = encodeS3KeyToUrl(key)
  return `${S3_BASE_URL}/${encodedKey}`
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined
})

/**
 * Extract text from Word document
 */
async function extractTextFromWord(wordPath: string): Promise<string> {
  await loadWordParsers()
  
  try {
    const result = await mammoth.extractRawText({ path: wordPath })
    return result.value
  } catch (error) {
    // Fallback to manual extraction
    try {
      const zip = new AdmZip(wordPath)
      const xmlContent = zip.readAsText('word/document.xml')
      const text = xmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text
    } catch (error2) {
      throw new Error(`Failed to extract text: ${(error2 as Error).message}`)
    }
  }
}

/**
 * Parse exercises from text
 */
function parseExercisesFromText(text: string, region: string) {
  const exercises: Array<{
    videoNumber: number
    region: string
    muscleCible?: string
    positionDepart?: string
    mouvement?: string
    intensite?: string
    serie?: string
    contreIndication?: string
    title?: string
  }> = []
  
  // Pattern 1: Numbered list (1., 2., etc.)
  const numberedPattern = /(\d+)\.\s*([^\n]+(?:\n(?!\d+\.)[^\n]+)*)/g
  let match
  
  while ((match = numberedPattern.exec(text)) !== null) {
    const number = parseInt(match[1], 10)
    const content = match[2].trim()
    const metadata = extractMetadataFromContent(content, number, region)
    if (metadata) {
      exercises.push(metadata)
    }
  }
  
  // Pattern 2: "Vidéo X" pattern
  const videoPattern = /[Vv]id[ée]o\s+(\d+)[\s:\.]+([^\n]+(?:\n(?!Vidéo|vidéo)[^\n]+)*)/g
  while ((match = videoPattern.exec(text)) !== null) {
    const number = parseInt(match[1], 10)
    const content = match[2].trim()
    const metadata = extractMetadataFromContent(content, number, region)
    if (metadata) {
      const existing = exercises.find(e => e.videoNumber === number)
      if (!existing) {
        exercises.push(metadata)
      }
    }
  }
  
  return exercises
}

/**
 * Extract metadata from exercise content
 */
function extractMetadataFromContent(content: string, videoNumber: number, region: string) {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return null
  
  const metadata: {
    videoNumber: number
    region: string
    muscleCible?: string
    positionDepart?: string
    mouvement?: string
    intensite?: string
    serie?: string
    contreIndication?: string
    title?: string
  } = {
    videoNumber,
    region: region || 'abdos'
  }
  
  // Patterns for French metadata
  const patterns = {
    muscleCible: /[Mm]uscle[s]?\s+[Cc]ible[s]?:?\s*(.+)/i,
    positionDepart: /[Pp]osition\s+[Dd][ée]part:?\s*(.+)/i,
    mouvement: /[Mm]ouvement:?\s*(.+)/i,
    intensite: /[Ii]ntensit[ée]:?\s*(.+)/i,
    serie: /[Ss][ée]rie[s]?:?\s*(.+)/i,
    contreIndication: /[Cc]ontre[-\s]?[Ii]ndication[s]?:?\s*(.+)/i
  }
  
  // Extract metadata
  for (const line of lines) {
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern)
      if (match && !metadata[key as keyof typeof metadata]) {
        metadata[key as keyof typeof metadata] = match[1].trim()
      }
    }
  }
  
  // Title is usually the first line without metadata keywords
  const titleLine = lines.find(l => {
    const lower = l.toLowerCase()
    return !lower.includes('muscle') && 
           !lower.includes('position') && 
           !lower.includes('mouvement') &&
           !lower.includes('intensité') &&
           !lower.includes('série') &&
           !lower.includes('contre')
  })
  
  metadata.title = titleLine || lines[0] || `Exercice ${videoNumber}`
  
  return metadata
}

/**
 * Extract video number from S3 key or title
 */
function extractVideoNumber(videoUrl: string, title: string): number | null {
  const urlMatch = videoUrl.match(/(?:^|\/)(\d+)(?:\.\s)/i)
  if (urlMatch) {
    return parseInt(urlMatch[1], 10)
  }
  
  const titleMatch = title.match(/^(\d+)\.\s/)
  if (titleMatch) {
    return parseInt(titleMatch[1], 10)
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wordPath, region } = body
    
    if (!wordPath || !region) {
      return NextResponse.json(
        { error: 'wordPath and region are required' },
        { status: 400 }
      )
    }
    
    // Resolve absolute path
    const absoluteWordPath = path.isAbsolute(wordPath) 
      ? wordPath 
      : path.join(process.cwd(), wordPath)
    
    if (!fs.existsSync(absoluteWordPath)) {
      return NextResponse.json(
        { error: `Word file not found: ${absoluteWordPath}` },
        { status: 404 }
      )
    }
    
    console.log(`📄 Parsing Word: ${absoluteWordPath}`)
    console.log(`📍 Region: ${region}`)
    
    // Step 1: Extract metadata from Word
    const text = await extractTextFromWord(absoluteWordPath)
    const exercises = parseExercisesFromText(text, region)
    
    console.log(`✅ Extracted ${exercises.length} exercises from Word`)
    
    // Step 2: Sync videos from S3
    const prefix = `Video/programmes-predefinis/${region}/`
    const videos: string[] = []
    let continuationToken: string | undefined = undefined
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
      
      const response = await s3Client.send(listCommand)
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Key.match(/\.(mp4|mov|avi)$/i) && !obj.Key.includes('thumbnails/')) {
            videos.push(obj.Key)
          }
        }
      }
      
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
    
    console.log(`✅ Found ${videos.length} videos in S3`)
    
    // Sync each video to Neon
    let syncedCount = 0
    for (const s3Key of videos) {
      const filename = s3Key.split('/').pop() || ''
      // Generate full S3 URL with proper encoding
      const videoUrl = buildS3Url(s3Key)
      
      // Generate title (removes leading numbers including decimals like 10.1)
      const nameWithoutExt = filename.split('.').slice(0, -1).join('.')
      const cleaned = nameWithoutExt.replace(/^\d+(\.\d+)?\.?\s*/, '')
      const withSpaces = cleaned.replace(/[-_]/g, ' ')
      // Capitalize only the first letter, rest lowercase
      const title = withSpaces.length > 0 
        ? withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase()
        : withSpaces
      
      // Check if exists
      const { data: existing } = await db
        .from('videos_new')
        .select('id')
        .like('videoUrl', `%${s3Key}%`)
        .execute()
      
      if (existing && existing.length > 0) {
        continue
      }
      
      // Insert
      const now = new Date().toISOString()
      await db.from('videos_new').insert({
        title,
        description: `Exercice: ${title}`,
        videoUrl,
        thumbnail: null,
        duration: 0,
        difficulty: 'intermediaire',
        category: 'Predefined Programs',
        region,
        muscleGroups: [], // Empty by default - no automatic filling
        targeted_muscles: [], // Empty by default - no automatic filling
        videoType: 'PROGRAMMES',
        isPublished: true,
        createdAt: now,
        updatedAt: now
      }).execute()
      
      syncedCount++
    }
    
    console.log(`✅ Synced ${syncedCount} videos to Neon`)
    
    // Step 3: Update videos with metadata
    let updatedCount = 0
    for (const exercise of exercises) {
      const { videoNumber, title, muscleCible, positionDepart, mouvement, intensite, serie, contreIndication } = exercise
      
      // Find video by number
      const { data: allVideos } = await db
        .from('videos_new')
        .select('id, title, videoUrl')
        .eq('region', region)
        .eq('category', 'Predefined Programs')
        .eq('videoType', 'PROGRAMMES')
        .execute()
      
      let video = null
      for (const v of allVideos || []) {
        const num = extractVideoNumber(v.videoUrl, v.title)
        if (num === videoNumber) {
          video = v
          break
        }
      }
      
      if (!video) {
        continue
      }
      
      // Update metadata
      const updateData: any = {
        updatedAt: new Date().toISOString()
      }
      
      // Map Titre exercice → exo_title
      if (title) updateData.exo_title = title
      
      // Helper function to remove trailing dots
      const removeTrailingDot = (text: string | undefined): string | undefined => {
        if (!text) return text
        return text.trim().replace(/\.$/, '')
      }
      
      // Map Muscle cible → targeted_muscles (convert string to array)
      if (muscleCible) {
        // Split by comma and clean up, remove trailing dots
        const muscles = muscleCible
          .split(',')
          .map(m => removeTrailingDot(m.trim()) || '')
          .filter(m => m.length > 0)
        updateData.targeted_muscles = muscles
      }
      
      if (positionDepart) updateData.startingPosition = positionDepart
      if (mouvement) updateData.movement = mouvement
      if (intensite) updateData.intensity = removeTrailingDot(intensite)
      if (serie) updateData.series = removeTrailingDot(serie)
      if (contreIndication) updateData.constraints = removeTrailingDot(contreIndication)
      
      // Use raw SQL for update
      const setClause = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')
      const values = [...Object.values(updateData), video.id]
      
      await query(
        `UPDATE videos_new SET ${setClause} WHERE id = $${values.length}`,
        values
      )
      
      updatedCount++
    }
    
    console.log(`✅ Updated ${updatedCount} videos with metadata`)
    
    return NextResponse.json({
      success: true,
      exercisesExtracted: exercises.length,
      videosSynced: syncedCount,
      videosUpdated: updatedCount
    })
    
  } catch (error: any) {
    console.error('Error in sync-with-metadata:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync with metadata' },
      { status: 500 }
    )
  }
}

