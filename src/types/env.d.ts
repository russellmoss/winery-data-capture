declare namespace NodeJS {
  interface ProcessEnv {
    C7_APP_ID: string
    C7_API_KEY: string
    C7_TENANT_ID: string
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_KEY: string
    NEXT_PUBLIC_APP_URL: string
  }
}