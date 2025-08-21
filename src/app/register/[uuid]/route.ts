import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
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
    // Clear any existing session first
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Validate UUID against database
    const records = await db.select().from(voters).where(eq(voters.id, uuid));
    const isValid = records.length > 0;

    if (!isValid) {
      redirect("/register/error");
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
