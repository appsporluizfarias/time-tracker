import { NextRequest } from "next/server";
import { db } from "./db";
import { checkRateLimit } from "./rate-limit";

export async function authenticateApiToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Missing or invalid authorization header", status: 401 };
  }

  const token = authHeader.slice(7);
  const apiToken = await db.apiToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!apiToken || apiToken.revokedAt) {
    return { error: "Invalid or revoked token", status: 401 };
  }

  const rateLimit = checkRateLimit(token);
  if (!rateLimit.allowed) {
    return {
      error: "Rate limit exceeded",
      status: 429,
      headers: {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimit.reset),
      },
    };
  }

  await db.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    user: apiToken.user,
    rateLimit,
  };
}

export async function requireAdmin(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) return auth;
  if (auth.user.role !== "ADMIN") {
    return {
      error: "Admin access required. This endpoint is restricted to Admin users.",
      status: 403 as const,
    };
  }
  return auth;
}
