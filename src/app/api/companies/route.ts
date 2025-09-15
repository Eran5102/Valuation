import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/jsonDb';
import {
  CreateCompanySchema,
  PaginationSchema,
  FilterSchema,
  Company
} from '@/lib/validation/schemas';
import {
  withValidation,
  withLogging,
  withRateLimit,
  compose,
  ValidatedRequest
} from '@/lib/middleware/validation';

// GET /api/companies - Get all companies with pagination and filtering
export const GET = compose(
  withLogging(),
  withRateLimit(100, 60000), // 100 requests per minute
  withValidation({
    querySchema: PaginationSchema.merge(FilterSchema.partial())
  })
)(async (request: ValidatedRequest) => {
  try {
    const { page = 1, limit = 20, ...filters } = request.validatedQuery || {};

    // Get all companies
    let companies = db.getAllCompanies();

    // Apply filters
    if (filters.company_id) {
      companies = companies.filter(c => c.id === filters.company_id);
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      companies = companies.filter(c => new Date(c.created_at) >= fromDate);
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      companies = companies.filter(c => new Date(c.created_at) <= toDate);
    }

    // Apply pagination
    const total = companies.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompanies = companies.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedCompanies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to fetch companies',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// POST /api/companies - Create new company
export const POST = compose(
  withLogging({ includeBody: true }),
  withRateLimit(20, 60000), // 20 creates per minute
  withValidation({
    bodySchema: CreateCompanySchema
  })
)(async (request: ValidatedRequest) => {
  try {
    const companyData = request.validatedBody;

    // Business logic validation
    const existingCompanies = db.getAllCompanies();
    const nameExists = existingCompanies.some(
      company => company.name.toLowerCase() === companyData.name.toLowerCase()
    );

    if (nameExists) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'A company with this name already exists',
          timestamp: new Date().toISOString()
        },
        { status: 409 }
      );
    }

    // Create company
    const company = db.createCompany(companyData);

    return NextResponse.json({
      data: company,
      message: 'Company created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to create company',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});