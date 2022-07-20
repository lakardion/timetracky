import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log({ pathname });
  if (pathname === "/")
    return NextResponse.redirect(new URL("/hours", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
