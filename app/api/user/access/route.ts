import { NextRequest, NextResponse } from 'next/server'
import { getUserPlanFeatures } from '@/lib/access-control'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const features = await getUserPlanFeatures(userId)
    return NextResponse.json({ features })
  } catch (error: any) {
    console.error('Error fetching user access:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


