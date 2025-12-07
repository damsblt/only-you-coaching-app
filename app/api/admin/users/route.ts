import { NextResponse } from 'next/server'
import { getAllUsersWithSubscriptions } from '@/lib/access-control'

export async function GET() {
  try {
    const users = await getAllUsersWithSubscriptions()
    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

