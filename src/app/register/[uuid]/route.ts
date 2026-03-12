import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { getCompetitionSettings } from "@/lib/actions";
import { eq, and, isNull } from "drizzle-orm";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "voter_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  const { uuid } = await params;

  if (!uuid) {
    redirect("/register/error");
  }

  try {
    const cookieStore = await cookies();
    const settings = await getCompetitionSettings();

    // If the user already has a session for this exact UUID, just redirect home
    const existingSession = cookieStore.get(SESSION_COOKIE_NAME);
    if (settings.reclaimProtection && existingSession?.value === uuid) {
      redirect("/");
    }

    // Clear any existing session for a different UUID
    cookieStore.delete(SESSION_COOKIE_NAME);

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    const userAgent = request.headers.get("user-agent") ?? "unknown";

    if (settings.reclaimProtection) {
      // Atomically claim the voter UUID — only succeeds if registeredAt is NULL
      const result = await db
        .update(voters)
        .set({ registeredAt: new Date(), registeredIp: ip, registeredUserAgent: userAgent })
        .where(and(eq(voters.id, uuid), isNull(voters.registeredAt)))
        .returning();

      if (result.length === 0) {
        // Either UUID doesn't exist or was already claimed
        const existing = await db.select().from(voters).where(eq(voters.id, uuid));
        if (existing.length > 0 && existing[0].registeredAt) {
          redirect(`/register/claimed?id=${uuid}`);
        }
        redirect("/register/error");
      }
    } else {
      // Reclaim protection off — allow re-registration of claimed codes
      const result = await db
        .update(voters)
        .set({ registeredAt: new Date(), registeredIp: ip, registeredUserAgent: userAgent })
        .where(eq(voters.id, uuid))
        .returning();

      if (result.length === 0) {
        // UUID doesn't exist
        redirect("/register/error");
      }
    }

    // Set secure cookie
    cookieStore.set(SESSION_COOKIE_NAME, uuid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    redirect("/");
  } catch (error) {
    // Re-throw NEXT_REDIRECT errors as they are not actual errors
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("Registration error:", error);
    redirect("/register/error");
  }
}
