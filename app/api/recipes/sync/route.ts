import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { db, update, insert } from '@/lib/db'

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'only-you-coaching'
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1'
const S3_BASE_URL = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`

// Check if AWS credentials are available
const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY

const s3Client = hasAwsCredentials ? new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
}) : null

// Helper function to generate slug from folder name
function generateSlug(folderName: string): string {
  return folderName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to generate title from folder name
function generateTitle(folderName: string): string {
  return folderName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Helper function to detect category from folder name
function detectCategory(folderName: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'vegetarian' {
  const lower = folderName.toLowerCase()
  if (lower.includes('vegetari') || lower.includes('veggie')) {
    return 'vegetarian'
  }
  if (lower.includes('breakfast') || lower.includes('petit-dejeuner') || lower.includes('déjeuner')) {
    return 'breakfast'
  }
  if (lower.includes('lunch') || lower.includes('dejeuner')) {
    return 'lunch'
  }
  if (lower.includes('dinner') || lower.includes('diner')) {
    return 'dinner'
  }
  if (lower.includes('snack')) {
    return 'snack'
  }
  // Default to vegetarian if unclear
  return 'vegetarian'
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAwsCredentials || !s3Client) {
      return NextResponse.json(
        { error: 'AWS credentials not configured' },
        { status: 500 }
      )
    }

    // Database is already initialized via db from '@/lib/db'

    // List all objects in the recettes/ folder
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'recettes/',
      Delimiter: '/', // This groups objects by folder
    })

    const response = await s3Client.send(command)
    
    if (!response.CommonPrefixes || response.CommonPrefixes.length === 0) {
      return NextResponse.json({ 
        message: 'No recipe folders found in S3', 
        synced: 0,
        found: 0 
      })
    }

    // Extract folder names
    const recipeFolders = response.CommonPrefixes!
      .map(prefix => prefix.Prefix)
      .filter((prefix): prefix is string => !!prefix)
      .map(prefix => prefix.replace('recettes/', '').replace('/', ''))
      .filter(folder => folder.length > 0)

    console.log(`Found ${recipeFolders.length} recipe folders in S3:`, recipeFolders)

    let syncedCount = 0
    let updatedCount = 0
    const errors: string[] = []
    const syncedRecipes: Array<{ slug: string; title: string; action: string }> = []

    // Process each recipe folder
    for (const folderName of recipeFolders) {
      try {
        const prefix = `recettes/${folderName}/`
        
        // List all files in this folder
        const folderCommand = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
        })

        const folderResponse = await s3Client.send(folderCommand)
        
        if (!folderResponse.Contents || folderResponse.Contents.length === 0) {
          console.log(`No files found in folder: ${folderName}`)
          continue
        }

        // Filter for image files (PNG, JPG, JPEG) and PDFs
        const imageFiles = folderResponse.Contents
          .map(obj => obj.Key)
          .filter((key): key is string => !!key)
          .filter(key => {
            const ext = key.split('.').pop()?.toLowerCase()
            return ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')
          })
          .sort()

        const pdfFiles = folderResponse.Contents
          .map(obj => obj.Key)
          .filter((key): key is string => !!key)
          .filter(key => {
            const ext = key.split('.').pop()?.toLowerCase()
            return ext === 'pdf'
          })

        if (imageFiles.length === 0) {
          console.log(`No image files found in folder: ${folderName}`)
          continue
        }

        // Generate URLs
        const imageUrls = imageFiles.map(key => `${S3_BASE_URL}/${key}`)
        const mainImage = imageUrls[0] || ''
        const pdfUrl = pdfFiles.length > 0 ? `${S3_BASE_URL}/${pdfFiles[0]}` : null

        // Generate metadata
        const slug = generateSlug(folderName)
        const title = generateTitle(folderName)
        const category = detectCategory(folderName)
        const description = `Collection de recettes: ${title}`
        
        // Check if recipe already exists by slug OR by main image URL (to avoid duplicates)
        const { data: recipesBySlug } = await db
          .from('recipes')
          .select('id, slug, title, image')
          .eq('slug', slug)
          .execute()

        // Also check by image URL to catch duplicates with different slugs
        const { data: recipesByImage } = await db
          .from('recipes')
          .select('id, slug, title, image')
          .eq('image', mainImage)
          .execute()

        const existingRecipe = (recipesBySlug && recipesBySlug.length > 0) 
          ? recipesBySlug[0] 
          : (recipesByImage && recipesByImage.length > 0) 
            ? recipesByImage[0] 
            : null

        const now = new Date().toISOString()
        
        if (existingRecipe) {
          // Update existing recipe with new images
          const { data: updatedRecipe, error: updateError } = await update(
            'recipes',
            {
              image: mainImage,
              images: imageUrls,
              pdf_url: pdfUrl,
              updated_at: now,
            },
            { id: existingRecipe.id }
          )

          if (updateError) {
            console.error(`Error updating recipe ${existingRecipe.slug}:`, updateError)
            errors.push(`${folderName}: ${updateError.message}`)
          } else {
            console.log(`✅ Updated recipe: ${existingRecipe.title} (${imageUrls.length} images)`)
            updatedCount++
            syncedRecipes.push({ slug: existingRecipe.slug, title: existingRecipe.title, action: 'updated' })
          }
        } else {
          // Create new recipe - published by default
          const { data: newRecipe, error: insertError } = await insert('recipes', {
            title,
            slug,
            description,
            image: mainImage,
            images: imageUrls,
            pdf_url: pdfUrl,
            category,
            prep_time: 30, // Default
            servings: 4, // Default
            is_vegetarian: category === 'vegetarian',
            difficulty: 'medium', // Default
            tags: [category, 'recettes'],
            ingredients: [],
            instructions: '',
            is_premium: false,
            is_published: true, // Published by default
            published_at: now,
            created_at: now,
            updated_at: now,
          })

          if (insertError) {
            console.error(`Error creating recipe ${slug}:`, insertError)
            errors.push(`${folderName}: ${insertError.message}`)
          } else {
            console.log(`✅ Created and published recipe: ${title} (${imageUrls.length} images)`)
            syncedCount++
            syncedRecipes.push({ slug, title, action: 'created' })
          }
        }

      } catch (error) {
        console.error(`Error processing folder ${folderName}:`, error)
        errors.push(`${folderName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      message: `Sync completed. ${syncedCount} new recipes created, ${updatedCount} recipes updated.`,
      synced: syncedCount,
      updated: updatedCount,
      total: recipeFolders.length,
      recipes: syncedRecipes,
      errors: errors.length > 0 ? errors : undefined,
      note: 'New recipes are automatically published. Existing recipes are updated with latest images.'
    })

  } catch (error) {
    console.error('Error syncing recipes from S3:', error)
    return NextResponse.json(
      { error: 'Failed to sync recipes from S3', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
