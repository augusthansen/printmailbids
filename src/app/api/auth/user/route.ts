import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null });
    }

    // Also fetch the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_seller, is_admin, full_name, company_name')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
    });
  } catch {
    return NextResponse.json({ user: null, profile: null });
  }
}
