import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/companies/route';
import { GET as getSingle, PUT as updateSingle, DELETE as deleteSingle } from '@/app/api/companies/[id]/route';

// Mock fetch for rate limiting storage
global.fetch = jest.fn();

describe('Companies API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset rate limiting storage
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 0 })
    });
  });

  describe('Complete CRUD Workflow', () => {
    let createdCompanyId: number;

    it('should complete full company CRUD lifecycle', async () => {
      // Step 1: Create a new company
      const createRequest = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Integration Test Company',
          legal_name: 'Integration Test Company LLC',
          industry: 'Technology',
          incorporation_state: 'Delaware',
          incorporation_date: '2024-01-01',
          employees: 50,
          headquarters: 'San Francisco, CA',
          website: 'https://example.com',
          description: 'A test company for integration testing'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const createResponse = await POST(createRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.success).toBe(true);
      expect(createResult.data).toHaveProperty('id');
      expect(createResult.data.name).toBe('Integration Test Company');

      createdCompanyId = createResult.data.id;

      // Step 2: Retrieve the created company
      const getRequest = new NextRequest(`http://localhost:3000/api/companies/${createdCompanyId}`, {
        method: 'GET'
      });

      const getResponse = await getSingle(getRequest, { params: { id: createdCompanyId.toString() } });
      const getResult = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getResult.success).toBe(true);
      expect(getResult.data.id).toBe(createdCompanyId);
      expect(getResult.data.name).toBe('Integration Test Company');

      // Step 3: Update the company
      const updateRequest = new NextRequest(`http://localhost:3000/api/companies/${createdCompanyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Integration Test Company',
          employees: 75,
          description: 'An updated test company'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const updateResponse = await updateSingle(updateRequest, { params: { id: createdCompanyId.toString() } });
      const updateResult = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.name).toBe('Updated Integration Test Company');
      expect(updateResult.data.employees).toBe(75);

      // Step 4: List companies and verify the updated company is included
      const listRequest = new NextRequest('http://localhost:3000/api/companies?limit=10', {
        method: 'GET'
      });

      const listResponse = await GET(listRequest);
      const listResult = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listResult.success).toBe(true);
      expect(Array.isArray(listResult.data)).toBe(true);

      const foundCompany = listResult.data.find((company: any) => company.id === createdCompanyId);
      expect(foundCompany).toBeDefined();
      expect(foundCompany.name).toBe('Updated Integration Test Company');

      // Step 5: Delete the company
      const deleteRequest = new NextRequest(`http://localhost:3000/api/companies/${createdCompanyId}`, {
        method: 'DELETE'
      });

      const deleteResponse = await deleteSingle(deleteRequest, { params: { id: createdCompanyId.toString() } });
      expect(deleteResponse.status).toBe(204);

      // Step 6: Verify deletion by attempting to retrieve
      const verifyDeleteRequest = new NextRequest(`http://localhost:3000/api/companies/${createdCompanyId}`, {
        method: 'GET'
      });

      const verifyDeleteResponse = await getSingle(verifyDeleteRequest, { params: { id: createdCompanyId.toString() } });
      const verifyDeleteResult = await verifyDeleteResponse.json();

      expect(verifyDeleteResponse.status).toBe(404);
      expect(verifyDeleteResult.success).toBe(false);
      expect(verifyDeleteResult.error.message).toContain('not found');
    });
  });

  describe('Validation Error Flows', () => {
    it('should handle validation errors throughout the workflow', async () => {
      // Test creation with invalid data
      const invalidCreateRequest = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Required field is empty
          employees: -5, // Invalid negative number
          website: 'invalid-url', // Invalid URL format
          incorporation_date: 'invalid-date' // Invalid date format
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const invalidCreateResponse = await POST(invalidCreateRequest);
      const invalidCreateResult = await invalidCreateResponse.json();

      expect(invalidCreateResponse.status).toBe(400);
      expect(invalidCreateResult.success).toBe(false);
      expect(invalidCreateResult.error.type).toBe('validation');
      expect(invalidCreateResult.error.details).toHaveProperty('name');
      expect(invalidCreateResult.error.details).toHaveProperty('employees');
      expect(invalidCreateResult.error.details).toHaveProperty('website');

      // Test update with invalid data
      const invalidUpdateRequest = new NextRequest('http://localhost:3000/api/companies/1', {
        method: 'PUT',
        body: JSON.stringify({
          employees: 'not-a-number', // Invalid type
          incorporation_state: 'X'.repeat(101) // Too long
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const invalidUpdateResponse = await updateSingle(invalidUpdateRequest, { params: { id: '1' } });
      const invalidUpdateResult = await invalidUpdateResponse.json();

      expect(invalidUpdateResponse.status).toBe(400);
      expect(invalidUpdateResult.success).toBe(false);
      expect(invalidUpdateResult.error.type).toBe('validation');
    });
  });

  describe('Pagination and Filtering', () => {
    it('should handle complex pagination and filtering scenarios', async () => {
      // Test with various pagination parameters
      const paginationTests = [
        { params: '?page=1&limit=5', expectedLimit: 5 },
        { params: '?page=2&limit=10', expectedLimit: 10 },
        { params: '?limit=100', expectedLimit: 50 }, // Should cap at max limit
        { params: '?page=0&limit=-1', expectedLimit: 10 } // Should use defaults for invalid values
      ];

      for (const test of paginationTests) {
        const request = new NextRequest(`http://localhost:3000/api/companies${test.params}`, {
          method: 'GET'
        });

        const response = await GET(request);
        const result = await response.json();

        expect(response.status).toBe(200);
        expect(result.success).toBe(true);
        expect(result.pagination).toBeDefined();
        expect(result.pagination.limit).toBe(test.expectedLimit);
      }

      // Test filtering
      const filterRequest = new NextRequest('http://localhost:3000/api/companies?industry=Technology&employees_min=10', {
        method: 'GET'
      });

      const filterResponse = await GET(filterRequest);
      const filterResult = await filterResponse.json();

      expect(filterResponse.status).toBe(200);
      expect(filterResult.success).toBe(true);
      expect(Array.isArray(filterResult.data)).toBe(true);
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits across multiple requests', async () => {
      // Mock rate limiting to simulate hitting the limit
      let callCount = 0;
      (global.fetch as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount > 10) { // Simulate rate limit hit
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ count: 101 }) // Over the limit
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ count: callCount })
        });
      });

      // Make multiple requests to trigger rate limiting
      const requests = Array.from({ length: 12 }, () =>
        new NextRequest('http://localhost:3000/api/companies', { method: 'GET' })
      );

      const responses = [];
      for (const request of requests) {
        const response = await GET(request);
        responses.push(response);
      }

      // First 10 should succeed, last 2 should be rate limited
      for (let i = 0; i < 10; i++) {
        expect(responses[i].status).toBe(200);
      }

      for (let i = 10; i < 12; i++) {
        expect(responses[i].status).toBe(429);
        const result = await responses[i].json();
        expect(result.error.type).toBe('rate_limit');
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors gracefully', async () => {
      // Test with an ID that would cause database errors (very large number)
      const problematicId = Number.MAX_SAFE_INTEGER.toString();

      const request = new NextRequest(`http://localhost:3000/api/companies/${problematicId}`, {
        method: 'GET'
      });

      const response = await getSingle(request, { params: { id: problematicId } });
      const result = await response.json();

      // Should handle gracefully, likely returning 404 or 500 depending on implementation
      expect([404, 500].includes(response.status)).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed JSON in request bodies', async () => {
      const malformedRequest = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: '{ invalid json }',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(malformedRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error.type).toBe('validation');
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject requests with invalid content types', async () => {
      const invalidContentTypeRequest = new NextRequest('http://localhost:3000/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Company' }),
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      const response = await POST(invalidContentTypeRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
    });
  });

  describe('Logging Integration', () => {
    it('should log requests and responses appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const request = new NextRequest('http://localhost:3000/api/companies', {
        method: 'GET'
      });

      await GET(request);

      // Should have logged the request
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});