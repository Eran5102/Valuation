import { NextResponse } from 'next/server'
import { swaggerSpec } from '@/lib/swagger/swagger-spec'

export async function GET() {
  try {
    return NextResponse.json(swaggerSpec)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate API specification' }, { status: 500 })
  }
}
