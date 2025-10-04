import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    const env = {
      NEXT_RUNTIME: process.env.NEXT_RUNTIME || 'node',
      NODE_ENV: process.env.NODE_ENV,
      HAS_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      HAS_SUPABASE_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    }

    return NextResponse.json({
      ok: true,
      env,
      session: {
        hasUser: Boolean(user),
        userId: user?.id || null,
      },
      supabaseError: error?.message || null,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}


