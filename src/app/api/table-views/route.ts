import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/table-views - Get saved table views
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tableId = searchParams.get('tableId');
        const valuationId = searchParams.get('valuationId');

        if (!tableId) {
            return NextResponse.json(
                { error: 'Table ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Build query
        let query = supabase
            .from('saved_table_views')
            .select('*')
            .eq('table_id', tableId)
            .order('created_at', { ascending: false });

        // Add valuation filter if provided
        if (valuationId) {
            query = query.or(`valuation_id.eq.${valuationId},is_global.eq.true`);
        } else {
            query = query.eq('is_global', true);
        }

        const { data: views, error } = await query;

        if (error) {
            console.error('Error fetching table views:', error);
            return NextResponse.json(
                { error: 'Failed to fetch table views' },
                { status: 500 }
            );
        }

        return NextResponse.json(views || []);
    } catch (error) {
        console.error('Error in GET /api/table-views:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/table-views - Create a new table view
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, tableId, config, valuationId, isGlobal, isDefault } = body;

        if (!name || !tableId || !config) {
            return NextResponse.json(
                { error: 'Name, table ID, and config are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // If setting as default, unset other defaults for this table
        if (isDefault) {
            await supabase
                .from('saved_table_views')
                .update({ is_default: false })
                .eq('table_id', tableId);
        }

        const { data: view, error } = await supabase
            .from('saved_table_views')
            .insert({
                name,
                table_id: tableId,
                config,
                valuation_id: valuationId || null,
                is_global: isGlobal || false,
                is_default: isDefault || false,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating table view:', error);
            return NextResponse.json(
                { error: 'Failed to create table view' },
                { status: 500 }
            );
        }

        return NextResponse.json(view, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/table-views:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/table-views/[id] - Update a table view
export async function PATCH(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const viewId = searchParams.get('id');

        if (!viewId) {
            return NextResponse.json(
                { error: 'View ID is required' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const supabase = await createClient();

        // If setting as default, unset other defaults for this table
        if (body.is_default) {
            const { data: currentView } = await supabase
                .from('saved_table_views')
                .select('table_id')
                .eq('id', viewId)
                .single();

            if (currentView) {
                await supabase
                    .from('saved_table_views')
                    .update({ is_default: false })
                    .eq('table_id', currentView.table_id)
                    .neq('id', viewId);
            }
        }

        const { data: view, error } = await supabase
            .from('saved_table_views')
            .update({
                ...body,
                updated_at: new Date().toISOString()
            })
            .eq('id', viewId)
            .select()
            .single();

        if (error) {
            console.error('Error updating table view:', error);
            return NextResponse.json(
                { error: 'Failed to update table view' },
                { status: 500 }
            );
        }

        return NextResponse.json(view);
    } catch (error) {
        console.error('Error in PATCH /api/table-views:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/table-views/[id] - Delete a table view
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const viewId = searchParams.get('id');

        if (!viewId) {
            return NextResponse.json(
                { error: 'View ID is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('saved_table_views')
            .delete()
            .eq('id', viewId);

        if (error) {
            console.error('Error deleting table view:', error);
            return NextResponse.json(
                { error: 'Failed to delete table view' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'View deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/table-views:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}