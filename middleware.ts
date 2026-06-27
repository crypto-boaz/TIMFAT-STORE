import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/login"];

export function middleware(request: NextRequest) {
  const isPublic = publicRoutes.some((route) =>
    route === "/" ? request.nextUrl.pathname === "/" : request.nextUrl.pathname.startsWith(route)
  );
  const hasSession = request.cookies.has("paytrack_session");

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if ((request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/login") && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images|favicon.ico).*)"]
};
