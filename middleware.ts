import { clerkMiddleware } from "@clerk/nextjs/server";
import { createRouteMatcher } from "@clerk/nextjs/server";

export default clerkMiddleware((auth, req) =>{
if (isProtectedRoute(req)) auth().protect();
});
const isProtectedRoute = createRouteMatcher ( [
'/dashboard(.*)',
'/forum(.*)',
'/home(.*)',
'ai-intrview(.*)',
'/extradata(.*)'
]);
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};