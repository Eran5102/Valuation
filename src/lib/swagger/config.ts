import { Options } from 'swagger-jsdoc'

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '409A Valuation Platform API',
    version: '1.0.0',
    description: `
      API documentation for the 409A Valuation Platform.
      This API provides endpoints for managing valuations, cap tables, companies, and reports.
    `,
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://valuation.app',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key authentication',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
          },
          statusCode: {
            type: 'number',
            description: 'HTTP status code',
          },
        },
      },
      Company: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique company identifier',
          },
          name: {
            type: 'string',
            description: 'Company name',
          },
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol',
          },
          industry: {
            type: 'string',
            description: 'Industry sector',
          },
          founded_date: {
            type: 'string',
            format: 'date',
            description: 'Company founding date',
          },
          headquarters: {
            type: 'string',
            description: 'Company headquarters location',
          },
          description: {
            type: 'string',
            description: 'Company description',
          },
          website: {
            type: 'string',
            format: 'uri',
            description: 'Company website URL',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['id', 'name'],
      },
      Valuation: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique valuation identifier',
          },
          company_id: {
            type: 'string',
            format: 'uuid',
            description: 'Associated company ID',
          },
          title: {
            type: 'string',
            description: 'Valuation title',
          },
          valuation_date: {
            type: 'string',
            format: 'date',
            description: 'Date of valuation',
          },
          status: {
            type: 'string',
            enum: ['draft', 'in_progress', 'review', 'completed', 'archived'],
            description: 'Current valuation status',
          },
          fair_market_value: {
            type: 'number',
            format: 'float',
            description: 'Fair market value per share',
          },
          preferred_price: {
            type: 'number',
            format: 'float',
            description: 'Preferred share price',
          },
          cap_table: {
            type: 'object',
            description: 'Capitalization table data',
            properties: {
              share_classes: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ShareClass',
                },
              },
              options: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/OptionGrant',
                },
              },
            },
          },
          assumptions: {
            type: 'object',
            description: 'Valuation assumptions and parameters',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
          },
        },
        required: ['id', 'company_id', 'title', 'valuation_date', 'status'],
      },
      ShareClass: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Share class identifier',
          },
          name: {
            type: 'string',
            description: 'Share class name (e.g., Series A, Common)',
          },
          type: {
            type: 'string',
            enum: ['common', 'preferred'],
            description: 'Type of share class',
          },
          shares_authorized: {
            type: 'number',
            description: 'Number of authorized shares',
          },
          shares_outstanding: {
            type: 'number',
            description: 'Number of outstanding shares',
          },
          price_per_share: {
            type: 'number',
            format: 'float',
            description: 'Price per share',
          },
          liquidation_preference: {
            type: 'number',
            format: 'float',
            description: 'Liquidation preference multiplier',
          },
          participation_rights: {
            type: 'boolean',
            description: 'Has participation rights',
          },
          conversion_ratio: {
            type: 'number',
            format: 'float',
            description: 'Conversion ratio to common',
          },
          dividends_rate: {
            type: 'number',
            format: 'float',
            description: 'Dividend rate percentage',
          },
        },
        required: ['id', 'name', 'type', 'shares_outstanding'],
      },
      OptionGrant: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Option grant identifier',
          },
          grant_date: {
            type: 'string',
            format: 'date',
            description: 'Date of grant',
          },
          expiration_date: {
            type: 'string',
            format: 'date',
            description: 'Expiration date',
          },
          shares: {
            type: 'number',
            description: 'Number of option shares',
          },
          strike_price: {
            type: 'number',
            format: 'float',
            description: 'Strike/exercise price',
          },
          vested_shares: {
            type: 'number',
            description: 'Number of vested shares',
          },
          status: {
            type: 'string',
            enum: ['active', 'exercised', 'expired', 'cancelled'],
            description: 'Option status',
          },
        },
        required: ['id', 'grant_date', 'shares', 'strike_price'],
      },
      ReportTemplate: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Template identifier',
          },
          name: {
            type: 'string',
            description: 'Template name',
          },
          description: {
            type: 'string',
            description: 'Template description',
          },
          category: {
            type: 'string',
            description: 'Template category',
          },
          version: {
            type: 'string',
            description: 'Template version',
          },
          sections: {
            type: 'array',
            description: 'Report sections',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                },
                title: {
                  type: 'string',
                },
                blocks: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        required: ['id', 'name', 'sections'],
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Authentication and authorization endpoints',
    },
    {
      name: 'Companies',
      description: 'Company management endpoints',
    },
    {
      name: 'Valuations',
      description: 'Valuation management and calculations',
    },
    {
      name: 'Cap Table',
      description: 'Capitalization table management',
    },
    {
      name: 'Reports',
      description: 'Report generation and templates',
    },
    {
      name: 'Organizations',
      description: 'Multi-tenant organization management',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
  ],
}

export const swaggerOptions: Options = {
  definition: swaggerDefinition,
  apis: [], // We'll manually add specs instead of parsing files
}

export default swaggerOptions
