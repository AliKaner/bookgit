import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Auth callback must never be blocked — it has no session yet
  if (pathname.startsWith("/auth/callback")) return response;

  // Public routes: /, /login, /books (discover), /read/*
  // Protected routes: individual book edit, editor, profile
  const isProtected =
    (pathname.startsWith("/books/") && pathname !== "/books") || // /books/[id] edit
    pathname.startsWith("/editor") ||
    pathname === "/profile";

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in → redirect from login page to books
  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/books", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
