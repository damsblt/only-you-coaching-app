import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'BEGINNER':
      return 'bg-green-100 text-green-800'
    case 'INTERMEDIATE':
      return 'bg-yellow-100 text-yellow-800'
    case 'ADVANCED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function getDifficultyLabel(difficulty: string): string {
  switch (difficulty) {
    case 'BEGINNER':
      return 'Débutant'
    case 'INTERMEDIATE':
      return 'Intermédiaire'
    case 'ADVANCED':
      return 'Avancé'
    default:
      return difficulty
  }
}

