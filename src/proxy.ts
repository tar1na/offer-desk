import { NextResponse, type NextRequest } from "next/server";

/**
 * The API has no login: it is meant to run on localhost for one person.
 * Refuse state-changing requests that come from another site in the same browser (CSRF).
 */
export function proxy(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") return NextResponse.next();
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const sameSite = site ? site === "same-origin" || site === "none" : !origin || new URL(origin).host === request.headers.get("host");
  if (!sameSite) return Response.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
