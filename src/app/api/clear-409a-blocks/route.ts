import { NextResponse } from 'next/server'
import { clear409ASavedBlocks } from '@/lib/templates/clear-409a-blocks'

export async function POST() {
  try {
    // This will be called from client-side
    // The actual clearing happens on client-side through the imported function
    return NextResponse.json({
      success: true,
      message: 'Clear function available for client-side use',
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
