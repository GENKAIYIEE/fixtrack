import { getToken } from 'next-auth/jwt'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = request.nextUrl

  // Define route groups
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isAdminRoute = pathname.startsWith('/admin')
  const isTechnicianRoute = pathname.startsWith('/technician')
  const isUserRoute = pathname.startsWith('/dashboard') || 
                      pathname.startsWith('/requests') || 
                      pathname.startsWith('/profile') ||
                      pathname.startsWith('/notifications')

  // If the user is logged in and tries to access login/register, redirect them to their portal
  if (isAuthPage && token) {
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    } else if (token.role === 'TECHNICIAN') {
      return NextResponse.redirect(new URL('/technician/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Protected routes check
  const isProtectedRoute = isAdminRoute || isTechnicianRoute || isUserRoute

  if (isProtectedRoute && !token) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirected', 'true')
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based protection
  if (isAdminRoute && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isTechnicianRoute && token?.role !== 'TECHNICIAN' && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isUserRoute && token?.role !== 'USER') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
