import type { User, Video, Audio, Playlist, Booking, Subscription } from '@prisma/client'

export type { User, Video, Audio, Playlist, Booking, Subscription }

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

