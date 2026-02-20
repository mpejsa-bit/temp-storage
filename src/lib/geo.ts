import { headers } from "next/headers";
import type { ActivityMeta } from "./scopes";

export function getRequestMeta(): { ip: string; userAgent: string } {
  const hdrs = headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown";
  const userAgent = hdrs.get("user-agent") || "unknown";
  return { ip, userAgent };
}

export async function resolveGeo(ip: string): Promise<{ city?: string; region?: string; country?: string }> {
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1") return {};
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return {
      city: data.city || undefined,
      region: data.regionName || undefined,
      country: data.country || undefined,
    };
  } catch {
    return {};
  }
}

export async function buildActivityMeta(detail?: string): Promise<ActivityMeta> {
  const { ip, userAgent } = getRequestMeta();
  const geo = await resolveGeo(ip);
  return {
    detail,
    ip,
    userAgent,
    city: geo.city,
    region: geo.region,
    country: geo.country,
  };
}
