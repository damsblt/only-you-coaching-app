// Custom types to replace Prisma types
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  role: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Video {
  id: string
  title: string
  description: string | null
  duration: number | null
  s3Key: string
  s3Url: string
  thumbnailUrl: string | null
  muscleGroup: string | null
  level: string | null
  isPremium: boolean
  views: number
  createdAt: Date
  updatedAt: Date
}

export interface Audio {
  id: string
  title: string
  description: string | null
  category: string | null
  duration: number | null
  s3Key: string
  s3Url: string
  thumbnail: string | null
  isPremium: boolean
  createdAt: Date
}

export interface Playlist {
  id: string
  title: string
  description: string | null
  userId: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Booking {
  id: string
  userId: string
  sessionType: string
  scheduledAt: Date
  status: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  planId: string | null
  status: string
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface VideoWithThumbnail extends Video {
  thumbnail: string | null
}

export interface AudioWithThumbnail extends Audio {
  thumbnail: string | null
}

export interface PlaylistWithItems extends Playlist {
  items: PlaylistItem[]
}

export interface PlaylistItem {
  id: string
  playlistId: string
  videoId?: string
  audioId?: string
  order: number
  createdAt: Date
  video?: Video
  audio?: Audio
}

export interface BookingWithUser extends Booking {
  user: User
}

export interface SubscriptionWithUser extends Subscription {
  user: User
}

export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type VideoType = 'MUSCLE_GROUPS' | 'PROGRAMMES'
export type SessionType = 'ONLINE' | 'IN_PERSON'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE'
export type SubscriptionPlan = 'MONTHLY' | 'YEARLY' | 'LIFETIME'
export type Role = 'USER' | 'ADMIN'

