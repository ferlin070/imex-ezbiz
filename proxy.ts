import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  let user = null
  let role = null
  let isMock = false

  // Try reading mock cookie session first
  const mockSessionCookie = request.cookies.get('imex_mock_session')?.value
  if (mockSessionCookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(mockSessionCookie))
      user = { id: parsed.id, email: parsed.email }
      role = parsed.role
      isMock = true
    } catch {}
  }

  // If not mock session, try real Supabase auth (wrapped in try/catch to ignore offline errors)
  if (!user) {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        user = supabaseUser
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', supabaseUser.id)
          .single()
        role = profile?.role
      }
    } catch (err) {
      console.warn('Real Supabase auth query failed inside proxy, ignoring:', err)
    }
  }

  const url = request.nextUrl.clone()
  const isAuthPage = url.pathname === '/login'
  const isJudgePage = url.pathname.startsWith('/vote') || url.pathname.startsWith('/ranking')
  const isDashboardPage = url.pathname.startsWith('/project')
  const isAdminPage = url.pathname.startsWith('/admin')

  // Allow access to public resources and API routes without interception
  if (url.pathname.startsWith('/api') || url.pathname === '/') {
    return response
  }

  if (!user && (isJudgePage || isDashboardPage || isAdminPage)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // Redirect logged-in user to their respective homepage
    if (role === 'judge') {
      url.pathname = '/ranking/ikm-besut-2026'
    } else if (role === 'admin') {
      url.pathname = '/admin/events'
    } else {
      let projectId = null

      if (isMock) {
        // Mock entrepreneur projects
        if (user.id === 'b1111111-1111-1111-1111-111111111111') {
          projectId = 'p1111111-1111-1111-1111-111111111111'
        } else if (user.id === 'b2222222-2222-2222-2222-222222222222') {
          projectId = 'p2222222-2222-2222-2222-222222222222'
        }
      } else {
        try {
          const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('owner_user_id', user.id)
            .limit(1)
            .maybeSingle()
          projectId = project?.id
        } catch {}
      }

      if (projectId) {
        url.pathname = `/project/${projectId}`
      } else {
        url.pathname = '/'
      }
    }
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
