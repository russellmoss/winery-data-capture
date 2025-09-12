export interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  phone?: string
  phone_confirmed_at?: string
  confirmed_at?: string
  recovery_sent_at?: string
  new_email?: string
  invited_at?: string
  action_link?: string
  email_change_sent_at?: string
  new_phone?: string
  phone_change_sent_at?: string
  reauthentication_sent_at?: string
  reauthentication_token?: string
  is_sso_user?: boolean
  deleted_at?: string
  is_anonymous?: boolean
}

export interface SupabaseSession {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: SupabaseUser
}

export interface AuthResult {
  user: SupabaseUser | null
  error: Error | null
}

export interface SessionResult {
  session: SupabaseSession | null
  error: Error | null
}

export interface ConnectionTestResult {
  success: boolean
  data?: unknown
  error?: Error
}

export interface SignInResult {
  data: {
    user: SupabaseUser | null
    session: SupabaseSession | null
  } | null
  error: Error | null
}

export interface SignOutResult {
  error: Error | null
}

export interface PasswordResetResult {
  error: Error | null
}

export interface UserCreationResult {
  data: {
    user: SupabaseUser
  } | null
  error: Error | null
}

export interface UserDeletionResult {
  error: Error | null
}

export interface PasswordUpdateResult {
  error: Error | null
}

// Database types (extend as needed for your app)
export interface Database {
  public: {
    Tables: {
      // Add your table definitions here as needed
      // Example:
      // profiles: {
      //   Row: {
      //     id: string
      //     user_id: string
      //     email: string
      //     created_at: string
      //   }
      //   Insert: {
      //     id?: string
      //     user_id: string
      //     email: string
      //     created_at?: string
      //   }
      //   Update: {
      //     id?: string
      //     user_id?: string
      //     email?: string
      //     created_at?: string
      //   }
      // }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Auth event types
export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

export interface AuthEventPayload {
  event: AuthEvent
  session?: SupabaseSession
  user?: SupabaseUser
}

// Error types specific to Supabase
export interface SupabaseError {
  message: string
  status?: number
  statusText?: string
}

// Configuration types
export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey?: string
}

// Client options
export interface SupabaseClientOptions {
  auth?: {
    autoRefreshToken?: boolean
    persistSession?: boolean
    detectSessionInUrl?: boolean
    flowType?: 'implicit' | 'pkce'
  }
  global?: {
    headers?: Record<string, string>
  }
  db?: {
    schema?: string
  }
  realtime?: {
    params?: Record<string, string>
  }
}
