import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;

export function getRateLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!limiter) {
    const redis = new Redis({ url, token });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "kerviqo-event-rental"
    });
  }

  return limiter;
}

export async function checkRateLimit(req: Request | NextRequest, scope = "api") {
  const rateLimiter = getRateLimiter();
  if (!rateLimiter) return { ok: true, response: null as NextResponse | null };

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || req.headers.get("x-real-ip") || "local";
  const result = await rateLimiter.limit(`${scope}:${ip}`);

  if (result.success) return { ok: true, response: null as NextResponse | null };

  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: "Trop de requêtes. Réessayez dans quelques instants." },
      { status: 429 }
    )
  };
}
