import { NextResponse } from 'next/server'

export function middleware(request) {
  console.log('Middleware path:', request.nextUrl.pathname);

  // Temporary: Allow everything for testing
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
