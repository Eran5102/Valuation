import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';

// GET /api/companies - Get all companies
export async function GET() {
    try {
        const companies = db.getAllCompanies();
        return NextResponse.json(companies);
    } catch (error) {
        console.error('Error fetching companies:', error);
        return NextResponse.json(
            { error: 'Failed to fetch companies' },
            { status: 500 }
        );
    }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const company = db.createCompany(body);
        return NextResponse.json(company);
    } catch (error) {
        console.error('Error creating company:', error);
        return NextResponse.json(
            { error: 'Failed to create company' },
            { status: 500 }
        );
    }
}