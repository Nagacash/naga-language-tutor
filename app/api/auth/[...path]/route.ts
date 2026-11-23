import { authServer } from "@/lib/auth/server";

export const runtime = "nodejs";

export const { GET, POST, PUT, DELETE, PATCH } = authServer().handler();
