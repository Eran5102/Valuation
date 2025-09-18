import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/optimized-jsonDb';
import ApiHandler from '@/lib/middleware/apiHandler';

// GET /api/valuations - Get all valuations
export const GET = ApiHandler.handle(
    async (request: NextRequest) => {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const valuations = await db.optimizedQuery('valuations', {
            sort: { field: 'created_at', direction: 'desc' },
            limit: limit,
            offset: (page - 1) * limit,
            cache: true
        });

        return NextResponse.json({
            data: valuations,
            pagination: {
                page,
                limit,
                total: valuations.length,
                hasMore: valuations.length === limit
            }
        });
    },
    {
        cache: {
            maxAge: 180, // 3 minutes
            staleWhileRevalidate: 300 // 5 minutes
        },
        rateLimit: {
            requests: 200,
            window: 60000 // 1 minute
        },
        compression: true,
        security: true,
        monitoring: true
    }
);

// POST /api/valuations - Create valuation project
export const POST = ApiHandler.handle(
    async (request: NextRequest) => {
        const body = await request.json();
        const { client_id, ...valuationData } = body;
        const valuation = await db.optimizedInsert('valuations', { ...valuationData, companyId: client_id });

        return NextResponse.json({
            data: valuation,
            message: 'Valuation project created successfully'
        }, { status: 201 });
    },
    {
        rateLimit: {
            requests: 50,
            window: 60000 // 1 minute
        },
        validation: {
            bodySchema: { required: ['client_id'] }
        },
        compression: true,
        security: true,
        monitoring: true
    }
);