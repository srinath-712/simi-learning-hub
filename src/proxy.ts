import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/learn', '/account']
// Routes only accessible to tutors
const TUTOR_ROUTES = ['/dashboard']
// Routes that are always public
const PUBLIC_ROUTES = ['/', '/login', '/register', '/auth/callback']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo mode is an explicit, local-preview-only opt-in.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasRealSupabase = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your_supabase') &&
    !supabaseAnonKey.includes('your_supabase')
  )
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  // Always allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // In explicit demo mode, bypass Supabase session checks for the local preview.
  if (demoMode) {
    return NextResponse.next()
  }

  // Never turn a misconfigured production deployment into an unauthenticated
  // public app. Show a clear setup error instead.
  if (!hasRealSupabase) {
    return new NextResponse('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.', { status: 503 })
  }

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Create Supabase client with cookie handling for session refresh
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({
          request: { headers: request.headers },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — this is critical for keeping tokens alive
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    // Not authenticated — redirect to login with return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access for dashboard routes (head AND approved tutors allowed)
  const isTutorRoute = TUTOR_ROUTES.some(route => pathname.startsWith(route))
  if (isTutorRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    const isHead = profile?.role === 'head'
    const isApprovedTutor = profile?.role === 'tutor' && profile?.approval_status === 'approved'

    if (!isHead && !isApprovedTutor) {
      // Member or pending tutor trying to access dashboard — redirect to /learn
      const learnUrl = new URL('/learn', request.url)
      learnUrl.searchParams.set('alert', 'unauthorized')
      return NextResponse.redirect(learnUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
