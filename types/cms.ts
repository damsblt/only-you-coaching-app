// Types pour le CMS - Only You Coaching

export interface HomepageContent {
  id: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
  };
  features: {
    title: string;
    subtitle: string;
    description: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
    }>;
  };
  pricing: {
    title: string;
    subtitle: string;
    description: string;
  };
  cta: {
    title: string;
    description: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
  };
  stats: Array<{
    id: string;
    value: string;
    label: string;
    icon: string;
  }>;
  publishedAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string;
  duration: number;
  thumbnail: string;
  videoUrl: string;
  muscleGroup: 'abdos' | 'biceps' | 'triceps' | 'cardio' | 'dos' | 'epaules' | 'fessiers-jambes' | 'stretching';
  level: 'debutant' | 'intermediaire' | 'avance';
  isPremium: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  durationWeeks: number;
  level: 'debutant' | 'intermediaire' | 'avance';
  isPremium: boolean;
  price: number;
  videos: Video[];
  publishedAt: string;
  updatedAt: string;
}

export interface Audio {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: 'meditation_guidee' | 'coaching_mental';
  audioUrl: string;
  thumbnail: string;
  duration: number;
  isPremium: boolean;
  publishedAt: string;
  updatedAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime: number;
  servings: number;
  isVegetarian: boolean;
  ingredients: string[];
  instructions: string;
  publishedAt: string;
  updatedAt: string;
}

