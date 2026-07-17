import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
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
  }

  const url = request.nextUrl.clone()
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
