import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  withValidation,
  withRateLimit,
  withLogging,
  compose,
  ValidationException,
  BusinessLogicException,
  ValidatedRequest
} from '../validation';

// Helper function to create mock requests
function createMockRequest(method: string, url: string, body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

// Test schemas
const testBodySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0, 'Age must be non-negative')
});

const testQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  filter: z.string().optional()
});

const testParamsSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

describe('Validation Middleware', () => {
  describe('withValidation', () => {
    describe('Body validation', () => {
      const handler = withValidation({
        bodySchema: testBodySchema
      })(async (request: ValidatedRequest) => {
        return NextResponse.json({ data: request.validatedBody });
      });

      it('should validate and pass valid body data', async () => {
        const validBody = { name: 'John', age: 25 };
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', validBody);

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual(validBody);
      });

      it('should reject invalid body data', async () => {
        const invalidBody = { name: '', age: -5 };
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', invalidBody);

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation Error');
        expect(data.details).toHaveLength(2);
        expect(data.details[0].field).toBe('name');
        expect(data.details[1].field).toBe('age');
      });

      it('should reject malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'invalid json'
        });

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation Error');
        expect(data.details[0].code).toBe('INVALID_JSON');
      });

      it('should skip body validation for GET requests', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test');

        const response = await handler(request, {});

        expect(response.status).toBe(200);
      });
    });

    describe('Query validation', () => {
      const handler = withValidation({
        querySchema: testQuerySchema
      })(async (request: ValidatedRequest) => {
        return NextResponse.json({ data: request.validatedQuery });
      });

      it('should validate and parse query parameters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test?page=2&limit=20&filter=active');

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data).toEqual({
          page: 2,
          limit: 20,
          filter: 'active'
        });
      });

      it('should apply default values for missing query parameters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test');

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.page).toBe(1);
        expect(data.data.limit).toBe(10);
      });

      it('should convert string numbers to actual numbers', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test?page=3&limit=50');

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(typeof data.data.page).toBe('number');
        expect(typeof data.data.limit).toBe('number');
      });

      it('should reject invalid query parameters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test?page=0&limit=200');

        const response = await handler(request, {});
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation Error');
      });
    });

    describe('Params validation', () => {
      const handler = withValidation({
        paramsSchema: testParamsSchema
      })(async (request: ValidatedRequest) => {
        return NextResponse.json({ data: request.validatedParams });
      });

      it('should validate route parameters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test/123');

        const response = await handler(request, { params: { id: '123' } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.id).toBe('123');
      });

      it('should reject invalid parameters', async () => {
        const request = createMockRequest('GET', 'http://localhost:3000/api/test/');

        const response = await handler(request, { params: { id: '' } });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Validation Error');
      });
    });

    describe('Skip validation', () => {
      const handler = withValidation({
        bodySchema: testBodySchema,
        skipValidation: true
      })(async (request: ValidatedRequest) => {
        return NextResponse.json({ success: true });
      });

      it('should skip validation when skipValidation is true', async () => {
        const invalidBody = { name: '', age: -5 };
        const request = createMockRequest('POST', 'http://localhost:3000/api/test', invalidBody);

        const response = await handler(request, {});

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle ValidationException correctly', async () => {
      const handler = async () => {
        throw new ValidationException([
          { field: 'test', message: 'Test error', code: 'TEST_ERROR' }
        ]);
      };

      const wrappedHandler = withValidation({})(handler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');

      const response = await wrappedHandler(request, {});
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation Error');
      expect(data.details[0].field).toBe('test');
    });

    it('should handle BusinessLogicException correctly', async () => {
      const handler = async () => {
        throw new BusinessLogicException('Business rule violated', 'BUSINESS_ERROR', 422);
      };

      const wrappedHandler = withValidation({})(handler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');

      const response = await wrappedHandler(request, {});
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toBe('BUSINESS_ERROR');
      expect(data.message).toBe('Business rule violated');
    });

    it('should handle unexpected errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const handler = async () => {
        throw new Error('Unexpected error');
      };

      const wrappedHandler = withValidation({})(handler);
      const request = createMockRequest('GET', 'http://localhost:3000/api/test');

      const response = await wrappedHandler(request, {});
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unexpected error in validation middleware:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Rate limiting middleware', () => {
    it('should allow requests within limit', async () => {
      const handler = withRateLimit(5, 1000)(async () => {
        return NextResponse.json({ success: true });
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      const response = await handler(request, {});

      expect(response.status).toBe(200);
    });

    it('should block requests exceeding limit', async () => {
      const handler = withRateLimit(2, 10000)(async () => {
        return NextResponse.json({ success: true });
      });

      const request1 = createMockRequest('GET', 'http://localhost:3000/api/test');
      const request2 = createMockRequest('GET', 'http://localhost:3000/api/test');
      const request3 = createMockRequest('GET', 'http://localhost:3000/api/test');

      // Add X-Forwarded-For header to simulate same IP
      request1.headers.set('x-forwarded-for', '192.168.1.1');
      request2.headers.set('x-forwarded-for', '192.168.1.1');
      request3.headers.set('x-forwarded-for', '192.168.1.1');

      const response1 = await handler(request1, {});
      const response2 = await handler(request2, {});
      const response3 = await handler(request3, {});

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(429);

      const data = await response3.json();
      expect(data.error).toBe('Rate Limit Exceeded');
    });
  });

  describe('Logging middleware', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log requests and responses', async () => {
      const handler = withLogging()(async () => {
        return NextResponse.json({ success: true });
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test?param=value');
      await handler(request, {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          timestamp: expect.any(String)
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Response:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          status: 200,
          duration: expect.stringMatching(/\d+ms/)
        })
      );
    });

    it('should log query parameters when enabled', async () => {
      const handler = withLogging({ includeQuery: true })(async () => {
        return NextResponse.json({ success: true });
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test?param=value&num=123');
      await handler(request, {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          query: { param: 'value', num: '123' }
        })
      );
    });

    it('should log request body when enabled', async () => {
      const handler = withLogging({ includeBody: true })(async () => {
        return NextResponse.json({ success: true });
      });

      const body = { name: 'test', value: 123 };
      const request = createMockRequest('POST', 'http://localhost:3000/api/test', body);
      await handler(request, {});

      expect(consoleSpy).toHaveBeenCalledWith(
        'API Request:',
        expect.objectContaining({
          method: 'POST',
          body: body
        })
      );
    });

    it('should log errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const handler = withLogging()(async () => {
        throw new Error('Test error');
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');

      try {
        await handler(request, {});
      } catch (error) {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          error: 'Test error',
          duration: expect.stringMatching(/\d+ms/)
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Middleware composition', () => {
    it('should compose multiple middlewares correctly', async () => {
      const handler = compose(
        withLogging(),
        withValidation({
          querySchema: z.object({
            test: z.string()
          })
        }),
        withRateLimit(10, 1000)
      )(async (request: ValidatedRequest) => {
        return NextResponse.json({ data: request.validatedQuery });
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test?test=value');
      const response = await handler(request, {});

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data.test).toBe('value');
    });

    it('should handle errors in composed middlewares', async () => {
      const handler = compose(
        withLogging(),
        withValidation({
          querySchema: z.object({
            required: z.string()
          })
        })
      )(async () => {
        return NextResponse.json({ success: true });
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/test');
      const response = await handler(request, {});

      expect(response.status).toBe(400);
    });
  });
});