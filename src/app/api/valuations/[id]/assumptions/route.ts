import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

// GET /api/valuations/[id]/assumptions - Get valuation assumptions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const valuation = db.getValuationById(id);
        
        if (!valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        // Return assumptions if they exist, otherwise return empty object
        const assumptions = valuation.assumptions || {};
        
        return NextResponse.json({
            assumptions,
            updated_at: valuation.updated_at
        });
    } catch (error) {
        console.error('Error fetching assumptions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assumptions' },
            { status: 500 }
        );
    }
}

// PUT /api/valuations/[id]/assumptions - Update valuation assumptions
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        const { assumptions } = body;
        
        // Validate the assumptions data
        if (!assumptions || typeof assumptions !== 'object') {
            return NextResponse.json(
                { error: 'Invalid assumptions data' },
                { status: 400 }
            );
        }
        
        // Update the valuation with assumptions data
        const assumptionsData = {
            assumptions: assumptions,
            updated_at: new Date().toISOString()
        };
        
        const valuation = db.updateValuation(id, assumptionsData);
        if (!valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        console.log(`Assumptions updated for valuation ${id}`);
        
        return NextResponse.json({
            success: true,
            message: 'Assumptions saved successfully',
            assumptions: valuation.assumptions,
            updated_at: valuation.updated_at
        });
    } catch (error) {
        console.error('Error updating assumptions:', error);
        return NextResponse.json(
            { error: 'Failed to update assumptions' },
            { status: 500 }
        );
    }
}