import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/database/optimized-jsonDb';
import ApiHandler from '@/lib/middleware/apiHandler';
import {
  CreateCompanySchema,
  PaginationSchema,
  FilterSchema,
  Company
} from '@/lib/validation/schemas';

// GET /api/companies - Get all companies with pagination and filtering
export const GET = ApiHandler.handle(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const companyId = searchParams.get('company_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Build filter for optimized query
    const dbFilter: Record<string, any> = {};

    if (companyId) {
      dbFilter.id = parseInt(companyId);
    }

    // Use optimized query with pagination and filtering
    const companies = await db.optimizedQuery('companies', {
      filter: dbFilter,
      sort: { field: 'created_at', direction: 'desc' },
      limit: limit,
      offset: (page - 1) * limit,
      cache: true
    });

    // Apply date filters in memory for complex conditions
    let filteredCompanies = companies;
    if (dateFrom || dateTo) {
      filteredCompanies = companies.filter(c => {
        const createdAt = new Date(c.created_at);
        if (dateFrom && createdAt < new Date(dateFrom)) return false;
        if (dateTo && createdAt > new Date(dateTo)) return false;
        return true;
      });
    }

    const total = filteredCompanies.length;

    return NextResponse.json({
      data: filteredCompanies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  },
  {
    cache: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 600 // 10 minutes
    },
    rateLimit: {
      requests: 100,
      window: 60000 // 1 minute
    },
    validation: {
      querySchema: { page: 'optional', limit: 'optional' }
    },
    compression: true,
    security: true,
    monitoring: true
  }
);

// POST /api/companies - Create new company
export const POST = ApiHandler.handle(
  async (request: NextRequest) => {
    const companyData = await request.json();

    // Business logic validation using optimized query
    const existingCompanies = await db.optimizedQuery('companies', {
      filter: {},
      cache: false // Don't cache for validation checks
    });

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

    // Create company using optimized insert
    const company = await db.optimizedInsert('companies', companyData);

    return NextResponse.json({
      data: company,
      message: 'Company created successfully'
    }, { status: 201 });
  },
  {
    rateLimit: {
      requests: 20,
      window: 60000 // 1 minute
    },
    validation: {
      bodySchema: { required: ['name'] }
    },
    compression: true,
    security: true,
    monitoring: true
  }
);