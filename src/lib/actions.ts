"use server";

import { voters, votes } from "@/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "voter_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function registerVoter(uuid: string): Promise<boolean> {
  try {
    if (!uuid) {
      return false;
    }

    // Clear any existing session first
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    // Validate UUID against database
    const records = await db.select().from(voters).where(eq(voters.id, uuid));
    const isValid = records.length > 0;

    if (!isValid) {
      return false;
    }

    // Set secure cookie
    cookieStore.set(SESSION_COOKIE_NAME, uuid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Registration error:", error);
    return false;
  }
}

export async function voteForBeer(
  beerId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Get current session
    const cookieStore = await cookies();
    const voterUuid = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!voterUuid) {
      return { success: false, message: "You must be registered to vote" };
    }

    // Check if voter exists and is active
    const voterRecords = await db
      .select()
      .from(voters)
      .where(eq(voters.id, voterUuid));
    if (voterRecords.length === 0 || !voterRecords[0].active) {
      return { success: false, message: "Invalid or inactive voter" };
    }

    // Check if voter has already voted for any beer
    const existingVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.voterId, voterUuid));

    if (existingVotes.length > 0) {
      const currentVote = existingVotes[0];

      if (currentVote.beerId === beerId) {
        return {
          success: false,
          message: "You have already voted for this beer",
        };
      }

      // Update existing vote to new beer
      await db
        .update(votes)
        .set({ beerId: beerId, createdAt: new Date().toISOString() })
        .where(eq(votes.id, currentVote.id));

      revalidatePath("/");

      return { success: true, message: "Vote changed successfully!" };
    } else {
      // Create new vote
      await db.insert(votes).values({
        voterId: voterUuid,
        beerId: beerId,
      });

      revalidatePath("/");

      return { success: true, message: "Vote recorded successfully!" };
    }
  } catch (error) {
    console.error("Voting error:", error);
    return { success: false, message: "An error occurred while voting" };
  }
}

export async function getCurrentVote(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const voterUuid = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!voterUuid) {
      return null;
    }

    const existingVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.voterId, voterUuid));

    return existingVotes.length > 0 ? existingVotes[0].beerId : null;
  } catch (error) {
    console.error("Error getting current vote:", error);
    return null;
  }
}
