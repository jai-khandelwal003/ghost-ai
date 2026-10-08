import { clerkMiddleware } from "@clerk/nextjs/server";

// Public auth paths come from the existing Clerk env vars; everything else requires a session.
const publicRoutes = [
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
].filter((route): route is string => Boolean(route));

function isPublicRoute(pathname: string) {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

// Server Actions are POSTs addressed by action ID, not by page. Path-based protection here would
// redirect them to sign-in (e.g. Clerk's sign-out cache action once the session token has expired),
// which breaks the client router. Every Server Function must call `await auth.protect()` itself.
function isServerAction(req: Request) {
  return req.method === "POST" && req.headers.has("next-action");
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req.nextUrl.pathname) || isServerAction(req)) return;

  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
