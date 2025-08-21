import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, beerRounds } from "@/db/schema";
import { exampleBeers } from "../../beers/examples";
import { sql, eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');

    let voteCountsRaw;
    let roundBeerIds: Set<string> = new Set();
    
    if (roundId) {
      // Get beers assigned to this round
      const roundBeers = await db
        .select({ beerId: beerRounds.beerId })
        .from(beerRounds)
        .where(eq(beerRounds.roundId, parseInt(roundId, 10)));
      
      roundBeerIds = new Set(roundBeers.map(rb => rb.beerId));
      
      // Get vote counts for specific round
      voteCountsRaw = await db
        .select({
          beerId: votes.beerId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(votes)
        .where(eq(votes.roundId, parseInt(roundId, 10)))
        .groupBy(votes.beerId);
    } else {
      // Get vote counts for all rounds (existing behavior)
      voteCountsRaw = await db
        .select({
          beerId: votes.beerId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(votes)
        .groupBy(votes.beerId);
    }

    // Convert to a Map for easy lookup
    const voteCounts = new Map(
      voteCountsRaw.map(v => [v.beerId, v.count])
    );

    // Filter beers based on round assignment (if roundId is provided)
    let filteredBeers = exampleBeers;
    if (roundId && roundBeerIds.size > 0) {
      filteredBeers = exampleBeers.filter(beer => roundBeerIds.has(beer.submission_id));
    }

    // Combine beer data with vote counts
    const beersWithVotes = filteredBeers.map(beer => ({
      id: beer.submission_id,
      name: beer.beername,
      brewer: beer.brewer,
      style: beer.style,
      votes: voteCounts.get(beer.submission_id) || 0,
    }));

    // Sort by vote count descending
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