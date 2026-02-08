'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ArrowRight } from 'lucide-react'
import { Recipe } from '@/types/cms'
import { useSimpleAuth } from '@/components/providers/SimpleAuthProvider'
import ProtectedContent from '@/components/ProtectedContent'
import RecipeCard from '@/components/recipe/RecipeCard'
import { Section } from '@/components/ui/Section'

// Dynamic import pour le viewer PDF (lourd)
const RecipeBookletViewer = dynamic(() => import('@/components/recipe/RecipeBookletViewer'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
})
import { Button } from '@/components/ui/Button'
import PageHeader from '@/components/layout/PageHeader'

export default function RecettesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const { user, loading: authLoading } = useSimpleAuth()

  // Fetch recipes from API
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/recipes`)
        const data = await response.json()
        
        if (data.recipes) {
          setRecipes(data.recipes)
        }
      } catch (error) {
        console.error('Error fetching recipes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecipes()
  }, [])

  if (loading || authLoading) {
    return (
      <Section gradient="soft" title="Mes Recettes" subtitle="Chargement de vos recettes...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Section>
    )
  }

  return (
    <>
      <PageHeader
        imageS3Key="Photos/Illustration/brooke-lark-jUPOXXRNdcA-unsplash.jpg"
        title="Mes Recettes"
        subtitle="Découvrez une collection de recettes saines et délicieuses pour accompagner votre parcours fitness"
        height="fullScreen"
      />
      <Section 
        gradient="soft" 
        className="!pb-8"
      >
        <ProtectedContent 
          feature="recipes" 
          userId={user?.id}
        >
          {/* Introduction */}
          <div className="mb-12 text-center">
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Notre collection de recettes nutritives est conçue pour compléter votre programme d'entraînement. 
              Découvrez des plats équilibrés et savoureux qui vous aideront à maintenir une alimentation saine 
              tout au long de votre parcours vers une meilleure santé.
            </p>
          </div>

          {/* Recipes Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-accent-500 dark:text-accent-400 mb-8 text-center">
              Toutes les Recettes
            </h2>
            {recipes.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => setSelectedRecipe(recipe)}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  Les recettes seront disponibles prochainement.
                </p>
              </div>
            )}
          </div>
        </ProtectedContent>

        {/* Free Trial CTA Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="relative bg-gradient-to-br from-accent-500 via-accent-600 to-burgundy-600 rounded-2xl shadow-2xl p-10 md:p-12 mb-12 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Découvrez plus avec notre essai gratuit
              </h2>
              
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-8">
                Explorez une sélection de nos recettes, vidéos et audios premium pour vous donner un avant-goût de ce qui vous attend !
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  href="/essai-gratuit"
                  variant="white"
                  size="lg"
                  className="group shadow-xl"
                >
                  Essayer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Booklet Viewer Fullscreen */}
      {selectedRecipe && (
        <RecipeBookletViewer
          images={selectedRecipe.images?.length > 0 ? selectedRecipe.images : [selectedRecipe.image]}
          pdfUrl={selectedRecipe.pdfUrl}
          title={selectedRecipe.title}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </>
  )
}
