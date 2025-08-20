import { voters } from "@/db/schema";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const newVoter = await db.insert(voters).values({ active: true }).returning();
  return NextResponse.json(newVoter);
}
