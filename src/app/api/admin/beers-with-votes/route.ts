import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes } from "@/db/schema";
import { exampleBeers } from "../../beers/examples";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get vote counts for each beer
    const voteCountsRaw = await db
      .select({
        beerId: votes.beerId,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(votes)
      .groupBy(votes.beerId);

    // Convert to a Map for easy lookup
    const voteCounts = new Map(
      voteCountsRaw.map(v => [v.beerId, v.count])
    );

    // Combine beer data with vote counts
    const beersWithVotes = exampleBeers.map(beer => ({
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