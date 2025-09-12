import {
  createClient,
  testSupabaseConnection,
  signInWithPassword,
  signOut,
  resetPasswordForEmail,
  getCurrentUser,
  getCurrentSession,
} from '@/lib/supabase/client'
import { ApiError } from '@/lib/errors'

// Mock the Supabase client
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}))

// Mock the env module
jest.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}))

import { createBrowserClient } from '@supabase/ssr'

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>

describe('Supabase Client', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        getUser: jest.fn(),
      },
    }
    
    mockCreateBrowserClient.mockReturnValue(mockSupabaseClient)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createClient', () => {
    it('should create a Supabase client successfully', () => {
      const client = createClient()
      expect(client).toBeDefined()
      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      )
    })

    it('should throw ApiError if client creation fails', () => {
      mockCreateBrowserClient.mockImplementation(() => {
        throw new Error('Client creation failed')
      })

      expect(() => createClient()).toThrow(ApiError)
    })
  })

  describe('testSupabaseConnection', () => {
    it('should return success when connection is valid', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const result = await testSupabaseConnection()
      
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ session: null })
    })

    it('should throw ApiError when connection fails', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      })

      await expect(testSupabaseConnection()).rejects.toThrow(ApiError)
    })
  })

  describe('signInWithPassword', () => {
    it('should sign in successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      const mockSession = { access_token: 'token', user: mockUser }
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const result = await signInWithPassword('test@example.com', 'password')
      
      expect(result.error).toBeNull()
      expect(result.data).toEqual({ user: mockUser, session: mockSession })
    })

    it('should handle sign in errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      })

      const result = await signInWithPassword('test@example.com', 'wrongpassword')
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.data).toBeNull()
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      })

      const result = await signOut()
      
      expect(result.error).toBeNull()
    })

    it('should handle sign out errors', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      const result = await signOut()
      
      expect(result.error).toBeInstanceOf(ApiError)
    })
  })

  describe('resetPasswordForEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      })

      const result = await resetPasswordForEmail('test@example.com')
      
      expect(result.error).toBeNull()
    })

    it('should handle password reset errors', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Email not found' },
      })

      const result = await resetPasswordForEmail('nonexistent@example.com')
      
      expect(result.error).toBeInstanceOf(ApiError)
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await getCurrentUser()
      
      expect(result.error).toBeNull()
      expect(result.user).toEqual(mockUser)
    })

    it('should handle get user errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await getCurrentUser()
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.user).toBeNull()
    })
  })

  describe('getCurrentSession', () => {
    it('should get current session successfully', async () => {
      const mockSession = { access_token: 'token', user: { id: '1' } }
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await getCurrentSession()
      
      expect(result.error).toBeNull()
      expect(result.session).toEqual(mockSession)
    })

    it('should handle get session errors', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' },
      })

      const result = await getCurrentSession()
      
      expect(result.error).toBeInstanceOf(ApiError)
      expect(result.session).toBeNull()
    })
  })
})
