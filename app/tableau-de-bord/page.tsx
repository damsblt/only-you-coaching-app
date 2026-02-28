"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Play,
  CheckCircle2,
  Circle,
  Target,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react"
import { Section } from "@/components/ui/Section"
import PageHeader from "@/components/layout/PageHeader"
import ProtectedContent from "@/components/ProtectedContent"
import { useSimpleAuth } from "@/components/providers/SimpleAuthProvider"

interface RegionProgress {
  region: string
  displayName: string
  totalVideos: number
  completedCount: number
  nextAvailableVideoIndex: number
  isComplete: boolean
  progressPercent: number
}

interface DashboardData {
  regions: RegionProgress[]
  summary: {
    totalVideos: number
    totalCompleted: number
    completedPrograms: number
    totalPrograms: number
    overallProgressPercent: number
  }
}

export default function TableauDeBordPage() {
  const { user, loading: authLoading } = useSimpleAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    async function fetchProgress() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(
          `/api/programmes/dashboard-progress?userId=${user.id}`
        )
        if (!res.ok) {
          throw new Error("Impossible de charger la progression")
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue")
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [user?.id])

  if (authLoading) {
    return (
      <Section gradient="soft" title="Mon Tableau de Bord">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </Section>
    )
  }

  if (!user) {
    return (
      <>
        <PageHeader
          videoS3Key="Photos/Illustration/1860009_Lunges_Resistance Training_Exercise_1920x1080 (1).mp4"
          title="Mon Tableau de Bord"
          subtitle="Connectez-vous pour suivre votre progression dans les programmes."
          height="medium"
        />
        <Section gradient="soft">
          <div className="max-w-lg mx-auto text-center py-12">
            <LayoutDashboard className="w-16 h-16 mx-auto mb-6 text-accent-500" />
            <h2 className="text-2xl font-bold text-accent-600 dark:text-accent-400 mb-4">
              Connexion requise
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Connectez-vous pour accéder à votre tableau de bord et suivre votre
              progression dans les programmes prédéfinis.
            </p>
            <Link
              href="/auth/signin-simple"
              className="curved-button bg-footer-500 dark:bg-footer-600 text-white font-semibold py-3 px-8 inline-flex items-center gap-2 hover:shadow-floating"
            >
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        videoS3Key="Photos/Illustration/1860009_Lunges_Resistance Training_Exercise_1920x1080 (1).mp4"
        title="Mon Tableau de Bord"
        subtitle="Suivez votre progression dans les programmes prédéfinis."
        height="medium"
      />
      <Section gradient="soft">
        <ProtectedContent feature="predefinedPrograms" userId={user.id}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="curved-button bg-accent-500 text-white py-2 px-6"
              >
                Réessayer
              </button>
            </div>
          ) : data ? (
            <div className="space-y-10">
              {/* Résumé global */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="curved-card bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-accent-100 dark:bg-accent-900/30">
                      <Target className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {data.summary.totalCompleted}
                        <span className="text-lg font-normal text-gray-500">
                          /{data.summary.totalVideos}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Vidéos complétées
                      </p>
                    </div>
                  </div>
                </div>
                <div className="curved-card bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {data.summary.completedPrograms}
                        <span className="text-lg font-normal text-gray-500">
                          /{data.summary.totalPrograms}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Programmes terminés
                      </p>
                    </div>
                  </div>
                </div>
                <div className="curved-card bg-white dark:bg-gray-800 p-6 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-footer-500/20 dark:bg-footer-600/30">
                      <LayoutDashboard className="w-6 h-6 text-footer-600 dark:text-footer-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                        {data.summary.overallProgressPercent}%
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Progression globale
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de progression globale */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-300">
                    Avancement global
                  </span>
                  <span className="font-medium text-accent-600 dark:text-accent-400">
                    {data.summary.overallProgressPercent}%
                  </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 to-footer-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${data.summary.overallProgressPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Liste des programmes avec état */}
              <div>
                <h2 className="text-xl font-bold text-accent-500 dark:text-accent-400 mb-6">
                  Vos programmes
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Voici ce que vous avez accompli et ce qui vous reste à faire
                  dans chaque programme.
                </p>
                <div className="space-y-4">
                  {data.regions
                    .sort((a, b) => {
                      // Terminés en dernier, en cours en priorité, puis non commencés
                      if (a.isComplete && !b.isComplete) return 1
                      if (!a.isComplete && b.isComplete) return -1
                      if (a.completedCount > 0 && b.completedCount === 0)
                        return -1
                      if (a.completedCount === 0 && b.completedCount > 0)
                        return 1
                      return a.displayName.localeCompare(b.displayName, "fr")
                    })
                    .map((region) => (
                      <Link
                        key={region.region}
                        href={`/programmes/${region.region}`}
                        className="block group"
                      >
                        <div className="curved-card bg-white dark:bg-gray-800 shadow-organic hover:shadow-floating transition-all border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {region.isComplete ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                ) : region.completedCount > 0 ? (
                                  <Circle className="w-5 h-5 text-accent-500 flex-shrink-0 fill-accent-500/30" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                )}
                                <h3 className="font-semibold text-accent-500 dark:text-accent-400 group-hover:text-secondary-500 dark:group-hover:text-secondary-400 transition-colors">
                                  {region.displayName}
                                </h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <span>
                                  {region.completedCount}/{region.totalVideos}{" "}
                                  vidéos
                                </span>
                                {region.totalVideos > 0 && (
                                  <span
                                    className={
                                      region.isComplete
                                        ? "text-green-600 dark:text-green-400 font-medium"
                                        : ""
                                    }
                                  >
                                    {region.isComplete
                                      ? "Programme terminé"
                                      : region.completedCount > 0
                                        ? `${region.totalVideos - region.completedCount} restante(s)`
                                        : "Non commencé"}
                                  </span>
                                )}
                              </div>
                              {region.totalVideos > 0 && (
                                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-xs">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      region.isComplete
                                        ? "bg-green-500"
                                        : "bg-accent-500"
                                    }`}
                                    style={{
                                      width: `${region.progressPercent}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              <span className="curved-button bg-footer-500 dark:bg-footer-600 text-white font-semibold py-2.5 px-6 inline-flex items-center gap-2 group-hover:bg-footer-600 dark:group-hover:bg-footer-700 transition-all">
                                {region.isComplete ? (
                                  <>
                                    Revoir
                                    <Play className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    {region.completedCount > 0
                                      ? "Continuer"
                                      : "Commencer"}{" "}
                                    <ArrowRight className="w-4 h-4" />
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300">
                Aucune donnée de progression disponible.
              </p>
            </div>
          )}
        </ProtectedContent>
      </Section>
    </>
  )
}
