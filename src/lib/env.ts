// import { z } from 'zod' // Temporarily disabled for direct env access

// Check if we're on the server side
const isServer = typeof window === 'undefined'

// For now, let's use the actual values from your .env.local file directly
// This is a temporary fix to get the app working
const env = {
  // Server-side variables (only available on server)
  C7_APP_ID: isServer ? process.env.C7_APP_ID : undefined,
  C7_API_KEY: isServer ? process.env.C7_API_KEY : undefined,
  C7_TENANT_ID: isServer ? process.env.C7_TENANT_ID : undefined,
  SUPABASE_SERVICE_KEY: isServer ? process.env.SUPABASE_SERVICE_KEY : undefined,
  
  // Client-side variables (available on both client and server)
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ggfpkczvvnubjiuiqllv.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnZnBrY3p2dm51YmppdWlxbGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTI3ODcsImV4cCI6MjA2ODY2ODc4N30.Pk6uOa1mCAhETdAyHsZTOCT8xSggTMS5ZGNzjq28Zos',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}

export { env }

// Export individual environment variables for convenience
export const {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL,
  C7_APP_ID,
  C7_API_KEY,
  C7_TENANT_ID,
  SUPABASE_SERVICE_KEY,
} = env