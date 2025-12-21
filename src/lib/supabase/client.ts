import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern to ensure we only create one client instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Let createBrowserClient use its default cookie handling
  // It knows how to parse the base64-encoded session cookies
  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}
