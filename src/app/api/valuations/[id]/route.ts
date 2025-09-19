import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/valuations/[id] - Get single valuation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const supabase = await createClient();

        const { data: valuation, error } = await supabase
            .from('valuations')
            .select('*')
            .eq('id', idParam)
            .single();

        if (error || !valuation) {
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
        const body = await request.json();
        const supabase = await createClient();

        // Validate status if provided
        if (body.status && !['draft', 'in_progress', 'completed', 'review'].includes(body.status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: draft, in_progress, completed, review' },
                { status: 400 }
            );
        }

        const { data: valuation, error } = await supabase
            .from('valuations')
            .update(body)
            .eq('id', idParam)
            .select()
            .single();

        if (error || !valuation) {
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
        const body = await request.json();
        const supabase = await createClient();

        const { data: valuation, error } = await supabase
            .from('valuations')
            .update(body)
            .eq('id', idParam)
            .select()
            .single();

        if (error || !valuation) {
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
        const supabase = await createClient();

        const { error } = await supabase
            .from('valuations')
            .delete()
            .eq('id', idParam);

        if (error) {
            return NextResponse.json(
                { error: 'Valuation not found or delete failed' },
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