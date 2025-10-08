"use client"

import { useState } from "react"
import { Search, Filter, Play, Clock, Heart, Plus } from "lucide-react"
import { AudioCard } from "@/components/audio/AudioCard"
import { AudioPlayer } from "@/components/audio/AudioPlayer"
import dummyAudios from "@/data/dummyAudios.json"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"
import { Audio } from "@/types"

export default function MeditationPage() {
  const [selectedAudio, setSelectedAudio] = useState<Audio | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", "Méditation", "Relaxation", "Respiration", "Visualisation", "Nature"]

  const filteredAudios = dummyAudios.map((audio) => ({
    ...audio,
    createdAt: new Date(),
    updatedAt: new Date(),
    description: audio.description || null,
    thumbnail: audio.thumbnail || null
  })).filter((audio) => {
    const matchesSearch = audio.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (audio.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || audio.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <Section gradient="soft" title="Méditation & Relaxation" subtitle="Découvrez notre collection de méditations guidées et d\'ambiances sonores pour apaiser votre esprit et améliorer votre bien-être.">
      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une méditation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "Toutes les catégories" : category}
                </option>
              ))}
            </select>
          </div>
      </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredAudios.length} méditation{filteredAudios.length !== 1 ? "s" : ""} trouvée{filteredAudios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Audio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAudios.map((audio) => (
            <AudioCard
              key={audio.id}
              audio={audio}
              onClick={() => setSelectedAudio(audio)}
            />
          ))}
        </div>

        {/* Audio Player Modal */}
        {selectedAudio && (
          <AudioPlayer
            audio={selectedAudio}
            onClose={() => setSelectedAudio(null)}
          />
        )}
    </Section>
  )
}

