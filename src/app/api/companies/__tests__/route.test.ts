import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import db from '@/lib/database/jsonDb'

// Mock the database
jest.mock('@/lib/database/jsonDb', () => ({
  getAllCompanies: jest.fn(),
  createCompany: jest.fn(),
}))

const mockDb = db as jest.Mocked<typeof db>

// Helper function to create mock requests
function createMockRequest(method: string, url: string, body?: any): NextRequest {
  const request = new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return request
}

// Sample test data
const sampleCompany = {
  id: 1,
  name: 'Test Company',
  legal_name: 'Test Company LLC',
  industry: 'Technology',
  stage: 'Series A',
  location: 'San Francisco, CA',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

const sampleCompanies = [
  sampleCompany,
  {
    id: 2,
    name: 'Another Company',
    legal_name: 'Another Company Inc',
    industry: 'Healthcare',
    stage: 'Seed',
    location: 'New York, NY',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
]

describe('/api/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/companies', () => {
    it('should return all companies with default pagination', async () => {
      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest('GET', 'http://localhost:3000/api/companies')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data).toEqual({
        data: sampleCompanies,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1,
        },
      })

      expect(mockDb.getAllCompanies).toHaveBeenCalledTimes(1)
    })

    it('should apply pagination correctly', async () => {
      const manyCompanies = Array.from({ length: 25 }, (_, i) => ({
        ...sampleCompany,
        id: i + 1,
        name: `Company ${i + 1}`,
      }))

      mockDb.getAllCompanies.mockReturnValue(manyCompanies)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/companies?page=2&limit=10'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(10)
      expect(data.data[0].name).toBe('Company 11')
      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        pages: 3,
      })
    })

    it('should filter by company_id', async () => {
      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest('GET', 'http://localhost:3000/api/companies?company_id=1')
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe(1)
    })

    it('should filter by date range', async () => {
      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/companies?date_from=2024-01-01&date_to=2024-01-01'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0].id).toBe(1)
    })

    it('should handle invalid pagination parameters', async () => {
      const request = createMockRequest(
        'GET',
        'http://localhost:3000/api/companies?page=0&limit=-1'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation Error')
      expect(data.details).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      mockDb.getAllCompanies.mockImplementation(() => {
        throw new Error('Database error')
      })

      const request = createMockRequest('GET', 'http://localhost:3000/api/companies')
      const response = await GET(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('Failed to fetch companies')
    })
  })

  describe('POST /api/companies', () => {
    const validCompanyData = {
      name: 'New Company',
      legal_name: 'New Company LLC',
      industry: 'Technology',
      stage: 'Seed',
      location: 'Austin, TX',
    }

    it('should create a new company successfully', async () => {
      const createdCompany = { ...validCompanyData, id: 3 }
      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)
      mockDb.createCompany.mockReturnValue(createdCompany)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/companies',
        validCompanyData
      )
      const response = await POST(request)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.data).toEqual(createdCompany)
      expect(data.message).toBe('Company created successfully')

      expect(mockDb.createCompany).toHaveBeenCalledWith(validCompanyData)
    })

    it('should validate required fields', async () => {
      const invalidData = {
        legal_name: 'Company without name',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/companies', invalidData)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation Error')
      expect(data.details).toBeDefined()
      expect(data.details.some((error: any) => error.field === 'name')).toBe(true)
    })

    it('should reject empty company name', async () => {
      const invalidData = {
        name: '',
        industry: 'Technology',
      }

      const request = createMockRequest('POST', 'http://localhost:3000/api/companies', invalidData)
      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation Error')
      expect(data.details.some((error: any) => error.message.includes('required'))).toBe(true)
    })

    it('should reject duplicate company names', async () => {
      const duplicateData = {
        name: 'Test Company', // Same as existing company
        industry: 'Technology',
      }

      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/companies',
        duplicateData
      )
      const response = await POST(request)

      expect(response.status).toBe(409)

      const data = await response.json()
      expect(data.error).toBe('Validation Error')
      expect(data.message).toBe('A company with this name already exists')
    })

    it('should handle case-insensitive duplicate names', async () => {
      const duplicateData = {
        name: 'TEST COMPANY', // Same as existing but different case
        industry: 'Technology',
      }

      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/companies',
        duplicateData
      )
      const response = await POST(request)

      expect(response.status).toBe(409)
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Validation Error')
      expect(data.details.some((error: any) => error.code === 'INVALID_JSON')).toBe(true)
    })

    it('should handle database errors during creation', async () => {
      mockDb.getAllCompanies.mockReturnValue([])
      mockDb.createCompany.mockImplementation(() => {
        throw new Error('Database error')
      })

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/companies',
        validCompanyData
      )
      const response = await POST(request)

      expect(response.status).toBe(500)

      const data = await response.json()
      expect(data.error).toBe('Internal Server Error')
      expect(data.message).toBe('Failed to create company')
    })

    it('should trim and validate optional fields', async () => {
      const dataWithOptionals = {
        ...validCompanyData,
        legal_name: '   Trimmed Company LLC   ',
        industry: '',
        stage: undefined,
      }

      mockDb.getAllCompanies.mockReturnValue([])
      mockDb.createCompany.mockReturnValue({ ...dataWithOptionals, id: 3 })

      const request = createMockRequest(
        'POST',
        'http://localhost:3000/api/companies',
        dataWithOptionals
      )
      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(mockDb.createCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validCompanyData.name,
          legal_name: '   Trimmed Company LLC   ', // Should handle trimming in validation
        })
      )
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to POST requests', async () => {
      mockDb.getAllCompanies.mockReturnValue([])
      mockDb.createCompany.mockReturnValue({ ...sampleCompany, id: Date.now() })

      const validData = { name: 'Rate Limit Test Company' }

      // Make 21 requests (rate limit is 20 per minute)
      const requests = Array.from({ length: 21 }, (_, i) =>
        createMockRequest('POST', 'http://localhost:3000/api/companies', {
          ...validData,
          name: `${validData.name} ${i}`,
        })
      )

      const responses = await Promise.all(requests.map((request) => POST(request)))

      // First 20 should succeed, 21st should be rate limited
      const successResponses = responses.filter((r) => r.status === 201)
      const rateLimitedResponses = responses.filter((r) => r.status === 429)

      expect(successResponses.length).toBeGreaterThan(0)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Logging', () => {
    let consoleSpy: jest.SpyInstance

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleSpy.mockRestore()
    })

    it('should log API requests', async () => {
      mockDb.getAllCompanies.mockReturnValue(sampleCompanies)

      const request = createMockRequest('GET', 'http://localhost:3000/api/companies')
      await GET(request)

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/companies',
          timestamp: expect.any(String),
        })
      )

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Response:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/companies',
          status: 200,
          duration: expect.stringMatching(/\d+ms/),
        })
      )
    })

    it('should log API errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      mockDb.getAllCompanies.mockImplementation(() => {
        throw new Error('Test error')
      })

      const request = createMockRequest('GET', 'http://localhost:3000/api/companies')
      await GET(request)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/companies',
          error: 'Test error',
          duration: expect.stringMatching(/\d+ms/),
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })
})
