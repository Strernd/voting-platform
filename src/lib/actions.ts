"use server";

import {
  voters,
  votes,
  rounds,
  beerRounds,
  competitionSettings,
  beerRegistrations,
  startbahnConfigs,
  VOTE_TYPES,
  type CompetitionSettings,
  type BeerRegistration,
  type StartbahnConfig,
  type VoteType,
} from "@/db/schema";
import { db } from "@/lib/db";
import { eq, and, inArray, notInArray, sql } from "drizzle-orm";
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

export async function toggleVoteForBeer(
  beerId: string,
  voteType: VoteType = VOTE_TYPES.BEST_BEER
): Promise<{
  success: boolean;
  message: string;
  bestBeerVotes: string[];
  presentationVotes: string[];
}> {
  try {
    // Check if voting is enabled
    const settings = await getCompetitionSettings();
    if (!settings.votingEnabled) {
      return {
        success: false,
        message: "Die Abstimmung ist derzeit geschlossen",
        bestBeerVotes: [],
        presentationVotes: [],
      };
    }

    // Get current session
    const cookieStore = await cookies();
    const voterUuid = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!voterUuid) {
      return {
        success: false,
        message: "Du musst registriert sein, um zu wahlen",
        bestBeerVotes: [],
        presentationVotes: [],
      };
    }

    // Check if voter exists and is active
    const voterRecords = await db
      .select()
      .from(voters)
      .where(eq(voters.id, voterUuid));
    if (voterRecords.length === 0 || !voterRecords[0].active) {
      return {
        success: false,
        message: "Ungultige oder inaktive Registrierung",
        bestBeerVotes: [],
        presentationVotes: [],
      };
    }

    // Get active round
    const activeRoundRecords = await db
      .select()
      .from(rounds)
      .where(eq(rounds.active, true));

    if (activeRoundRecords.length === 0) {
      return {
        success: false,
        message: "Keine aktive Runde verfugbar",
        bestBeerVotes: [],
        presentationVotes: [],
      };
    }

    const activeRound = activeRoundRecords[0];

    // Check if beer is registered in active round
    const beerInRound = await db
      .select()
      .from(beerRegistrations)
      .where(
        and(
          eq(beerRegistrations.beerId, beerId),
          eq(beerRegistrations.roundId, activeRound.id)
        )
      );

    if (beerInRound.length === 0) {
      return {
        success: false,
        message: "Bier ist in der aktuellen Runde nicht verfugbar",
        bestBeerVotes: [],
        presentationVotes: [],
      };
    }

    // Helper to get current votes by type
    const getVotesByType = async () => {
      const allVotes = await db
        .select({ beerId: votes.beerId, voteType: votes.voteType })
        .from(votes)
        .where(
          and(eq(votes.voterId, voterUuid), eq(votes.roundId, activeRound.id))
        );

      return {
        bestBeerVotes: allVotes
          .filter((v) => v.voteType === VOTE_TYPES.BEST_BEER)
          .map((v) => v.beerId),
        presentationVotes: allVotes
          .filter((v) => v.voteType === VOTE_TYPES.BEST_PRESENTATION)
          .map((v) => v.beerId),
      };
    };

    // Check if voter has already voted for this beer with this voteType in this round
    const existingVote = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.voterId, voterUuid),
          eq(votes.beerId, beerId),
          eq(votes.roundId, activeRound.id),
          eq(votes.voteType, voteType)
        )
      );

    if (existingVote.length > 0) {
      // Remove the vote (toggle off)
      await db.delete(votes).where(eq(votes.id, existingVote[0].id));
      revalidatePath("/");

      const currentVotes = await getVotesByType();
      return {
        success: true,
        message:
          voteType === VOTE_TYPES.BEST_PRESENTATION
            ? "Schaumkrönchen entfernt"
            : "Stimme entfernt",
        ...currentVotes,
      };
    } else {
      // For presentation votes, check if user already has a vote for a different beer
      if (voteType === VOTE_TYPES.BEST_PRESENTATION) {
        const existingPresentationVote = await db
          .select()
          .from(votes)
          .where(
            and(
              eq(votes.voterId, voterUuid),
              eq(votes.roundId, activeRound.id),
              eq(votes.voteType, VOTE_TYPES.BEST_PRESENTATION)
            )
          );

        if (existingPresentationVote.length > 0) {
          const currentVotes = await getVotesByType();
          return {
            success: false,
            message:
              "Du hast bereits ein Schaumkrönchen vergeben. Entferne es zuerst.",
            ...currentVotes,
          };
        }
      }

      // Add new vote
      await db.insert(votes).values({
        voterId: voterUuid,
        beerId: beerId,
        roundId: activeRound.id,
        voteType: voteType,
      });

      revalidatePath("/");

      const currentVotes = await getVotesByType();
      return {
        success: true,
        message:
          voteType === VOTE_TYPES.BEST_PRESENTATION
            ? "Schaumkrönchen vergeben"
            : "Stimme hinzugefugt",
        ...currentVotes,
      };
    }
  } catch (error) {
    console.error("Voting error:", error);
    return {
      success: false,
      message: "Ein Fehler ist aufgetreten",
      bestBeerVotes: [],
      presentationVotes: [],
    };
  }
}

export async function getCurrentVotes(): Promise<{
  bestBeer: string[];
  presentation: string[];
}> {
  try {
    const cookieStore = await cookies();
    const voterUuid = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!voterUuid) {
      return { bestBeer: [], presentation: [] };
    }

    // Get active round
    const activeRoundRecords = await db
      .select()
      .from(rounds)
      .where(eq(rounds.active, true));

    if (activeRoundRecords.length === 0) {
      return { bestBeer: [], presentation: [] };
    }

    const activeRound = activeRoundRecords[0];

    const existingVotes = await db
      .select({ beerId: votes.beerId, voteType: votes.voteType })
      .from(votes)
      .where(
        and(eq(votes.voterId, voterUuid), eq(votes.roundId, activeRound.id))
      );

    return {
      bestBeer: existingVotes
        .filter((v) => v.voteType === VOTE_TYPES.BEST_BEER)
        .map((v) => v.beerId),
      presentation: existingVotes
        .filter((v) => v.voteType === VOTE_TYPES.BEST_PRESENTATION)
        .map((v) => v.beerId),
    };
  } catch (error) {
    console.error("Error getting current votes:", error);
    return { bestBeer: [], presentation: [] };
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

// Competition settings actions
export async function getCompetitionSettings(): Promise<CompetitionSettings> {
  try {
    const settings = await db.select().from(competitionSettings).where(eq(competitionSettings.id, 1));
    if (settings.length === 0) {
      // Create default settings
      await db.insert(competitionSettings).values({ id: 1 });
      return { id: 1, votingEnabled: false, startbahnCount: 50 };
    }
    return settings[0];
  } catch (error) {
    console.error("Error getting competition settings:", error);
    return { id: 1, votingEnabled: false, startbahnCount: 50 };
  }
}

export async function updateCompetitionSettings(
  settings: Partial<Pick<CompetitionSettings, "votingEnabled" | "startbahnCount">>
): Promise<{ success: boolean; message: string }> {
  try {
    // Ensure settings row exists
    const existing = await db.select().from(competitionSettings).where(eq(competitionSettings.id, 1));
    if (existing.length === 0) {
      await db.insert(competitionSettings).values({ id: 1, ...settings });
    } else {
      await db.update(competitionSettings).set(settings).where(eq(competitionSettings.id, 1));
    }
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Einstellungen gespeichert" };
  } catch (error) {
    console.error("Error updating competition settings:", error);
    return { success: false, message: "Fehler beim Speichern der Einstellungen" };
  }
}

export async function isVotingEnabled(): Promise<boolean> {
  try {
    const settings = await getCompetitionSettings();
    return settings.votingEnabled;
  } catch (error) {
    console.error("Error checking voting status:", error);
    return false;
  }
}

// Beer registration actions
export async function registerBeer(
  beerId: string,
  startbahn: number,
  roundId: number,
  reinheitsgebot: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getCompetitionSettings();

    // Validate Startbahn range
    if (startbahn < 1 || startbahn > settings.startbahnCount) {
      return { success: false, message: `Startbahn muss zwischen 1 und ${settings.startbahnCount} liegen` };
    }

    // Check if beer is already registered
    const existingReg = await db
      .select()
      .from(beerRegistrations)
      .where(eq(beerRegistrations.beerId, beerId));
    if (existingReg.length > 0) {
      return { success: false, message: "Bier ist bereits registriert" };
    }

    // Check if Startbahn is already used in this round
    const startbahnUsed = await db
      .select()
      .from(beerRegistrations)
      .where(and(eq(beerRegistrations.startbahn, startbahn), eq(beerRegistrations.roundId, roundId)));
    if (startbahnUsed.length > 0) {
      return { success: false, message: `Startbahn ${startbahn} ist bereits vergeben in dieser Runde` };
    }

    // Insert registration
    await db.insert(beerRegistrations).values({
      beerId,
      startbahn,
      roundId,
      reinheitsgebot,
    });

    // Also add to beerRounds for compatibility
    await db.delete(beerRounds).where(eq(beerRounds.beerId, beerId));
    await db.insert(beerRounds).values({ beerId, roundId });

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Bier erfolgreich registriert" };
  } catch (error) {
    console.error("Error registering beer:", error);
    return { success: false, message: "Fehler beim Registrieren des Biers" };
  }
}

export async function getAvailableStartbahns(roundId: number): Promise<number[]> {
  try {
    const settings = await getCompetitionSettings();
    const usedStartbahns = await db
      .select({ startbahn: beerRegistrations.startbahn })
      .from(beerRegistrations)
      .where(eq(beerRegistrations.roundId, roundId));

    const usedSet = new Set(usedStartbahns.map((s) => s.startbahn));
    const available: number[] = [];
    for (let i = 1; i <= settings.startbahnCount; i++) {
      if (!usedSet.has(i)) {
        available.push(i);
      }
    }
    return available;
  } catch (error) {
    console.error("Error getting available startbahns:", error);
    return [];
  }
}

export async function getRegisteredBeers(): Promise<BeerRegistration[]> {
  try {
    return await db.select().from(beerRegistrations);
  } catch (error) {
    console.error("Error getting registered beers:", error);
    return [];
  }
}

export async function getRegisteredBeerIds(): Promise<Set<string>> {
  try {
    const registrations = await db.select({ beerId: beerRegistrations.beerId }).from(beerRegistrations);
    return new Set(registrations.map((r) => r.beerId));
  } catch (error) {
    console.error("Error getting registered beer IDs:", error);
    return new Set<string>();
  }
}

export async function updateBeerRegistration(
  beerId: string,
  updates: Partial<Pick<BeerRegistration, "startbahn" | "roundId" | "reinheitsgebot">>
): Promise<{ success: boolean; message: string }> {
  try {
    const currentReg = await db
      .select()
      .from(beerRegistrations)
      .where(eq(beerRegistrations.beerId, beerId));
    if (currentReg.length === 0) {
      return { success: false, message: "Bier ist nicht registriert" };
    }

    const newRoundId = updates.roundId ?? currentReg[0].roundId;
    const newStartbahn = updates.startbahn ?? currentReg[0].startbahn;

    // Check Startbahn uniqueness if changed
    if (updates.startbahn !== undefined || updates.roundId !== undefined) {
      const conflict = await db
        .select()
        .from(beerRegistrations)
        .where(
          and(
            eq(beerRegistrations.startbahn, newStartbahn),
            eq(beerRegistrations.roundId, newRoundId)
          )
        );
      if (conflict.length > 0 && conflict[0].beerId !== beerId) {
        return { success: false, message: `Startbahn ${newStartbahn} ist bereits vergeben in dieser Runde` };
      }
    }

    await db.update(beerRegistrations).set(updates).where(eq(beerRegistrations.beerId, beerId));

    // Update beerRounds if round changed
    if (updates.roundId !== undefined) {
      await db.delete(beerRounds).where(eq(beerRounds.beerId, beerId));
      await db.insert(beerRounds).values({ beerId, roundId: updates.roundId });
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Registrierung aktualisiert" };
  } catch (error) {
    console.error("Error updating beer registration:", error);
    return { success: false, message: "Fehler beim Aktualisieren der Registrierung" };
  }
}

export async function unregisterBeer(beerId: string): Promise<{ success: boolean; message: string }> {
  try {
    await db.delete(beerRegistrations).where(eq(beerRegistrations.beerId, beerId));
    await db.delete(beerRounds).where(eq(beerRounds.beerId, beerId));
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true, message: "Registrierung entfernt" };
  } catch (error) {
    console.error("Error unregistering beer:", error);
    return { success: false, message: "Fehler beim Entfernen der Registrierung" };
  }
}

// Startbahn config actions
export async function getStartbahnConfigs(): Promise<StartbahnConfig[]> {
  try {
    return await db.select().from(startbahnConfigs);
  } catch (error) {
    console.error("Error getting startbahn configs:", error);
    return [];
  }
}

export async function upsertStartbahnConfig(
  startbahn: number,
  name: string
): Promise<{ success: boolean; message: string }> {
  try {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, message: "Name darf nicht leer sein" };
    }

    await db
      .insert(startbahnConfigs)
      .values({ startbahn, name: trimmedName })
      .onConflictDoUpdate({
        target: startbahnConfigs.startbahn,
        set: { name: trimmedName },
      });

    revalidatePath("/admin");
    return { success: true, message: "Startbahn-Konfiguration gespeichert" };
  } catch (error) {
    console.error("Error upserting startbahn config:", error);
    return { success: false, message: "Fehler beim Speichern der Konfiguration" };
  }
}

export async function deleteStartbahnConfig(
  startbahn: number
): Promise<{ success: boolean; message: string }> {
  try {
    await db.delete(startbahnConfigs).where(eq(startbahnConfigs.startbahn, startbahn));
    revalidatePath("/admin");
    return { success: true, message: "Startbahn-Konfiguration entfernt" };
  } catch (error) {
    console.error("Error deleting startbahn config:", error);
    return { success: false, message: "Fehler beim Entfernen der Konfiguration" };
  }
}
