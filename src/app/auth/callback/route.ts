import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const explicitRedirect = searchParams.get('redirect')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If explicit redirect provided, use it
      if (explicitRedirect) {
        return NextResponse.redirect(`${origin}${explicitRedirect}`)
      }

      // Otherwise, determine redirect based on user type
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_seller, is_admin, full_name')
          .eq('id', user.id)
          .single()

        // If no profile or profile doesn't have full_name set, this is a new OAuth user
        // Redirect them to onboarding to select account type
        if (!profile || !profile.full_name) {
          return NextResponse.redirect(`${origin}/auth/onboarding`)
        }

        // Admins go to admin panel, sellers to dashboard, buyers to marketplace
        let redirectPath = '/marketplace'
        if (profile?.is_admin) {
          redirectPath = '/admin'
        } else if (profile?.is_seller) {
          redirectPath = '/dashboard'
        }
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }

      // Default to onboarding for new users
      return NextResponse.redirect(`${origin}/auth/onboarding`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
