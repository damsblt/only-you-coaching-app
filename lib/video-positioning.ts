// Video positioning utilities for mobile optimization
// Since videos are 1920x1080 (landscape) but mobile is 1080x1920 (portrait),
// we need to adjust object-position to center the coach

export interface VideoPositioning {
  objectPosition: string
  transform?: string
  scale?: number
}

// Default positioning for different exercise types
const EXERCISE_POSITIONS: Record<string, VideoPositioning> = {
  // Floor exercises (lying down, sitting)
  'floor': {
    objectPosition: 'center 30%', // Focus on upper body
    scale: 1.1
  },
  'sitting': {
    objectPosition: 'center 25%', // Focus on torso
    scale: 1.1
  },
  'lying': {
    objectPosition: 'center 35%', // Focus on upper body
    scale: 1.1
  },
  
  // Standing exercises
  'standing': {
    objectPosition: 'center 40%', // Focus on full body
    scale: 1.0
  },
  'squat': {
    objectPosition: 'center 45%', // Focus on legs and torso
    scale: 1.0
  },
  'lunge': {
    objectPosition: 'center 45%', // Focus on legs and torso
    scale: 1.0
  },
  
  // Equipment exercises
  'ball': {
    objectPosition: 'center 30%', // Focus on ball and upper body
    scale: 1.1
  },
  'trx': {
    objectPosition: 'center 25%', // Focus on upper body and TRX
    scale: 1.1
  },
  'dumbbell': {
    objectPosition: 'center 35%', // Focus on arms and torso
    scale: 1.1
  },
  
  // Default fallback
  'default': {
    objectPosition: 'center 35%',
    scale: 1.0
  }
}

// Keywords to detect exercise type from title/description
const EXERCISE_KEYWORDS: Record<string, string[]> = {
  'floor': ['sol', 'floor', 'couché', 'assis', 'allongé', 'ventre', 'dos'],
  'sitting': ['assis', 'sitting', 'siège', 'chaise'],
  'lying': ['couché', 'lying', 'allongé', 'ventre', 'dos'],
  'standing': ['debout', 'standing', 'vertical'],
  'squat': ['squat', 'flexion', 'accroupi'],
  'lunge': ['fente', 'lunge', 'jambe'],
  'ball': ['ballon', 'ball', 'stabilité', 'stability'],
  'trx': ['trx', 'suspension', 'traction'],
  'dumbbell': ['haltère', 'dumbbell', 'poids', 'weight']
}

/**
 * Analyze video metadata to determine optimal positioning
 */
export function getVideoPositioning(video: {
  title: string
  description: string
  category: string
  muscleGroups: string[]
}): VideoPositioning {
  const groups = Array.isArray(video.muscleGroups) ? video.muscleGroups.join(' ') : ''
  const text = `${video.title} ${video.description} ${video.category} ${groups}`.toLowerCase()
  
  // Find matching exercise type
  for (const [exerciseType, keywords] of Object.entries(EXERCISE_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return EXERCISE_POSITIONS[exerciseType] || EXERCISE_POSITIONS.default
    }
  }
  
  // Fallback based on category
  if (video.category.toLowerCase().includes('méditation')) {
    return {
      objectPosition: 'center 30%',
      scale: 1.1
    }
  }
  
  return EXERCISE_POSITIONS.default
}

/**
 * Generate CSS styles for video positioning
 */
export function getVideoStyles(positioning: VideoPositioning): React.CSSProperties {
  return {
    objectPosition: positioning.objectPosition,
    transform: positioning.transform || `scale(${positioning.scale || 1})`,
    objectFit: 'cover' as const
  }
}

/**
 * Get responsive positioning for different screen sizes
 */
export function getResponsiveVideoStyles(
  positioning: VideoPositioning,
  screenWidth: number
): React.CSSProperties {
  const baseStyles = getVideoStyles(positioning)
  
  // Adjust for very small screens
  if (screenWidth < 375) {
    return {
      ...baseStyles,
      objectPosition: positioning.objectPosition.replace('%', ' 25%'),
      transform: `scale(${(positioning.scale || 1) * 1.1})`
    }
  }
  
  // Adjust for medium screens
  if (screenWidth < 414) {
    return {
      ...baseStyles,
      transform: `scale(${(positioning.scale || 1) * 1.05})`
    }
  }
  
  return baseStyles
}

