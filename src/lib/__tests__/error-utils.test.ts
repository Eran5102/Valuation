import {
  parseErrorMessage,
  isNetworkError,
  isValidationError,
  isAuthError,
  formatErrorForUser,
  logError,
  createErrorBoundary,
  retryWithBackoff,
  ErrorWithCode,
  ValidationError,
  NetworkError,
  AuthError
} from '../error-utils'

// Mock console methods
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('error-utils', () => {
  beforeEach(() => {
    console.error = jest.fn()
    console.warn = jest.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  // Test parseErrorMessage
  describe('parseErrorMessage', () => {
    it('should parse Error object', () => {
      const error = new Error('Test error')
      expect(parseErrorMessage(error)).toBe('Test error')
    })

    it('should parse string error', () => {
      expect(parseErrorMessage('String error')).toBe('String error')
    })

    it('should parse object with message property', () => {
      const error = { message: 'Object error' }
      expect(parseErrorMessage(error)).toBe('Object error')
    })

    it('should parse object with error property', () => {
      const error = { error: 'Nested error' }
      expect(parseErrorMessage(error)).toBe('Nested error')
    })

    it('should handle null and undefined', () => {
      expect(parseErrorMessage(null)).toBe('An unknown error occurred')
      expect(parseErrorMessage(undefined)).toBe('An unknown error occurred')
    })

    it('should stringify other objects', () => {
      const error = { code: 'ERR_001', details: 'Some error' }
      expect(parseErrorMessage(error)).toBe(JSON.stringify(error))
    })
  })

  // Test error type checking functions
  describe('error type checking', () => {
    it('should identify network errors', () => {
      const networkError = new NetworkError('Network failed')
      const regularError = new Error('Regular error')

      expect(isNetworkError(networkError)).toBe(true)
      expect(isNetworkError(regularError)).toBe(false)
    })

    it('should identify validation errors', () => {
      const validationError = new ValidationError('Invalid input')
      const regularError = new Error('Regular error')

      expect(isValidationError(validationError)).toBe(true)
      expect(isValidationError(regularError)).toBe(false)
    })

    it('should identify auth errors', () => {
      const authError = new AuthError('Unauthorized')
      const regularError = new Error('Regular error')

      expect(isAuthError(authError)).toBe(true)
      expect(isAuthError(regularError)).toBe(false)
    })
  })

  // Test formatErrorForUser
  describe('formatErrorForUser', () => {
    it('should format network errors', () => {
      const error = new NetworkError('Connection timeout')
      const formatted = formatErrorForUser(error)

      expect(formatted).toContain('network')
      expect(formatted).toContain('try again')
    })

    it('should format validation errors', () => {
      const error = new ValidationError('Email is invalid')
      const formatted = formatErrorForUser(error)

      expect(formatted).toContain('Email is invalid')
    })

    it('should format auth errors', () => {
      const error = new AuthError('Invalid token')
      const formatted = formatErrorForUser(error)

      expect(formatted).toContain('sign in again')
    })

    it('should format generic errors', () => {
      const error = new Error('Something went wrong')
      const formatted = formatErrorForUser(error)

      expect(formatted).toBe('Something went wrong')
    })

    it('should provide fallback option', () => {
      const error = null
      const formatted = formatErrorForUser(error, 'Custom fallback')

      expect(formatted).toBe('Custom fallback')
    })
  })

  // Test logError
  describe('logError', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error')
      const context = { userId: '123', action: 'save' }

      logError(error, context)

      expect(console.error).toHaveBeenCalledWith(
        '[Error]',
        'Test error',
        expect.objectContaining({
          error,
          context,
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      )
    })

    it('should log errors without context', () => {
      const error = new Error('Test error')

      logError(error)

      expect(console.error).toHaveBeenCalledWith(
        '[Error]',
        'Test error',
        expect.objectContaining({
          error,
          timestamp: expect.any(String),
          userAgent: expect.any(String)
        })
      )
    })

    it('should include stack trace when available', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\n    at someFunction'

      logError(error)

      expect(console.error).toHaveBeenCalledWith(
        '[Error]',
        'Test error',
        expect.objectContaining({
          error,
          stack: error.stack
        })
      )
    })
  })

  // Test createErrorBoundary
  describe('createErrorBoundary', () => {
    it('should create error boundary with handlers', () => {
      const onError = jest.fn()
      const fallback = 'Error occurred'

      const boundary = createErrorBoundary({ onError, fallback })

      expect(boundary).toHaveProperty('onError')
      expect(boundary).toHaveProperty('fallback')
      expect(boundary.onError).toBe(onError)
      expect(boundary.fallback).toBe(fallback)
    })

    it('should handle reset function', () => {
      const onReset = jest.fn()
      const boundary = createErrorBoundary({ onReset })

      expect(boundary.onReset).toBe(onReset)
    })

    it('should work with default values', () => {
      const boundary = createErrorBoundary({})

      expect(boundary.onError).toBeDefined()
      expect(boundary.fallback).toBeDefined()
    })
  })

  // Test retryWithBackoff
  describe('retryWithBackoff', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should retry failed operations', async () => {
      let attempts = 0
      const operation = jest.fn(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error(`Attempt ${attempts} failed`)
        }
        return 'success'
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2
      })

      // First attempt fails immediately
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(1)

      // Wait for first retry
      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(2)

      // Wait for second retry
      jest.advanceTimersByTime(200)
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(3)

      const result = await promise
      expect(result).toBe('success')
    })

    it('should respect max retries', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Always fails')
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 2,
        initialDelay: 10,
        maxDelay: 100,
        backoffFactor: 2
      })

      // First attempt
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(1)

      // First retry
      jest.advanceTimersByTime(10)
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(2)

      // Second retry
      jest.advanceTimersByTime(20)
      await Promise.resolve()
      expect(operation).toHaveBeenCalledTimes(3)

      await expect(promise).rejects.toThrow('Always fails')
    })

    it('should use exponential backoff', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Always fails')
      })

      const onRetry = jest.fn()

      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100,
        maxDelay: 1000,
        backoffFactor: 2,
        onRetry
      })

      // First attempt fails
      await Promise.resolve()

      // First retry after 100ms
      jest.advanceTimersByTime(100)
      await Promise.resolve()
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error))

      // Second retry after 200ms (100 * 2)
      jest.advanceTimersByTime(200)
      await Promise.resolve()
      expect(onRetry).toHaveBeenCalledWith(2, expect.any(Error))

      // Third retry after 400ms (200 * 2)
      jest.advanceTimersByTime(400)
      await Promise.resolve()
      expect(onRetry).toHaveBeenCalledWith(3, expect.any(Error))

      await expect(promise).rejects.toThrow('Always fails')
    })

    it('should respect max delay', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Always fails')
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 5,
        initialDelay: 100,
        maxDelay: 300,
        backoffFactor: 2
      })

      // First attempt
      await Promise.resolve()

      // Delays should be: 100, 200, 300 (capped), 300 (capped), 300 (capped)
      jest.advanceTimersByTime(100)
      await Promise.resolve()

      jest.advanceTimersByTime(200)
      await Promise.resolve()

      jest.advanceTimersByTime(300)
      await Promise.resolve()

      jest.advanceTimersByTime(300)
      await Promise.resolve()

      jest.advanceTimersByTime(300)
      await Promise.resolve()

      await expect(promise).rejects.toThrow('Always fails')
      expect(operation).toHaveBeenCalledTimes(6) // Initial + 5 retries
    })

    it('should succeed on first try without retries', async () => {
      const operation = jest.fn(async () => 'immediate success')

      const result = await retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 100
      })

      expect(result).toBe('immediate success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should handle shouldRetry function', async () => {
      const operation = jest.fn(async () => {
        throw new Error('Special error')
      })

      const shouldRetry = jest.fn((error: Error) => {
        return !error.message.includes('Special')
      })

      const promise = retryWithBackoff(operation, {
        maxRetries: 3,
        initialDelay: 10,
        shouldRetry
      })

      await expect(promise).rejects.toThrow('Special error')
      expect(operation).toHaveBeenCalledTimes(1)
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error))
    })
  })

  // Test custom error classes
  describe('custom error classes', () => {
    it('should create ErrorWithCode', () => {
      const error = new ErrorWithCode('Test error', 'ERR_001')

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('ERR_001')
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ErrorWithCode')
    })

    it('should create ValidationError', () => {
      const error = new ValidationError('Invalid input')

      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error).toBeInstanceOf(ErrorWithCode)
      expect(error.name).toBe('ValidationError')
    })

    it('should create NetworkError', () => {
      const error = new NetworkError('Connection failed')

      expect(error.message).toBe('Connection failed')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error).toBeInstanceOf(ErrorWithCode)
      expect(error.name).toBe('NetworkError')
    })

    it('should create AuthError', () => {
      const error = new AuthError('Unauthorized')

      expect(error.message).toBe('Unauthorized')
      expect(error.code).toBe('AUTH_ERROR')
      expect(error).toBeInstanceOf(ErrorWithCode)
      expect(error.name).toBe('AuthError')
    })
  })
})