import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import { handleError, ApiError } from '@/lib/errors'

export function createClient() {
  try {
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  } catch (error) {
    throw new ApiError('Failed to initialize Supabase client', 500)
  }
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new ApiError(`Supabase connection test failed: ${error.message}`, 500)
    }
    
    return { success: true, data }
  } catch (error) {
    throw handleError(error)
  }
}

// Enhanced auth functions with error handling
export async function signInWithPassword(email: string, password: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw new ApiError(`Sign in failed: ${error.message}`, 401)
    }
    
    return { data, error: null }
  } catch (error) {
    return { data: null, error: handleError(error) }
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new ApiError(`Sign out failed: ${error.message}`, 500)
    }
    
    return { error: null }
  } catch (error) {
    return { error: handleError(error) }
  }
}

export async function resetPasswordForEmail(email: string, redirectTo?: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    
    if (error) {
      throw new ApiError(`Password reset failed: ${error.message}`, 500)
    }
    
    return { error: null }
  } catch (error) {
    return { error: handleError(error) }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new ApiError(`Failed to get current user: ${error.message}`, 401)
    }
    
    return { user, error: null }
  } catch (error) {
    return { user: null, error: handleError(error) }
  }
}

export async function getCurrentSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new ApiError(`Failed to get current session: ${error.message}`, 401)
    }
    
    return { session, error: null }
  } catch (error) {
    return { session: null, error: handleError(error) }
  }
}
