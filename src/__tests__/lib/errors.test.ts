import {
  AppError,
  ValidationError,
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  NetworkError,
  handleError,
  isAppError,
  isValidationError,
  isApiError,
  isAuthenticationError,
  isAuthorizationError,
  isNotFoundError,
  isConflictError,
  isRateLimitError,
  isNetworkError,
  logError,
} from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with default values', () => {
      const error = new AppError('Test message')
      expect(error.message).toBe('Test message')
      expect(error.code).toBe('UNKNOWN_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('AppError')
    })

    it('creates error with custom values', () => {
      const error = new AppError('Test message', 'CUSTOM_CODE', 400)
      expect(error.message).toBe('Test message')
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.statusCode).toBe(400)
    })
  })

  describe('ValidationError', () => {
    it('creates validation error with default values', () => {
      const error = new ValidationError('Invalid input')
      expect(error.message).toBe('Invalid input')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.name).toBe('ValidationError')
    })

    it('creates validation error with field', () => {
      const error = new ValidationError('Invalid email', 'email')
      expect(error.field).toBe('email')
    })
  })

  describe('ApiError', () => {
    it('creates API error with default status code', () => {
      const error = new ApiError('API failed')
      expect(error.message).toBe('API failed')
      expect(error.code).toBe('API_ERROR')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('ApiError')
    })

    it('creates API error with custom status code and endpoint', () => {
      const error = new ApiError('Not found', 404, '/api/users')
      expect(error.statusCode).toBe(404)
      expect(error.endpoint).toBe('/api/users')
    })
  })

  describe('AuthenticationError', () => {
    it('creates authentication error with default message', () => {
      const error = new AuthenticationError()
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
      expect(error.name).toBe('AuthenticationError')
    })
  })

  describe('AuthorizationError', () => {
    it('creates authorization error with default message', () => {
      const error = new AuthorizationError()
      expect(error.message).toBe('Insufficient permissions')
      expect(error.statusCode).toBe(403)
      expect(error.name).toBe('AuthorizationError')
    })
  })

  describe('NotFoundError', () => {
    it('creates not found error with default resource', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.name).toBe('NotFoundError')
    })

    it('creates not found error with custom resource', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
    })
  })

  describe('ConflictError', () => {
    it('creates conflict error', () => {
      const error = new ConflictError('Resource already exists')
      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.name).toBe('ConflictError')
    })
  })

  describe('RateLimitError', () => {
    it('creates rate limit error with default message', () => {
      const error = new RateLimitError()
      expect(error.message).toBe('Rate limit exceeded')
      expect(error.statusCode).toBe(429)
      expect(error.name).toBe('RateLimitError')
    })
  })

  describe('NetworkError', () => {
    it('creates network error with default message', () => {
      const error = new NetworkError()
      expect(error.message).toBe('Network error occurred')
      expect(error.statusCode).toBe(503)
      expect(error.name).toBe('NetworkError')
    })
  })
})

describe('Error Utilities', () => {
  describe('handleError', () => {
    it('returns AppError as-is', () => {
      const appError = new AppError('Test')
      const result = handleError(appError)
      expect(result).toBe(appError)
    })

    it('wraps Error in AppError', () => {
      const error = new Error('Test error')
      const result = handleError(error)
      expect(result).toBeInstanceOf(AppError)
      expect(result.message).toBe('Test error')
    })

    it('wraps string in AppError', () => {
      const result = handleError('Test string')
      expect(result).toBeInstanceOf(AppError)
      expect(result.message).toBe('Test string')
    })

    it('handles unknown error types', () => {
      const result = handleError({ some: 'object' })
      expect(result).toBeInstanceOf(AppError)
      expect(result.message).toBe('An unknown error occurred')
    })
  })

  describe('Type Guards', () => {
    it('correctly identifies AppError', () => {
      expect(isAppError(new AppError('Test'))).toBe(true)
      expect(isAppError(new Error('Test'))).toBe(false)
    })

    it('correctly identifies ValidationError', () => {
      expect(isValidationError(new ValidationError('Test'))).toBe(true)
      expect(isValidationError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies ApiError', () => {
      expect(isApiError(new ApiError('Test'))).toBe(true)
      expect(isApiError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies AuthenticationError', () => {
      expect(isAuthenticationError(new AuthenticationError())).toBe(true)
      expect(isAuthenticationError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies AuthorizationError', () => {
      expect(isAuthorizationError(new AuthorizationError())).toBe(true)
      expect(isAuthorizationError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies NotFoundError', () => {
      expect(isNotFoundError(new NotFoundError())).toBe(true)
      expect(isNotFoundError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies ConflictError', () => {
      expect(isConflictError(new ConflictError('Test'))).toBe(true)
      expect(isConflictError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies RateLimitError', () => {
      expect(isRateLimitError(new RateLimitError())).toBe(true)
      expect(isRateLimitError(new AppError('Test'))).toBe(false)
    })

    it('correctly identifies NetworkError', () => {
      expect(isNetworkError(new NetworkError())).toBe(true)
      expect(isNetworkError(new AppError('Test'))).toBe(false)
    })
  })

  describe('logError', () => {
    it('logs error with context', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const error = new AppError('Test error')
      const context = { userId: '123' }
      
      const result = logError(error, context)
      
      expect(result).toMatchObject({
        name: 'AppError',
        message: 'Test error',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        context,
      })
      expect(result.timestamp).toBeDefined()
      
      consoleSpy.mockRestore()
    })
  })
})
