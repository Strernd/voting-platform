import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { validateAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET() {
  const isAuthenticated = await validateAdminAuth();
  if (!isAuthenticated) {
    return unauthorizedResponse();
  }

  try {
    const allVoters = await db.select({ id: voters.id }).from(voters);

    return NextResponse.json({
      voters: allVoters.map((v) => v.id),
      count: allVoters.length,
    });
  } catch (error) {
    console.error("Error fetching voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 }
    );
  }
}
