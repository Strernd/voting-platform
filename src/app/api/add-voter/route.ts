import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET() {
  const isAuthenticated = await validateAdminAuth();
  if (!isAuthenticated) {
    return unauthorizedResponse();
  }

  const newVoter = await db.insert(voters).values({ active: true }).returning();
  return NextResponse.json(newVoter);
}
