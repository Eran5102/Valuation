import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

// GET /api/companies/[id] - Get company by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const company = db.getCompanyById(id);
        
        if (!company) {
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
        const id = parseInt(idParam);
        const body = await request.json();
        
        // Validate status if provided
        if (body.status && !['active', 'inactive', 'prospect'].includes(body.status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be one of: active, inactive, prospect' },
                { status: 400 }
            );
        }
        
        const updatedCompany = db.updateCompany(id, body);
        
        if (!updatedCompany) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(updatedCompany);
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
        const id = parseInt(idParam);
        
        const deleted = db.deleteCompany(id);
        
        if (!deleted) {
            return NextResponse.json(
                { error: 'Company not found' },
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