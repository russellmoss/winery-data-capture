import {
  createServerSupabaseClient,
  validateServerAuth,
  validateServerSession,
  createServerUser,
  deleteServerUser,
  resetServerUserPassword,
} from '@/lib/supabase/server'
import { ApiError } from '@/lib/errors'

// Mock Next.js headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock the Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

// Mock the env module
jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  },
}))

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const mockCookies = cookies as jest.MockedFunction<typeof cookies>
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

describe('Supabase Server', () => {
  let mockSupabaseClient: any
  let mockCookieStore: any

  beforeEach(() => {
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
    }
    
    mockCookies.mockReturnValue(mockCookieStore)
    
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
        getSession: jest.fn(),
        admin: {
          createUser: jest.fn(),
          deleteUser: jest.fn(),
          updateUserById: jest.fn(),
        },
      },
    }
    
    mockCreateServerClient.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createServerSupabaseClient', () => {
    it('should create a server Supabase client successfully', async () => {
      const client = await createServerSupabaseClient()
      
      expect(client).toBeDefined()
      expect(mockCreateServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      )
    })

    it('should throw ApiError if client creation fails', async () => {
      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Server client creation failed')
      })

      await expect(createServerSupabaseClient()).rejects.toThrow(ApiError)
    })
  })

  describe('validateServerAuth', () => {
    it('should validate auth successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await validateServerAuth()
      
      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUser)
    })

    it('should handle auth validation errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await validateServerAuth()
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.user).toBeNull()
    })
  })

  describe('validateServerSession', () => {
    it('should validate session successfully', async () => {
      const mockSession = { access_token: 'token', user: { id: '1' } }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await validateServerSession()
      
      expect(result.error).toBeNull()
      expect(result.session).toEqual(mockSession)
    })

    it('should handle session validation errors', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const result = await validateServerSession()
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.session).toBeNull()
    })
  })

  describe('createServerUser', () => {
    it('should create user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await createServerUser('test@example.com', 'password')
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ user: mockUser })
    })

    it('should handle user creation errors', async () => {
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'User already exists' },
      })

      const result = await createServerUser('test@example.com', 'password')
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.data).toBeNull()
    })
  })

  describe('deleteServerUser', () => {
    it('should delete user successfully', async () => {
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: null,
      })

      const result = await deleteServerUser('user-id')
      
      expect(result.error).toBeNull()
    })

    it('should handle user deletion errors', async () => {
      mockSupabaseClient.auth.admin.deleteUser.mockResolvedValue({
        error: { message: 'User not found' },
      })

      const result = await deleteServerUser('nonexistent-user')
      
      expect(result.error).toBeInstanceOf(ApiError)
    })
  })

  describe('resetServerUserPassword', () => {
    it('should reset password successfully', async () => {
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        error: null,
      })

      const result = await resetServerUserPassword('user-id', 'newpassword')
      
      expect(result.error).toBeNull()
    })

    it('should handle password reset errors', async () => {
      mockSupabaseClient.auth.admin.updateUserById.mockResolvedValue({
        error: { message: 'User not found' },
      })

      const result = await resetServerUserPassword('nonexistent-user', 'newpassword')
      
      expect(result.error).toBeInstanceOf(ApiError)
    })
  })
})
