"use server";

import { voters, votes, rounds, beerRounds } from "@/db/schema";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
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

    // Get active round
    const activeRoundRecords = await db
      .select()
      .from(rounds)
      .where(eq(rounds.active, true));
    
    if (activeRoundRecords.length === 0) {
      return { success: false, message: "No active round available" };
    }
    
    const activeRound = activeRoundRecords[0];

    // Check if beer is assigned to active round
    const beerInRound = await db
      .select()
      .from(beerRounds)
      .where(and(eq(beerRounds.beerId, beerId), eq(beerRounds.roundId, activeRound.id)));
    
    if (beerInRound.length === 0) {
      return { success: false, message: "Beer is not available in the current round" };
    }

    // Check if voter has already voted in this round
    const existingVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.voterId, voterUuid), eq(votes.roundId, activeRound.id)));

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
        roundId: activeRound.id,
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

    // Get active round
    const activeRoundRecords = await db
      .select()
      .from(rounds)
      .where(eq(rounds.active, true));
    
    if (activeRoundRecords.length === 0) {
      return null;
    }
    
    const activeRound = activeRoundRecords[0];

    const existingVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.voterId, voterUuid), eq(votes.roundId, activeRound.id)));

    return existingVotes.length > 0 ? existingVotes[0].beerId : null;
  } catch (error) {
    console.error("Error getting current vote:", error);
    return null;
  }
}

// Round management actions
export async function createRound(name: string): Promise<{ success: boolean; message: string; roundId?: number }> {
  try {
    const result = await db.insert(rounds).values({ name }).returning({ id: rounds.id });
    revalidatePath("/admin");
    return { success: true, message: "Round created successfully!", roundId: result[0].id };
  } catch (error) {
    console.error("Error creating round:", error);
    return { success: false, message: "Failed to create round" };
  }
}

export async function setActiveRound(roundId: number): Promise<{ success: boolean; message: string }> {
  try {
    // Deactivate all rounds first
    await db.update(rounds).set({ active: false });
    
    // Activate the specified round
    await db.update(rounds).set({ active: true }).where(eq(rounds.id, roundId));
    
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Active round updated successfully!" };
  } catch (error) {
    console.error("Error setting active round:", error);
    return { success: false, message: "Failed to set active round" };
  }
}

export async function assignBeersToRound(roundId: number, beerIds: string[]): Promise<{ success: boolean; message: string }> {
  try {
    // Remove existing beer assignments for this round
    await db.delete(beerRounds).where(eq(beerRounds.roundId, roundId));
    
    // Remove these beers from all other rounds (one beer can only be in one round)
    if (beerIds.length > 0) {
      for (const beerId of beerIds) {
        await db.delete(beerRounds).where(eq(beerRounds.beerId, beerId));
      }
      
      // Add new assignments
      await db.insert(beerRounds).values(
        beerIds.map(beerId => ({ beerId, roundId }))
      );
    }
    
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Beers assigned to round successfully!" };
  } catch (error) {
    console.error("Error assigning beers to round:", error);
    return { success: false, message: "Failed to assign beers to round" };
  }
}

export async function getRounds() {
  try {
    return await db.select().from(rounds);
  } catch (error) {
    console.error("Error getting rounds:", error);
    return [];
  }
}

export async function getActiveRound() {
  try {
    const activeRounds = await db.select().from(rounds).where(eq(rounds.active, true));
    return activeRounds.length > 0 ? activeRounds[0] : null;
  } catch (error) {
    console.error("Error getting active round:", error);
    return null;
  }
}

export async function getBeersInRound(roundId: number) {
  try {
    return await db.select().from(beerRounds).where(eq(beerRounds.roundId, roundId));
  } catch (error) {
    console.error("Error getting beers in round:", error);
    return [];
  }
}

export async function getAllAssignedBeerIds() {
  try {
    const assignedBeers = await db.select({ beerId: beerRounds.beerId }).from(beerRounds);
    return new Set(assignedBeers.map(b => b.beerId));
  } catch (error) {
    console.error("Error getting assigned beer IDs:", error);
    return new Set<string>();
  }
}
