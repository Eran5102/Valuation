import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}))

describe('/api/valuations', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis()
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/valuations', () => {
    it('should return all valuations', async () => {
      const mockValuations = [
        {
          id: '1',
          company_id: 'comp-1',
          valuation_date: '2024-01-01',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          company_id: 'comp-2',
          valuation_date: '2024-02-01',
          status: 'in_progress',
          created_at: '2024-02-01T00:00:00Z'
        }
      ]

      mockSupabaseClient.select.mockResolvedValue({
        data: mockValuations,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/valuations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockValuations)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('valuations')
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should filter valuations by company_id', async () => {
      const companyId = 'comp-1'
      const mockValuations = [
        {
          id: '1',
          company_id: companyId,
          valuation_date: '2024-01-01',
          status: 'completed'
        }
      ]

      mockSupabaseClient.select.mockResolvedValue({
        data: mockValuations,
        error: null
      })

      const request = new NextRequest(`http://localhost:3000/api/valuations?company_id=${companyId}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockValuations)
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('company_id', companyId)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const request = new NextRequest('http://localhost:3000/api/valuations')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch valuations')
    })
  })

  describe('POST /api/valuations', () => {
    it('should create a new valuation', async () => {
      const newValuation = {
        company_id: 'comp-1',
        valuation_date: '2024-03-01',
        status: 'draft',
        assumptions: {},
        cap_table: []
      }

      const createdValuation = {
        id: '3',
        ...newValuation,
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-01T00:00:00Z'
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: createdValuation,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/valuations', {
        method: 'POST',
        body: JSON.stringify(newValuation)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(createdValuation)
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(newValuation)
    })

    it('should validate required fields', async () => {
      const invalidValuation = {
        // Missing company_id
        valuation_date: '2024-03-01'
      }

      const request = new NextRequest('http://localhost:3000/api/valuations', {
        method: 'POST',
        body: JSON.stringify(invalidValuation)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required field')
    })

    it('should handle creation errors', async () => {
      const newValuation = {
        company_id: 'comp-1',
        valuation_date: '2024-03-01',
        status: 'draft'
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/valuations', {
        method: 'POST',
        body: JSON.stringify(newValuation)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create valuation')
    })
  })
})