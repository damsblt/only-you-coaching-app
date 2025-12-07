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
  image: string; // Image principale
  images: string[]; // Galerie d'images (collection PNG)
  pdfUrl?: string; // URL du PDF (optionnel - pour les recettes en format livret)
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'vegetarian';
  prepTime: number; // en minutes
  servings: number;
  isVegetarian: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[]; // 'sans-gluten', 'vegan', 'protéines', etc.
  ingredients: string[];
  instructions: string;
  nutritionInfo?: {
    calories: number;
    protein: number; // en grammes
    carbs: number; // en grammes
    fat: number; // en grammes
  };
  isPremium: boolean;
  publishedAt: string;
  updatedAt: string;
}

