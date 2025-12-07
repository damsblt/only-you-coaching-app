'use client'

import { Recipe } from '@/types/cms'
import { Button } from '@/components/ui/Button'
import { Clock, Users, ChefHat, Star } from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  viewMode: 'grid' | 'list'
}

export default function RecipeCard({ recipe, onClick, viewMode }: RecipeCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
      case 'hard':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Facile'
      case 'medium':
        return 'Moyen'
      case 'hard':
        return 'Difficile'
      default:
        return difficulty
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'breakfast':
        return 'Petit-déjeuner'
      case 'lunch':
        return 'Déjeuner'
      case 'dinner':
        return 'Dîner'
      case 'snack':
        return 'Collation'
      case 'vegetarian':
        return 'Végétarien'
      default:
        return category
    }
  }

  if (viewMode === 'list') {
    return (
      <div 
        className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={onClick}
      >
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {recipe.title}
              </h3>
              {recipe.isPremium && (
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {recipe.description}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700"
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-t-lg aspect-[3/4] bg-gray-100 dark:bg-gray-700">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {recipe.isPremium && (
          <div className="absolute top-2 right-2">
            <Star className="w-6 h-6 text-yellow-500 fill-current" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      {/* Contenu */}
      <div className="p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
            {recipe.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        </div>

        <Button 
          variant="primary" 
          size="md" 
          fullWidth
          className="!bg-accent-500 !text-white !shadow-lg hover:!bg-accent-600 hover:!shadow-xl"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          Voir la recette
        </Button>
      </div>
    </div>
  )
}
