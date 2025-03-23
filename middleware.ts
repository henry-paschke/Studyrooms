import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./app/functions/cookies";

export async function middleware(request: NextRequest) {
  // Check if the user is logged in
  const response = await getSession();
  // If not logged in
  if (!response) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/about/:path*", "/rooms"],
};
