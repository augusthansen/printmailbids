import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Ensure cookies are readable by browser JavaScript (not httpOnly)
            cookieStore.set(name, value, { ...options, httpOnly: false });
          });
        },
      },
    }
  );

  // Sign out with global scope to invalidate all sessions including OAuth
  await supabase.auth.signOut({ scope: 'global' });

  // Clear all Supabase cookies by setting them to expire
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase') || cookie.name.includes('auth')) {
      cookieStore.delete(cookie.name);
    }
  }

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
