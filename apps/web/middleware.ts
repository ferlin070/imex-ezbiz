import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes accessible without authentication
const publicPaths = ['/', '/login', '/daftar']

// Role-based route groups
const ENTREPRENEUR_PATHS = ['/usahawan']
const OFFICER_PATHS = ['/pegawai']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public paths, static files, and API routes
  if (
    publicPaths.some(p => pathname === p || pathname.startsWith(p + '?')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip auth for non-Supabase environments (dummy URL = local mock mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy')) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch user role for route access control
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  // Role-based access control: redirect to correct dashboard if accessing wrong role's area
  const isOfficerPath = OFFICER_PATHS.some(p => pathname.startsWith(p))
  const isEntrepreneurPath = ENTREPRENEUR_PATHS.some(p => pathname.startsWith(p))

  if (isOfficerPath && role === 'entrepreneur') {
    // Entrepreneur trying to access officer routes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/usahawan'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  if (isEntrepreneurPath && (role === 'admin' || role === 'mara_officer')) {
    // Officer trying to access entrepreneur routes
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/pegawai'
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Files with an extension (.js, .css, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' 
  ],
}
