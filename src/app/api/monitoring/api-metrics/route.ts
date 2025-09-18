import { NextRequest, NextResponse } from 'next/server';
import ApiHandler from '@/lib/middleware/apiHandler';

// GET /api/monitoring/api-metrics - Get API performance metrics
export const GET = ApiHandler.handle(
  async (request: NextRequest) => {
    try {
      const metrics = ApiHandler.getMetrics();

      return NextResponse.json({
        timestamp: new Date().toISOString(),
        metrics,
        message: 'API metrics retrieved successfully'
      });
    } catch (error) {
      throw error; // Let ApiHandler handle the error
    }
  },
  {
    cache: {
      maxAge: 60, // Cache for 1 minute
      private: true
    },
    monitoring: false, // Avoid circular monitoring
    security: true
  }
);