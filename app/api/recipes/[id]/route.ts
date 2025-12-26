import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Recipe } from '@/types/cms'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

// Helper function to get signed URL for S3 images (with fallback to public URL)
async function getSignedImageUrl(url: string): Promise<string> {
  if (!url) return url
  try {
    const imageUrl = new URL(url)
    // Check if it's an S3 URL
    if (imageUrl.hostname.includes('s3') || imageUrl.hostname.includes('amazonaws.com')) {
      try {
        const encodedPath = imageUrl.pathname
        const decodedPath = decodeURIComponent(encodedPath)
        const s3Key = decodedPath.substring(1) // Remove leading slash

        // Check AWS credentials
        const hasAwsCredentials = !!(
          process.env.AWS_ACCESS_KEY_ID && 
          process.env.AWS_SECRET_ACCESS_KEY
        )

        if (hasAwsCredentials) {
          // Generate signed URL (valid for 24 hours)
          const signedUrlResult = await getSignedVideoUrl(s3Key, 86400)

          if (signedUrlResult.success && signedUrlResult.url) {
            return signedUrlResult.url
          }
        }

        // Fallback to public URL if credentials missing or signed URL generation fails
        const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
        return getPublicUrl(encodedKey)
      } catch (urlError) {
        console.error('Error processing image URL:', urlError)
        // Fallback: try to extract S3 key and return public URL
        try {
          const encodedPath = imageUrl.pathname
          const decodedPath = decodeURIComponent(encodedPath)
          const s3Key = decodedPath.substring(1)
          const encodedKey = s3Key.split('/').map(segment => encodeURIComponent(segment)).join('/')
          return getPublicUrl(encodedKey)
        } catch {
          return url
        }
      }
    }
  } catch (error) {
    // Not a valid URL, return original
  }
  return url
}

// GET /api/recipes/[id] - Détails d'une recette
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: recipes, error } = await db
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .execute()
    
    const recipe = recipes && recipes.length > 0 ? recipes[0] : null

    if (error) {
      console.error('Error fetching recipe:', error)
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Sign main image URL if it's from S3
    const signedMainImage = await getSignedImageUrl(recipe.image || '')
    
    // Sign all image URLs in the images array
    const signedImages = await Promise.all(
      (recipe.images || []).map((img: string) => getSignedImageUrl(img))
    )
    
    // Sign PDF URL if it exists and is from S3
    let signedPdfUrl = recipe.pdf_url
    if (recipe.pdf_url) {
      signedPdfUrl = await getSignedImageUrl(recipe.pdf_url)
    }

    // Transformer les données pour correspondre à l'interface Recipe
    const transformedRecipe: Recipe = {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      image: signedMainImage,
      images: signedImages,
      pdfUrl: signedPdfUrl || undefined,
      category: recipe.category,
      prepTime: recipe.prep_time,
      servings: recipe.servings,
      isVegetarian: recipe.is_vegetarian,
      difficulty: recipe.difficulty,
      tags: recipe.tags || [],
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions,
      nutritionInfo: recipe.nutrition_info,
      isPremium: recipe.is_premium,
      publishedAt: recipe.published_at,
      updatedAt: recipe.updated_at
    }

    return NextResponse.json({ recipe: transformedRecipe })

  } catch (error) {
    console.error('Error in recipe API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/recipes/[id] - Mettre à jour une recette (admin seulement)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()

    // Vérifier l'authentification admin (à implémenter selon votre système)
    // const { user } = await getServerSession(authOptions)
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Note: Update method needs to be implemented in lib/db.ts
    // For now, use direct SQL query
    const { query } = await import('@/lib/db')
    const result = await query(`
      UPDATE recipes 
      SET 
        title = $1, slug = $2, description = $3, image = $4, images = $5,
        category = $6, prep_time = $7, servings = $8, is_vegetarian = $9,
        difficulty = $10, tags = $11, ingredients = $12, instructions = $13,
        nutrition_info = $14, is_premium = $15, is_published = $16,
        updated_at = $17
      WHERE id = $18
      RETURNING *
    `, [
      body.title, body.slug, body.description, body.image, 
      typeof body.images === 'string' ? body.images : JSON.stringify(body.images || []),
      body.category, body.prepTime, body.servings, body.isVegetarian,
      body.difficulty,
      typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags || []),
      typeof body.ingredients === 'string' ? body.ingredients : JSON.stringify(body.ingredients || []),
      body.instructions,
      typeof body.nutritionInfo === 'string' ? body.nutritionInfo : (body.nutritionInfo ? JSON.stringify(body.nutritionInfo) : null),
      body.isPremium, body.isPublished,
      new Date().toISOString(),
      id
    ])
    
    const recipe = result && result.length > 0 ? result[0] : null
    const error = recipe ? null : { message: 'Recipe not found' }

    if (error) {
      console.error('Error updating recipe:', error)
      return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
    }

    return NextResponse.json({ recipe })

  } catch (error) {
    console.error('Error in recipe PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/recipes/[id] - Supprimer une recette (admin seulement)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Vérifier l'authentification admin (à implémenter selon votre système)
    // const { user } = await getServerSession(authOptions)
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { query } = await import('@/lib/db')
    const result = await query('DELETE FROM recipes WHERE id = $1 RETURNING *', [id])
    const error = result && result.length > 0 ? null : { message: 'Recipe not found' }

    if (error) {
      console.error('Error deleting recipe:', error)
      return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' })

  } catch (error) {
    console.error('Error in recipe DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
