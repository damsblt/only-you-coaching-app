'use client'

import { Recipe } from '@/types/cms'
import { Button } from '@/components/ui/Button'
import { BookOpen } from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  viewMode: 'grid' | 'list'
}

export default function RecipeCard({ recipe, onClick, viewMode }: RecipeCardProps) {
  const pageCount =
    recipe.images?.length > 0 ? recipe.images.length : recipe.image ? 1 : 0

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        className="w-full text-left curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all overflow-hidden border border-gray-100 dark:border-gray-700"
        onClick={onClick}
      >
        <div className="flex gap-4 p-4">
          <div className="flex-shrink-0 overflow-hidden rounded-lg bg-primary-50">
            <img
              src={recipe.image}
              alt=""
              className="h-24 w-20 object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {recipe.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
            {pageCount > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-footer-500/80">
                <BookOpen className="h-3.5 w-3.5" />
                {pageCount} page{pageCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <article className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <button
        type="button"
        onClick={onClick}
        className="relative block w-full overflow-hidden aspect-[3/4] bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
        aria-label={`Ouvrir le livret ${recipe.title}`}
      >
        <img
          src={recipe.image}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        />
        {pageCount > 0 && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#39334D]/85 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" />
            {pageCount} pages
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-foreground line-clamp-2 mb-1">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {recipe.description}
          </p>
        )}

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onClick}
        >
          Ouvrir le livret
        </Button>
      </div>
    </article>
  )
}
