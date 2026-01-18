'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Recipe } from '@/types/cms'
import { Button } from '@/components/ui/Button'
import RecipeBookletViewer from './RecipeBookletViewer'
import { 
  X, 
  Clock, 
  Users, 
  ChefHat, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Share2,
  Heart,
  ZoomIn,
  ZoomOut,
  BookOpen
} from 'lucide-react'

interface RecipeModalProps {
  recipe: Recipe
  isOpen: boolean
  onClose: () => void
}

export default function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [viewMode, setViewMode] = useState<'details' | 'booklet'>('details')

  // Reset state when recipe changes
  useEffect(() => {
    setCurrentImageIndex(0)
    setIsZoomed(false)
  }, [recipe])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => 
          prev === 0 ? (recipe.images?.length || 1) - 1 : prev - 1
        )
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => 
          prev === (recipe.images?.length || 1) - 1 ? 0 : prev + 1
        )
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, recipe.images?.length, onClose])

  // Debug: log image info (must be before early returns)
  useEffect(() => {
    if (isOpen && recipe) {
      console.log('Recipe images:', {
        images: recipe.images,
        imageCount: recipe.images?.length,
        currentIndex: currentImageIndex,
        currentImage: recipe.images?.[currentImageIndex] || recipe.image,
        mainImage: recipe.image
      })
    }
  }, [isOpen, recipe, currentImageIndex])

  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? recipe.images.length - 1 : prev - 1
    )
  }

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === recipe.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    }
  }


  const hasBookletView = recipe.images.length > 1

  if (!isOpen) return null

  // Show booklet viewer if requested
  if (viewMode === 'booklet') {
    return (
      <div className="fixed inset-0 z-50">
        <RecipeBookletViewer
          images={recipe.images.length > 0 ? recipe.images : [recipe.image]}
          pdfUrl={recipe.pdfUrl}
          title={recipe.title}
          onClose={() => {
            setViewMode('details')
            onClose()
          }}
        />
      </div>
    )
  }

  const currentImage = recipe.images?.[currentImageIndex] || recipe.image
  const hasMultipleImages = recipe.images && recipe.images.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{recipe.title}</h2>
            {recipe.isPremium && (
              <Star className="w-6 h-6 text-yellow-500 fill-current" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasBookletView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('booklet')}
                title="Voir en format livret"
              >
                <BookOpen className="w-5 h-5" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFavorited(!isFavorited)}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
          {/* Image Gallery */}
          <div className="lg:w-1/2 relative bg-gray-50 dark:bg-gray-950">
            <div className="relative h-64 lg:h-full min-h-[300px]">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={recipe.title}
                  fill
                  className={`object-contain transition-transform duration-300 ${
                    isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={currentImageIndex === 0}
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                  quality={90}
                  onError={(e) => {
                    console.error('Image failed to load:', currentImage)
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <p className="mb-2">Aucune image disponible</p>
                    <p className="text-sm">Vérifiez les URLs des images</p>
                  </div>
                </div>
              )}

              {/* Navigation arrows */}
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToPreviousImage}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={goToNextImage}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}

              {/* Zoom controls */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setIsZoomed(false)}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => setIsZoomed(true)}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>

              {/* Image counter */}
              {hasMultipleImages && (
                <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {recipe.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {hasMultipleImages && (
              <div className="flex gap-2 p-2 overflow-x-auto border-t border-border">
                {recipe.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${recipe.title} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      quality={75}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Details */}
          <div className="lg:w-1/2 p-6 overflow-y-auto bg-white dark:bg-gray-800">
            {/* Description */}
            <p className="text-gray-800 dark:text-gray-100 text-base leading-relaxed mb-6">{recipe.description}</p>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{recipe.prepTime} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{recipe.servings} portion{recipe.servings > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium capitalize">{recipe.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-semibold capitalize">{recipe.difficulty}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.isVegetarian && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Végétarien
                </span>
              )}
              {recipe.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Ingrédients</h3>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-primary-500 dark:text-primary-400 mt-1.5 font-bold text-lg">•</span>
                      <span className="text-base text-gray-800 dark:text-gray-100 leading-relaxed flex-1">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic">Aucun ingrédient listé</p>
              )}
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Instructions</h3>
              {recipe.instructions ? (
                <div className="prose prose-base max-w-none text-gray-800 dark:text-gray-100 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: recipe.instructions }} />
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic">Aucune instruction disponible</p>
              )}
            </div>

            {/* Nutrition info */}
            {recipe.nutritionInfo && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Valeurs nutritionnelles</h3>
                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Calories:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-100">{recipe.nutritionInfo.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Protéines:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-100">{recipe.nutritionInfo.protein}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Glucides:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-100">{recipe.nutritionInfo.carbs}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Lipides:</span>
                    <span className="ml-2 font-semibold text-gray-800 dark:text-gray-100">{recipe.nutritionInfo.fat}g</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
