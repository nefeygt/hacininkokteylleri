import { NextResponse, type NextRequest } from "next/server";
import { rewriteWithSession } from "@/lib/supabase/proxy";

// One deployment, two faces (ADR-007):
//   hacininkokteylleri.tech        → the public site
//   admin.hacininkokteylleri.tech  → the admin panel, whose pages live in src/app/admin
// Locally the panel is http://admin.localhost:3000.

const ADMIN_PREFIX = "/admin";

// The production deployment's default Vercel address. It redirects to the
// canonical domain (ADR-010), so search engines move their index there.
// Preview deployments have other *.vercel.app hosts and are left alone.
const OLD_HOST = "hacininkokteylleri.vercel.app";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

function isAdminPath(pathname: string) {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname, search } = request.nextUrl;

  if (host === OLD_HOST) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, SITE_URL), 308);
  }

  if (host.startsWith("admin.")) {
    // A hand-typed /admin/... on the admin host goes to its clean address.
    if (isAdminPath(pathname)) {
      const clean = request.nextUrl.clone();
      clean.pathname = pathname.slice(ADMIN_PREFIX.length) || "/";
      return NextResponse.redirect(clean);
    }

    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? ADMIN_PREFIX : `${ADMIN_PREFIX}${pathname}`;
    return rewriteWithSession(request, destination);
  }

  // The panel is never served on the public host.
  if (isAdminPath(pathname)) {
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except API routes, Next.js internals (and its dev overlay) and static files.
    "/((?!api/|_next/static|_next/image|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
