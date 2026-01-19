import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Protect /admin routes and /api/admin routes
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isAdminApi) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return unauthorized();
  }

  const [scheme, encoded] = authHeader.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return unauthorized();
  }

  const decoded = atob(encoded);
  const [username, password] = decoded.split(":");

  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (username === validUsername && password === validPassword) {
    return NextResponse.next();
  }

  return unauthorized();
}

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
