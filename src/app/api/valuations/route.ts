import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

// GET /api/valuations - Get all valuations
export async function GET() {
    try {
        const valuations = db.getAllValuations();
        return NextResponse.json(valuations);
    } catch (error) {
        console.error('Error fetching valuations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch valuations' },
            { status: 500 }
        );
    }
}

// POST /api/valuations - Create valuation project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { client_id, ...valuationData } = body;
        const valuation = db.createValuation(client_id, valuationData);
        return NextResponse.json(valuation);
    } catch (error) {
        console.error('Error creating valuation project:', error);
        return NextResponse.json(
            { error: 'Failed to create valuation project' },
            { status: 500 }
        );
    }
}