# API Documentation

## Base URL
```
Production: https://api.409avaluation.com
Staging: https://staging-api.409avaluation.com
Development: http://localhost:3000
```

## Authentication
All API requests require authentication via Supabase JWT token:
```
Authorization: Bearer <token>
```

## Response Format
All responses follow this format:
```json
{
  "data": {},
  "error": null,
  "meta": {
    "timestamp": "2024-03-01T12:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Handling
Error responses:
```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Endpoints

### Valuations

#### GET /api/valuations
Retrieve all valuations

**Query Parameters:**
- `company_id` (string): Filter by company
- `status` (string): Filter by status (draft|in_progress|completed)
- `from_date` (string): Start date range
- `to_date` (string): End date range
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "company_id": "uuid",
      "valuation_date": "2024-03-01",
      "status": "completed",
      "created_at": "2024-03-01T12:00:00Z",
      "updated_at": "2024-03-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/valuations
Create a new valuation

**Request Body:**
```json
{
  "company_id": "uuid",
  "valuation_date": "2024-03-01",
  "status": "draft",
  "assumptions": {},
  "cap_table": []
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "valuation_date": "2024-03-01",
    "status": "draft",
    "created_at": "2024-03-01T12:00:00Z"
  }
}
```

#### GET /api/valuations/{id}
Retrieve a specific valuation

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "valuation_date": "2024-03-01",
    "status": "completed",
    "assumptions": {
      "current_year_revenue": 5000000,
      "revenue_growth_rate": 0.25,
      "ebitda_margin": 0.15,
      "discount_rate": 0.12
    },
    "cap_table": [],
    "waterfall": {},
    "created_at": "2024-03-01T12:00:00Z",
    "updated_at": "2024-03-01T12:00:00Z"
  }
}
```

#### PUT /api/valuations/{id}
Update a valuation

**Request Body:**
```json
{
  "status": "in_progress",
  "assumptions": {
    "discount_rate": 0.15
  }
}
```

#### DELETE /api/valuations/{id}
Delete a valuation

**Response:**
```json
{
  "data": {
    "message": "Valuation deleted successfully"
  }
}
```

### Assumptions

#### GET /api/valuations/{id}/assumptions
Get valuation assumptions

**Response:**
```json
{
  "data": {
    "financial": {
      "current_year_revenue": 5000000,
      "revenue_growth_rate": 0.25,
      "ebitda_margin": 0.15
    },
    "valuation": {
      "discount_rate": 0.12,
      "terminal_growth_rate": 0.03
    },
    "market": {
      "risk_free_rate": 0.045,
      "market_risk_premium": 0.065
    }
  }
}
```

#### PUT /api/valuations/{id}/assumptions
Update valuation assumptions

**Request Body:**
```json
{
  "financial": {
    "current_year_revenue": 6000000
  }
}
```

### Cap Table

#### GET /api/valuations/{id}/cap-table
Get cap table data

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "shareType": "common",
      "shareClassName": "Common Stock",
      "sharesOutstanding": 10000000,
      "pricePerShare": 0.01,
      "amountInvested": 100000,
      "ownershipPercentage": 60
    },
    {
      "id": "uuid",
      "shareType": "preferred",
      "shareClassName": "Series A",
      "sharesOutstanding": 2000000,
      "pricePerShare": 1.00,
      "lpMultiple": 1,
      "amountInvested": 2000000,
      "ownershipPercentage": 20
    }
  ],
  "meta": {
    "totalShares": 12000000,
    "totalInvested": 2100000
  }
}
```

#### POST /api/valuations/{id}/cap-table
Add share class to cap table

**Request Body:**
```json
{
  "shareType": "preferred",
  "shareClassName": "Series B",
  "sharesOutstanding": 1000000,
  "pricePerShare": 2.00,
  "lpMultiple": 1.5,
  "conversionRatio": 1,
  "dividendsDeclared": false
}
```

#### PUT /api/valuations/{id}/cap-table/{shareId}
Update share class

#### DELETE /api/valuations/{id}/cap-table/{shareId}
Remove share class

### Waterfall Analysis

#### GET /api/valuations/{id}/waterfall
Calculate waterfall distribution

**Query Parameters:**
- `exit_value` (number): Exit valuation amount

**Response:**
```json
{
  "data": {
    "exitValue": 50000000,
    "distributions": [
      {
        "shareClass": "Series B",
        "amount": 3000000,
        "percentage": 6,
        "type": "liquidation_preference"
      },
      {
        "shareClass": "Series A",
        "amount": 2000000,
        "percentage": 4,
        "type": "liquidation_preference"
      },
      {
        "shareClass": "Common Stock",
        "amount": 45000000,
        "percentage": 90,
        "type": "residual"
      }
    ],
    "totalDistributed": 50000000
  }
}
```

### Breakpoints

#### GET /api/valuations/{id}/breakpoints
Generate breakpoint analysis

**Query Parameters:**
- `min_value` (number): Minimum valuation
- `max_value` (number): Maximum valuation
- `step` (number): Step increment

**Response:**
```json
{
  "data": [
    {
      "valuation": 10000000,
      "distributions": {
        "Common Stock": 6000000,
        "Series A": 2500000,
        "Series B": 1500000
      },
      "percentages": {
        "Common Stock": 60,
        "Series A": 25,
        "Series B": 15
      }
    }
  ]
}
```

### Companies

#### GET /api/companies
List all companies

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tech Corp Inc.",
      "industry": "Technology",
      "founded_date": "2020-01-01",
      "status": "active",
      "latest_valuation": {
        "id": "uuid",
        "valuation_date": "2024-03-01",
        "status": "completed"
      }
    }
  ]
}
```

#### POST /api/companies
Create a new company

**Request Body:**
```json
{
  "name": "New Company Inc.",
  "industry": "Technology",
  "founded_date": "2020-01-01",
  "description": "Company description"
}
```

#### GET /api/companies/{id}
Get company details

#### PUT /api/companies/{id}
Update company

#### DELETE /api/companies/{id}
Delete company

### Field Mappings

#### GET /api/field-mappings
Get field mapping configuration

**Response:**
```json
{
  "data": {
    "company": {
      "name": { "required": true, "type": "string" },
      "industry": { "required": false, "type": "string" }
    },
    "valuation": {
      "discount_rate": { "required": true, "type": "number", "min": 0, "max": 1 }
    }
  }
}
```

### External Data

#### GET /api/external/treasury-yield-curve
Get current treasury rates

**Response:**
```json
{
  "data": {
    "date": "2024-03-01",
    "rates": {
      "1M": 5.43,
      "3M": 5.39,
      "6M": 5.30,
      "1Y": 4.95,
      "2Y": 4.62,
      "3Y": 4.43,
      "5Y": 4.25,
      "10Y": 4.25,
      "20Y": 4.45,
      "30Y": 4.38
    }
  }
}
```

### Reports

#### POST /api/valuations/{id}/generate-report
Generate 409A report

**Request Body:**
```json
{
  "template": "standard_409a",
  "format": "pdf",
  "sections": {
    "executive_summary": true,
    "assumptions": true,
    "cap_table": true,
    "waterfall": true,
    "dlom_analysis": true
  }
}
```

**Response:**
```json
{
  "data": {
    "reportId": "uuid",
    "status": "generating",
    "estimatedTime": 30
  }
}
```

#### GET /api/reports/{id}/status
Check report generation status

**Response:**
```json
{
  "data": {
    "reportId": "uuid",
    "status": "completed",
    "downloadUrl": "/api/reports/uuid/download"
  }
}
```

#### GET /api/reports/{id}/download
Download generated report

## Rate Limiting
- 100 requests per minute per API key
- 1000 requests per hour per API key
- 10000 requests per day per API key

## Webhooks

### Available Events
- `valuation.created`
- `valuation.updated`
- `valuation.completed`
- `report.generated`
- `company.created`

### Webhook Payload
```json
{
  "event": "valuation.completed",
  "timestamp": "2024-03-01T12:00:00Z",
  "data": {
    "valuationId": "uuid",
    "companyId": "uuid"
  }
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Rate Limited
- `500` - Internal Server Error
- `503` - Service Unavailable

## SDK Examples

### JavaScript/TypeScript
```typescript
import { ValuationAPI } from '@409a/sdk'

const api = new ValuationAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.409avaluation.com'
})

// Get valuations
const valuations = await api.valuations.list({
  companyId: 'uuid',
  status: 'completed'
})

// Create valuation
const valuation = await api.valuations.create({
  companyId: 'uuid',
  valuationDate: '2024-03-01'
})
```

### Python
```python
from valuation_api import ValuationAPI

api = ValuationAPI(
    api_key='your-api-key',
    base_url='https://api.409avaluation.com'
)

# Get valuations
valuations = api.valuations.list(
    company_id='uuid',
    status='completed'
)

# Create valuation
valuation = api.valuations.create(
    company_id='uuid',
    valuation_date='2024-03-01'
)
```

### cURL
```bash
# Get valuations
curl -X GET \
  'https://api.409avaluation.com/api/valuations?company_id=uuid' \
  -H 'Authorization: Bearer your-token'

# Create valuation
curl -X POST \
  'https://api.409avaluation.com/api/valuations' \
  -H 'Authorization: Bearer your-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "company_id": "uuid",
    "valuation_date": "2024-03-01"
  }'
```