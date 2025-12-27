import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, beerRegistrations } from "@/db/schema";
import { exampleBeers } from "../../beers/examples";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json(
        { error: "roundId is required" },
        { status: 400 }
      );
    }

    const parsedRoundId = parseInt(roundId, 10);

    // Get all votes for this round
    const allVotes = await db
      .select({
        voterId: votes.voterId,
        beerId: votes.beerId,
      })
      .from(votes)
      .where(eq(votes.roundId, parsedRoundId));

    // Group votes by voterId to count how many votes each voter cast
    const votesByVoter = new Map<string, string[]>();
    for (const vote of allVotes) {
      const existing = votesByVoter.get(vote.voterId) || [];
      existing.push(vote.beerId);
      votesByVoter.set(vote.voterId, existing);
    }

    // Calculate weighted votes per beer
    const weightedVotes = new Map<string, number>();
    const rawVotes = new Map<string, number>();

    for (const [voterId, beerIds] of votesByVoter) {
      const weight = 1 / beerIds.length;
      for (const beerId of beerIds) {
        // Weighted vote
        const currentWeighted = weightedVotes.get(beerId) || 0;
        weightedVotes.set(beerId, currentWeighted + weight);
        // Raw vote count
        const currentRaw = rawVotes.get(beerId) || 0;
        rawVotes.set(beerId, currentRaw + 1);
      }
    }

    // Get beer registrations for this round
    const registrations = await db
      .select()
      .from(beerRegistrations)
      .where(eq(beerRegistrations.roundId, parsedRoundId));

    const registrationMap = new Map(
      registrations.map((reg) => [
        reg.beerId,
        { startbahn: reg.startbahn, reinheitsgebot: reg.reinheitsgebot },
      ])
    );

    // Get registered beer IDs for this round
    const registeredBeerIds = new Set(registrations.map((r) => r.beerId));

    // Filter beers to only those registered in this round
    const filteredBeers = exampleBeers.filter((beer) =>
      registeredBeerIds.has(beer.submission_id)
    );

    // Combine beer data with vote counts
    const beersWithVotes = filteredBeers.map((beer) => {
      const reg = registrationMap.get(beer.submission_id);
      return {
        id: beer.submission_id,
        name: beer.beername,
        brewer: beer.brewer,
        style: beer.style,
        votes: Math.round((weightedVotes.get(beer.submission_id) || 0) * 100) / 100,
        rawVotes: rawVotes.get(beer.submission_id) || 0,
        startbahn: reg?.startbahn || 0,
        reinheitsgebot: reg?.reinheitsgebot || false,
      };
    });

    // Sort by weighted vote count descending
    beersWithVotes.sort((a, b) => b.votes - a.votes);

    return NextResponse.json(beersWithVotes);
  } catch (error) {
    console.error("Error fetching beers with votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}