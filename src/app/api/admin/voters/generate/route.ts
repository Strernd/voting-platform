import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { validateAdminAuth, unauthorizedResponse } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  // Verify admin authentication (defense in depth beyond middleware)
  const isAuthenticated = await validateAdminAuth();
  if (!isAuthenticated) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const count = Number(body.count);

    if (!count || count < 1 || count > 1000) {
      return NextResponse.json(
        { error: "Count must be between 1 and 1000" },
        { status: 400 }
      );
    }

    // Generate voter IDs
    const voterData = Array.from({ length: count }, () => ({
      id: uuidv4(),
      active: true,
    }));

    // Insert all voters
    const newVoters = await db.insert(voters).values(voterData).returning();

    return NextResponse.json({
      success: true,
      count: newVoters.length,
      voters: newVoters.map((v) => v.id),
    });
  } catch (error) {
    console.error("Error generating voters:", error);
    return NextResponse.json(
      { error: "Failed to generate voters" },
      { status: 500 }
    );
  }
}
