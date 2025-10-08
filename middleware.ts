import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function runs for every request that matches the `matcher` pattern
export function middleware(request: NextRequest) {
  // 1. Get the authentication token from the cookies
  const token = request.cookies.get('auth_token');

  // 2. Check if the user is trying to access a protected page
  const isProtectedRoute = request.nextUrl.pathname === '/';

  // 3. If they are on a protected page AND they don't have a token,
  //    redirect them to the login page.
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. If they are trying to access login/signup but ARE already logged in,
  //    redirect them to the main page.
  if ((request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 5. If none of the above, let them continue.
  return NextResponse.next();
}

// This configures the middleware to run only for the specified paths
export const config = {
  matcher: ['/', '/login', '/signup'],
};