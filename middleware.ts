import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth);
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname.startsWith("/login");
  const isWebhook = pathname.startsWith("/api/webhooks");
  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublicProfile = pathname.startsWith("/p/");

  if (isWebhook || isAuthApi || isPublicProfile) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/profil", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
