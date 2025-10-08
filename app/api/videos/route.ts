import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const muscleGroup = searchParams.get('muscleGroup')
  const programme = searchParams.get('programme')
  const difficulty = searchParams.get('difficulty')
  const search = searchParams.get('search')
  const videoType = searchParams.get('videoType')

  // Build filter conditions (Prisma)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isPublished: true
  }

  if (videoType === 'muscle-groups') {
    where.videoType = 'MUSCLE_GROUPS'
  } else if (videoType === 'programmes') {
    where.videoType = 'PROGRAMMES'
  }

  if (muscleGroup && muscleGroup !== 'all') {
    const muscleGroupMap: { [key: string]: string } = {
      'Abdos': 'abdos',
      'Bande': 'bande',
      'Biceps': 'biceps',
      'Cardio': 'cardio',
      'Dos': 'dos',
      'Fessiers et jambes': 'fessiers-jambes',
      'Streching': 'streching',
      'Triceps': 'triceps'
    }
    if (muscleGroupMap[muscleGroup]) {
      where.region = muscleGroupMap[muscleGroup]
    }
  }

  if (programme && programme !== 'all') {
    where.region = programme
  }

  if (difficulty && difficulty !== 'all') {
    where.difficulty = { in: [difficulty] }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { startingPosition: { contains: search, mode: 'insensitive' } },
      { movement: { contains: search, mode: 'insensitive' } },
      { theme: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Use Supabase REST as the primary path in production/serverless.
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase envs missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    })

    let query = supabase.from('videos_new').select('*').order('title', { ascending: true })

    // Apply filters equivalent to Prisma where
    query = query.eq('isPublished', true)

    if (where.videoType) {
      query = query.eq('videoType', where.videoType)
    }

    if (where.region) {
      query = query.eq('region', where.region)
    }

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty)
    }

    if (search) {
      const ilike = (col: string) => `${col}.ilike.%${search}%`
      query = query.or([
        ilike('title'),
        ilike('description'),
        ilike('startingPosition'),
        ilike('movement'),
        ilike('theme')
      ].join(','))
    }

    const { data, error } = await query.limit(1000)
    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('Supabase path threw:', error)
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 })
  }
}
