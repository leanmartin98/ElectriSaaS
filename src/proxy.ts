import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = ['/auth', '/share'];

const isPublicPath = (pathname: string) => 
PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        res.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    // Si no hay usuario, redirige a la página de inicio de sesión
    if (!user && !isPublicPath(pathname)) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Con sesión no tiene sentido ver login/registro/forgot-password
    // (reset-password queda permitido: el usuario llega ahí con sesíon de recuperación)
    if (user && pathname.startsWith('/auth') && !pathname.startsWith('/auth/reset-password')) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}