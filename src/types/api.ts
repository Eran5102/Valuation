// API-related type definitions

import { NextRequest } from 'next/server'

// Base API response types
export interface ApiResponse<T = unknown> {
  data: T
  status: number
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
}

// API Request types
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  search?: string
  filters?: Record<string, string | string[]>
}

// Request context types
export interface RequestContext {
  params: Record<string, string>
  validatedBody?: Record<string, unknown>
  validatedQuery?: Record<string, unknown>
  validatedParams?: Record<string, unknown>
}

// Middleware types
export type ApiHandler<T = unknown> = (
  request: NextRequest,
  context: RequestContext
) => Promise<Response> | Response

export type MiddlewareHandler<T extends ApiHandler = ApiHandler> = (handler: T) => T

// Validation types
export interface ValidationSchema {
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  params?: Record<string, unknown>
}

export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

// Database operation types
export interface DatabaseResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface CompanyCreateRequest {
  name: string
  legal_name?: string
  industry?: string
  stage?: string
  location?: string
}

export interface CompanyUpdateRequest {
  name?: string
  legal_name?: string
  industry?: string
  stage?: string
  location?: string
}

export interface ValuationCreateRequest {
  title: string
  clientName: string
  valuationDate: string
  projectType: string
  currency: string
  maxProjectedYears: number
  discountingConvention: string
  taxRate: number
  description: string
  company_id?: number
}

export interface ValuationUpdateRequest {
  title?: string
  clientName?: string
  valuationDate?: string
  projectType?: string
  status?: string
  currency?: string
  maxProjectedYears?: number
  discountingConvention?: string
  taxRate?: number
  description?: string
}

// Response types for specific endpoints
export interface CompanyListResponse {
  companies: Array<{
    id: number
    name: string
    legal_name?: string
    industry?: string
    stage?: string
    location?: string
    created_at: string
    updated_at: string
  }>
}

export interface ValuationListResponse {
  valuations: Array<{
    id: string
    title: string
    clientName: string
    valuationDate: string
    projectType: string
    status: string
    currency: string
    company_id?: number
    created_at: string
    updated_at: string
  }>
}

// Error response types
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: ValidationError[] | Record<string, unknown>
  }
  status: number
  timestamp: string
}
