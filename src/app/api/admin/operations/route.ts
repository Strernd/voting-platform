import { db } from "@/lib/db";
import { voters } from "@/db/schema";
import { validateAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await validateAdminAuth())) {
    return unauthorizedResponse();
  }

  const allVoters = await db
    .select({
      id: voters.id,
      registeredAt: voters.registeredAt,
      registeredIp: voters.registeredIp,
      registeredUserAgent: voters.registeredUserAgent,
    })
    .from(voters);

  const claimed = allVoters.filter((v) => v.registeredAt !== null);
  const unclaimed = allVoters.filter((v) => v.registeredAt === null);

  // Group by IP + User-Agent to find duplicates
  const fingerprintMap = new Map<string, string[]>();
  for (const v of claimed) {
    const key = `${v.registeredIp ?? ""}|||${v.registeredUserAgent ?? ""}`;
    if (!fingerprintMap.has(key)) {
      fingerprintMap.set(key, []);
    }
    fingerprintMap.get(key)!.push(v.id);
  }

  const duplicates = Array.from(fingerprintMap.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([key, ids]) => {
      const [ip, userAgent] = key.split("|||");
      return { ip, userAgent, voterIds: ids, count: ids.length };
    })
    .sort((a, b) => b.count - a.count);

  // Claims over time (group by minute)
  const claimsOverTime = claimed
    .filter((v) => v.registeredAt !== null)
    .map((v) => v.registeredAt!.getTime())
    .sort((a, b) => a - b);

  // Group into 5-minute buckets
  const buckets: { time: string; count: number; cumulative: number }[] = [];
  if (claimsOverTime.length > 0) {
    const bucketSize = 5 * 60 * 1000; // 5 minutes
    const first = Math.floor(claimsOverTime[0] / bucketSize) * bucketSize;
    const last = claimsOverTime[claimsOverTime.length - 1];

    let cumulative = 0;
    for (let t = first; t <= last + bucketSize; t += bucketSize) {
      const count = claimsOverTime.filter(
        (ts) => ts >= t && ts < t + bucketSize
      ).length;
      cumulative += count;
      if (count > 0 || buckets.length > 0) {
        buckets.push({
          time: new Date(t).toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          count,
          cumulative,
        });
      }
    }
  }

  return NextResponse.json({
    claimedCount: claimed.length,
    unclaimedCount: unclaimed.length,
    totalCount: allVoters.length,
    claimsOverTime: buckets,
    duplicates,
  });
}
