# API Documentation with Swagger

This application now includes Swagger/OpenAPI documentation for all API endpoints.

## Accessing the Documentation

### 1. Interactive Swagger UI

Visit `/api-docs` in your browser to access the interactive Swagger UI interface:

```
http://localhost:4000/api-docs
```

### 2. OpenAPI Specification

The raw OpenAPI specification is available at:

```
http://localhost:4000/api/docs
```

## Adding Documentation to New Endpoints

To document a new API endpoint, add JSDoc comments with Swagger annotations above your route handler:

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description of what this endpoint does
 *     tags:
 *       - Category Name
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: paramName
 *         schema:
 *           type: string
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/YourModel'
 */
export async function GET(request: NextRequest) {
  // Your handler code
}
```

## Available Tags

The API is organized into the following categories:

- **Authentication** - Login, signup, and token management
- **Companies** - Company CRUD operations
- **Valuations** - Valuation management and calculations
- **Cap Table** - Capitalization table operations
- **Reports** - Report generation and templates
- **Organizations** - Multi-tenant organization management
- **Users** - User management

## Authentication

Most endpoints require authentication. The API supports:

1. **Bearer Token (JWT)**
   - Add your JWT token in the Authorization header
   - Format: `Authorization: Bearer YOUR_TOKEN`

2. **API Key** (if configured)
   - Add your API key in the X-API-Key header
   - Format: `X-API-Key: YOUR_API_KEY`

## Schemas

Common data models are defined in `/src/lib/swagger/config.ts`:

- `Company` - Company entity
- `Valuation` - Valuation project
- `ShareClass` - Share class in cap table
- `OptionGrant` - Option grants
- `ReportTemplate` - Report template structure

## Testing with Swagger UI

1. Navigate to `/api-docs`
2. Click on "Authorize" button to add your authentication token
3. Expand any endpoint to see details
4. Click "Try it out" to test the endpoint
5. Fill in required parameters
6. Click "Execute" to send the request
7. View the response below

## Configuration

Swagger configuration is located in:

- `/src/lib/swagger/config.ts` - Main configuration and schemas
- `/src/lib/swagger/swagger.ts` - Spec generation
- `/src/app/api/docs/route.ts` - API endpoint for spec
- `/src/app/api-docs/page.tsx` - Swagger UI page

## Examples of Documented Endpoints

### Companies

- `GET /api/companies` - List all companies with pagination
- `POST /api/companies` - Create a new company
- `GET /api/companies/{id}` - Get company by ID
- `PUT /api/companies/{id}` - Update company
- `DELETE /api/companies/{id}` - Delete company

### Cap Table

- `GET /api/valuations/{id}/cap-table` - Get cap table for valuation
- `PUT /api/valuations/{id}/cap-table` - Update cap table
- `POST /api/valuations/{id}/cap-table/share-class` - Add share class
- `DELETE /api/valuations/{id}/cap-table/share-class/{classId}` - Remove share class

## Extending the Documentation

To add more endpoints:

1. Add JSDoc Swagger comments to your route handlers
2. Include the file path in `swaggerOptions.apis` array in `/src/lib/swagger/config.ts`
3. Add any new schemas to the `components.schemas` section
4. Restart the development server to regenerate the spec

## Troubleshooting

- **Documentation not updating**: Clear Next.js cache and restart the dev server
- **Authentication required**: Some endpoints require authentication even for viewing docs
- **CORS issues**: Ensure your API allows requests from the documentation domain

## Benefits

- **Interactive Testing**: Test API endpoints directly from the browser
- **Type Safety**: Generated from TypeScript types and schemas
- **Auto-generated**: Documentation stays in sync with code
- **Standards Compliant**: Follows OpenAPI 3.0 specification
- **Client Generation**: Can generate API clients in any language

## Next Steps

1. Document remaining API endpoints
2. Add request/response examples
3. Configure authentication for production
4. Set up automated API testing with Swagger
5. Generate client SDKs from the OpenAPI spec
