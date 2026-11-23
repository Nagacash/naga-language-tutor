import { authServer } from "@/lib/auth/server";

export const runtime = "nodejs";

type Context = { params: Promise<{ path: string[] }> };

// Resolved per request, so the build does not need sign-in settings.
export async function GET(request: Request, context: Context) {
  return authServer().handler().GET(request, context);
}
export async function POST(request: Request, context: Context) {
  return authServer().handler().POST(request, context);
}
export async function PUT(request: Request, context: Context) {
  return authServer().handler().PUT(request, context);
}
export async function DELETE(request: Request, context: Context) {
  return authServer().handler().DELETE(request, context);
}
export async function PATCH(request: Request, context: Context) {
  return authServer().handler().PATCH(request, context);
}
