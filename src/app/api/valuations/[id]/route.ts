import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

// GET /api/valuations/[id] - Get single valuation
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
        
        return NextResponse.json(valuation);
    } catch (error) {
        console.error('Error fetching valuation:', error);
        return NextResponse.json(
            { error: 'Failed to fetch valuation' },
            { status: 500 }
        );
    }
}

// PATCH /api/valuations/[id] - Update valuation (including status)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        
        // Validate status if provided
        if (body.status && !['draft', 'in_progress', 'completed', 'review'].includes(body.status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: draft, in_progress, completed, review' },
                { status: 400 }
            );
        }
        
        const valuation = db.updateValuation(id, body);
        
        if (!valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(valuation);
    } catch (error) {
        console.error('Error updating valuation:', error);
        return NextResponse.json(
            { error: 'Failed to update valuation' },
            { status: 500 }
        );
    }
}

// PUT /api/valuations/[id] - Update valuation
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        const valuation = db.updateValuation(id, body);
        
        if (!valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(valuation);
    } catch (error) {
        console.error('Error updating valuation:', error);
        return NextResponse.json(
            { error: 'Failed to update valuation' },
            { status: 500 }
        );
    }
}

// DELETE /api/valuations/[id] - Delete valuation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const deleted = db.deleteValuation(id);
        
        if (!deleted) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({ message: 'Valuation deleted successfully' });
    } catch (error) {
        console.error('Error deleting valuation:', error);
        return NextResponse.json(
            { error: 'Failed to delete valuation' },
            { status: 500 }
        );
    }
}