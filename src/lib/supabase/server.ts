import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import { handleError, ApiError } from '@/lib/errors'

// Alias for compatibility with existing code
export const createClient = createServerSupabaseClient

export async function createServerSupabaseClient() {
  try {
    const cookieStore = await cookies()

    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
              // Handle error in Server Component gracefully
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
              // Handle error in Server Component gracefully
            }
          },
        },
      }
    )
  } catch (error) {
    throw new ApiError('Failed to initialize server Supabase client', 500)
  }
}

// Server-side auth validation
export async function validateServerAuth() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new ApiError(`Auth validation failed: ${error.message}`, 401)
    }
    
    return { user, error: null }
  } catch (error) {
    return { user: null, error: handleError(error) }
  }
}

// Server-side session validation
export async function validateServerSession() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new ApiError(`Session validation failed: ${error.message}`, 401)
    }
    
    return { session, error: null }
  } catch (error) {
    return { session: null, error: handleError(error) }
  }
}

// Server-side user creation (admin only)
export async function createServerUser(email: string, password: string, metadata?: Record<string, unknown>) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // This requires service role key for server-side operations
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata || {},
    })
    
    if (error) {
      throw new ApiError(`User creation failed: ${error.message}`, 500)
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleError(error) }
  }
}

// Server-side user deletion (admin only)
export async function deleteServerUser(userId: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.auth.admin.deleteUser(userId)
    
    if (error) {
      throw new ApiError(`User deletion failed: ${error.message}`, 500)
    }
    
    return { error: null }
  } catch (error) {
    return { error: handleError(error) }
  }
}

// Server-side password reset (admin only)
export async function resetServerUserPassword(userId: string, newPassword: string) {
  try {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })
    
    if (error) {
      throw new ApiError(`Password reset failed: ${error.message}`, 500)
    }
    
    return { error: null }
  } catch (error) {
    return { error: handleError(error) }
  }
}
