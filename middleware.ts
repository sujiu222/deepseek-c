import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/protected")) {
    return NextResponse.redirect(new URL("/api/hello", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-demo-middleware", "active");
  return response;
}

export const config = {
  matcher: ["/protected/:path*", "/api/hello"],
};
