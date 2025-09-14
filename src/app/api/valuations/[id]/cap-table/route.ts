import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';
import { enhanceShareClassesWithCalculations, enhanceShareClassWithCalculations, validateShareClass } from '@/lib/capTableCalculations';

// GET /api/valuations/[id]/cap-table - Get valuation cap table data
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
        
        // Get cap table data from the valuation (if exists) or fallback to company share classes
        let shareClasses = [];
        let options = [];
        
        if (valuation.cap_table) {
            // Use cap table data from the valuation
            shareClasses = enhanceShareClassesWithCalculations(valuation.cap_table.shareClasses || []);
            options = valuation.cap_table.options || [];
        } else {
            // Fallback to company share classes for backwards compatibility
            const rawShareClasses = db.getShareClassesByCompany(valuation.companyId);
            shareClasses = enhanceShareClassesWithCalculations(rawShareClasses || []);
        }
        
        const capTableData = {
            shareClasses,
            options,
            updated_at: valuation.updatedAt
        };
        
        return NextResponse.json(capTableData);
    } catch (error) {
        console.error('Error fetching cap table:', error);
        return NextResponse.json(
            { error: 'Failed to fetch cap table data' },
            { status: 500 }
        );
    }
}

// PUT /api/valuations/[id]/cap-table - Update valuation cap table data
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        const { shareClasses, options } = body;
        
        // Validate the cap table data
        if (!shareClasses || !Array.isArray(shareClasses)) {
            return NextResponse.json(
                { error: 'Invalid share classes data' },
                { status: 400 }
            );
        }
        
        if (!options || !Array.isArray(options)) {
            return NextResponse.json(
                { error: 'Invalid options data' },
                { status: 400 }
            );
        }
        
        // Validate each share class
        const validationErrors: string[] = [];
        shareClasses.forEach((shareClass, index) => {
            const errors = validateShareClass(shareClass);
            if (errors.length > 0) {
                validationErrors.push(`Share class ${index + 1}: ${errors.join(', ')}`);
            }
        });
        
        if (validationErrors.length > 0) {
            return NextResponse.json(
                { 
                    error: 'Validation failed', 
                    details: validationErrors 
                },
                { status: 400 }
            );
        }
        
        // Enhance share classes with calculated fields before saving
        const enhancedShareClasses = enhanceShareClassesWithCalculations(shareClasses);
        
        // Update the valuation with cap table data
        const capTableData = {
            cap_table: {
                shareClasses: enhancedShareClasses,
                options,
                updated_at: new Date().toISOString()
            }
        };
        
        const valuation = db.updateValuation(id, capTableData);
        if (!valuation) {
            return NextResponse.json(
                { error: 'Valuation not found' },
                { status: 404 }
            );
        }
        
        console.log(`Cap table updated for valuation ${id}:`, {
            shareClasses: shareClasses.length,
            options: options.length
        });
        
        return NextResponse.json({
            success: true,
            message: 'Cap table data saved successfully',
            cap_table: valuation.cap_table
        });
    } catch (error) {
        console.error('Error updating cap table:', error);
        return NextResponse.json(
            { error: 'Failed to update cap table data' },
            { status: 500 }
        );
    }
}