import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/api/auth", "/forgot-password", "/reset-password"];

const ownerOnlyRoutes = ["/finance", "/payroll", "/reports"];
const hrRoutes = ["/employees", "/departments", "/attendance", "/leaves"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect to dashboard if already logged in and trying to access login
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Allow API routes for auth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Owner and Finance Manager routes
  if (ownerOnlyRoutes.some((route) => pathname.startsWith(route))) {
    if (pathname.startsWith("/payroll/payslip")) {
      // Allowed for all authenticated users (page has specific employee ID checks)
    } else if (userRole !== "OWNER" && userRole !== "FINANCE_MANAGER") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // HR routes (owner and HR manager)
  if (hrRoutes.some((route) => pathname.startsWith(route))) {
    if (userRole !== "OWNER" && userRole !== "HR_MANAGER") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
