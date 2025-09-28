// Static Swagger specification to avoid runtime parsing issues
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: '409A Valuation Platform API',
    version: '1.0.0',
    description: 'API documentation for the 409A Valuation Platform',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/companies': {
      get: {
        summary: 'List all companies',
        tags: ['Companies'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': {
            description: 'List of companies',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Company' } },
                    meta: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/valuations/{id}/cap-table': {
      get: {
        summary: 'Get capitalization table',
        tags: ['Cap Table'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Cap table data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CapTable' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          industry: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CapTable: {
        type: 'object',
        properties: {
          share_classes: { type: 'array' },
          options: { type: 'array' },
        },
      },
    },
  },
  tags: [
    { name: 'Companies', description: 'Company management' },
    { name: 'Cap Table', description: 'Capitalization table management' },
  ],
}

export default swaggerSpec
