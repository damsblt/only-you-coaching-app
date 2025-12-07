"use client"

import { Play } from "lucide-react"

interface VideoPreviewButtonProps {
  videoId: string
  className?: string
}

export default function VideoPreviewButton({ videoId, className = "" }: VideoPreviewButtonProps) {
  const handleClick = () => {
    // Ouvrir le lecteur vidéo complet dans une modal ou nouvelle page
    window.open(`/bibliotheque-videos?video=${videoId}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className={`w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-floating hover:scale-110 transition-transform duration-300 group ${className}`}
    >
      <Play className="w-8 h-8 text-accent-500 ml-1 group-hover:text-accent-600" />
    </button>
  )
}
