import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * The API has no login: it is meant to run on localhost for one person.
 * Only answer requests addressed to a local host name (blocks DNS rebinding), and refuse
 * state-changing requests that come from another site in the same browser (CSRF).
 */
export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "").toLowerCase();
  if (!LOCAL_HOSTS.has(host)) return Response.json({ error: "Offer Desk only answers on localhost." }, { status: 403 });
  if (request.method === "GET" || request.method === "HEAD") return NextResponse.next();
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  const sameSite = site ? site === "same-origin" || site === "none" : !origin || new URL(origin).host === request.headers.get("host");
  if (!sameSite) return Response.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
