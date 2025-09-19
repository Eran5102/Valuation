import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/companies/[id] - Get company by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const supabase = await createClient();

        const { data: company, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', idParam)
            .single();

        if (error || !company) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json(
            { error: 'Failed to fetch company' },
            { status: 500 }
        );
    }
}

// PATCH /api/companies/[id] - Update company (including status)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const body = await request.json();
        const supabase = await createClient();

        // Update with all provided fields
        const { data: company, error } = await supabase
            .from('companies')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', idParam)
            .select()
            .single();

        if (error || !company) {
            return NextResponse.json(
                { error: 'Company not found or update failed' },
                { status: 404 }
            );
        }

        return NextResponse.json(company);
    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json(
            { error: 'Failed to update company' },
            { status: 500 }
        );
    }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const supabase = await createClient();

        const { error } = await supabase
            .from('companies')
            .delete()
            .eq('id', idParam);

        if (error) {
            return NextResponse.json(
                { error: 'Company not found or delete failed' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        return NextResponse.json(
            { error: 'Failed to delete company' },
            { status: 500 }
        );
    }
}