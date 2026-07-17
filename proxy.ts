import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Simple memory-based rate limiter store (sliding window)
const ipCache = new Map<string, number[]>()
const LIMIT = 100 // max requests
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = ipCache.get(ip) || []
  
  // Filter timestamps within current sliding window
  const activeTimestamps = timestamps.filter(t => now - t < WINDOW_MS)
  
  if (activeTimestamps.length >= LIMIT) {
    return true
  }
  
  activeTimestamps.push(now)
  ipCache.set(ip, activeTimestamps)
  return false
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()

  // API Rate Limiting Check
  if (url.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'
    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({ error: 'Terlalu banyak permintaan. Sila cuba lagi selepas 15 minit.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(WINDOW_MS / 1000)
          }
        }
      )
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !supabaseUrl || !anonKey || supabaseUrl.includes('dummy')

  let user = null
  let supabase: ReturnType<typeof createServerClient> | null = null

  // If we have real credentials, try real Supabase auth
  if (!isDummy) {
    try {
      supabase = createServerClient(
        supabaseUrl!,
        anonKey!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        user = supabaseUser
      }
    } catch (err) {
      console.warn('Real Supabase auth query failed inside proxy, ignoring:', err)
    }
  } else {
    const mockSession = request.cookies.get('imex_mock_session')?.value
    if (mockSession) {
      user = { id: mockSession } as any
    }
  }

  const isChangePasswordPage = url.pathname === '/change-password'
  const isJudgePage = url.pathname.startsWith('/vote') || url.pathname.startsWith('/ranking')
  const isDashboardPage = url.pathname.startsWith('/project')
  const isAdminPage = url.pathname.startsWith('/admin')
  const isMaraPage = url.pathname.startsWith('/search') || 
                     url.pathname.startsWith('/candidate') || 
                     url.pathname.startsWith('/shortlist') || 
                     url.pathname.startsWith('/analytics')

  // Allow access to public resources and API routes without interception
  if (url.pathname.startsWith('/api') || url.pathname === '/') {
    return response
  }

  // Check if password change is forced
  const mustChangePassword = user?.user_metadata?.must_change_password === true

  if (mustChangePassword && !isChangePasswordPage) {
    url.pathname = '/change-password'
    return NextResponse.redirect(url)
  }

  if (user && isChangePasswordPage && !mustChangePassword) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Guard MARA pages: only allow authenticated users. Layout performs role check.
  if (isMaraPage) {
    if (!user) {
      url.pathname = '/mara/login'
      return NextResponse.redirect(url)
    }
  }

  // Guard protected pages
  if (!user && (isJudgePage || isDashboardPage || isAdminPage)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
