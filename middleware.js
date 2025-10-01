import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const guards = {
  '/dashboard': ['employee','supervisor','driver','admin'],
  '/supervisor': ['supervisor','admin'],
  '/driver': ['driver','admin'],
};

export async function middleware(req) {
  const url = new URL(req.url);
  const matchPath = Object.keys(guards).find(p => url.pathname.startsWith(p));
  if (!matchPath) return NextResponse.next();

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log('No session found, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  const role = session.user.user_metadata?.role || 'employee';
  console.log('Middleware check:', matchPath, 'Role:', role);

  if (!guards[matchPath].includes(role)) {
    console.log('Access denied for role:', role, 'on path:', matchPath);
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*','/supervisor/:path*','/driver/:path*']
};