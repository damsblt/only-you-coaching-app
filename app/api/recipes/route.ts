import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Recipe } from '@/types/cms'
import { getSignedVideoUrl, getPublicUrl } from '@/lib/s3'

// Cache configuration - revalidate every 60 seconds
export const revalidate = 60

// Columns needed for recipe display - optimize query by selecting only needed fields
const RECIPE_COLUMNS = 'id,title,slug,description,image,images,pdf_url,category,prep_time,servings,is_vegetarian,difficulty,tags,ingredients,instructions,nutrition_info,is_premium,is_published,published_at,updated_at'

// Helper function to get signed URL for S3 images (with fallback to public URL)
async function getSignedImageUrl(url: string): Promise<string> {
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

// GET /api/recipes - Liste des recettes
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Optimize query: select only needed columns instead of '*'
    let query = db
      .from('recipes')
      .select(RECIPE_COLUMNS)
      .eq('is_published', true)
      .order('published_at', { ascending: false })

    // Filtres
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    query = query.range(offset, offset + limit - 1)

    const { data: recipes, error } = await query.execute()

    if (error) {
      console.error('Error fetching recipes:', error)
      return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
    }

    console.log(`Fetched ${recipes?.length || 0} recipes from Neon`)
    
    // Log first recipe structure for debugging
    if (recipes && recipes.length > 0) {
      console.log('Sample recipe structure:', {
        id: recipes[0].id,
        title: recipes[0].title,
        image: recipes[0].image,
        imagesCount: Array.isArray(recipes[0].images) ? recipes[0].images.length : 0,
        images: recipes[0].images,
        pdf_url: recipes[0].pdf_url
      })
    }

    // Transformer les données pour correspondre à l'interface Recipe
    // Générer des URLs signées pour les images S3
    // Process in batches of 5 to avoid overwhelming the system (recipes have multiple images)
    const BATCH_SIZE = 5
    const transformedRecipes = []
    
    for (let i = 0; i < (recipes || []).length; i += BATCH_SIZE) {
      const batch = (recipes || []).slice(i, i + BATCH_SIZE)
      const processedBatch = await Promise.all(
        batch.map(async (recipe: any) => {
        // Sign main image URL if it's from S3
        const signedMainImage = await getSignedImageUrl(recipe.image || '')
        
        // Sign all image URLs in the images array
        const signedImages = await Promise.all(
          (recipe.images || []).map((img: string) => getSignedImageUrl(img))
        )
        
        // Log if images array is empty or has issues
        if (!recipe.images || recipe.images.length === 0) {
          console.warn(`Recipe ${recipe.id} (${recipe.title}) has no images array`)
        } else {
          console.log(`Recipe ${recipe.id} (${recipe.title}) has ${recipe.images.length} images`)
        }
        
        // Sign PDF URL if it exists and is from S3
        let signedPdfUrl = recipe.pdf_url
        if (recipe.pdf_url) {
          signedPdfUrl = await getSignedImageUrl(recipe.pdf_url)
          console.log(`Recipe ${recipe.id} (${recipe.title}) PDF URL signed: ${signedPdfUrl ? 'yes' : 'no'}`)
        }

        return {
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
      })
      )
      transformedRecipes.push(...processedBatch)
    }

    // Sort recipes by title in ascending order (alphabetical)
    transformedRecipes.sort((a, b) => {
      return a.title.localeCompare(b.title)
    })

    // Add cache headers for better performance
    return NextResponse.json({
      recipes: transformedRecipes,
      pagination: {
        limit,
        offset,
        total: transformedRecipes.length
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vary': 'Accept-Encoding',
      },
    })

  } catch (error) {
    console.error('Error in recipes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/recipes - Créer une nouvelle recette (admin seulement)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Vérifier l'authentification admin (à implémenter selon votre système)
    // const { user } = await getServerSession(authOptions)
    // if (!user || !user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { data: recipe, error } = await db
      .from('recipes')
      .insert({
        title: body.title,
        slug: body.slug,
        description: body.description,
        image: body.image,
        images: body.images,
        category: body.category,
        prep_time: body.prepTime,
        servings: body.servings,
        is_vegetarian: body.isVegetarian,
        difficulty: body.difficulty,
        tags: body.tags,
        ingredients: body.ingredients,
        instructions: body.instructions,
        nutrition_info: body.nutritionInfo,
        is_premium: body.isPremium,
        is_published: body.isPublished || false
      })

    if (error) {
      console.error('Error creating recipe:', error)
      return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 })
    }

    return NextResponse.json({ recipe }, { status: 201 })

  } catch (error) {
    console.error('Error in recipes POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
