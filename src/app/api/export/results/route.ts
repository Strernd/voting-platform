import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { votes, beerRegistrations, rounds, VOTE_TYPES } from "@/db/schema";

// Cached beer data from external API
let cachedBeers: Array<{
  submission_id: string;
  user_id: string;
  beername: string;
  brewer: string;
  style: string;
}> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

async function fetchBeersFromAPI() {
  const now = Date.now();
  if (cachedBeers && now - lastFetch < CACHE_DURATION) {
    return cachedBeers;
  }

  try {
    const url = "https://manager.heimbrauconvention.de/api/submission/";
    const apiToken = process.env.HBCON_API_TOKEN;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-TOKEN": apiToken || "",
      },
    });
    const data = await res.json();
    cachedBeers = data;
    lastFetch = now;
    return cachedBeers;
  } catch (error) {
    console.error("Error fetching beers from API:", error);
    // Return cached data if available, even if stale
    return cachedBeers || [];
  }
}

interface BeerResult {
  user_id: string;
  submission_id: string;
  beer_name: string;
  brewer: string;
  style: string;
  startbahn: number;
  reinheitsgebot: boolean;
  round_id: number;
  round_name: string;

  primary_weighted_votes: number;
  primary_raw_votes: number;
  primary_percentage_in_round: number;
  primary_place_in_round: number;
  primary_place_overall: number;

  presentation_votes: number;
  presentation_percentage_in_round: number;
  presentation_place_in_round: number;
  presentation_place_overall: number;
}

export async function GET(request: Request) {
  // Authenticate via X-API-Key header
  const apiKey = request.headers.get("X-API-Key");
  const expectedKey = process.env.EXPORT_API_KEY;

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Fetch all data in parallel
    const [allRounds, allVotes, allRegistrations] = await Promise.all([
      db.select().from(rounds),
      db.select({
        voterId: votes.voterId,
        beerId: votes.beerId,
        roundId: votes.roundId,
        voteType: votes.voteType,
      }).from(votes),
      db.select().from(beerRegistrations),
    ]);

    // Fetch beer data from external API (cached)
    const externalBeers = await fetchBeersFromAPI();

    // Create lookup maps
    const roundMap = new Map(allRounds.map((r) => [r.id, r]));
    const beerMap = new Map(
      (externalBeers || []).map((b) => [b.submission_id, b])
    );
    const registrationMap = new Map(
      allRegistrations.map((reg) => [reg.beerId, reg])
    );

    // Get registered beer IDs per round
    const beersByRound = new Map<number, Set<string>>();
    for (const reg of allRegistrations) {
      if (!beersByRound.has(reg.roundId)) {
        beersByRound.set(reg.roundId, new Set());
      }
      beersByRound.get(reg.roundId)!.add(reg.beerId);
    }

    // Calculate PRIMARY (best_beer) votes per round
    const primaryVotesByRound = new Map<number, { votes: typeof allVotes }>();
    for (const vote of allVotes) {
      if (vote.voteType === VOTE_TYPES.BEST_BEER) {
        if (!primaryVotesByRound.has(vote.roundId)) {
          primaryVotesByRound.set(vote.roundId, { votes: [] });
        }
        primaryVotesByRound.get(vote.roundId)!.votes.push(vote);
      }
    }

    // Calculate weighted votes per beer per round
    const primaryWeightedByRound = new Map<number, Map<string, { weighted: number; raw: number }>>();

    for (const [roundId, data] of primaryVotesByRound) {
      // Group votes by voterId within this round
      const votesByVoter = new Map<string, string[]>();
      for (const vote of data.votes) {
        const existing = votesByVoter.get(vote.voterId) || [];
        existing.push(vote.beerId);
        votesByVoter.set(vote.voterId, existing);
      }

      // Calculate weighted votes per beer
      const beerVotes = new Map<string, { weighted: number; raw: number }>();
      for (const [, beerIds] of votesByVoter) {
        const weight = 1 / beerIds.length;
        for (const beerId of beerIds) {
          const current = beerVotes.get(beerId) || { weighted: 0, raw: 0 };
          current.weighted += weight;
          current.raw += 1;
          beerVotes.set(beerId, current);
        }
      }

      primaryWeightedByRound.set(roundId, beerVotes);
    }

    // Calculate PRESENTATION votes per beer per round
    const presentationByRound = new Map<number, Map<string, number>>();
    for (const vote of allVotes) {
      if (vote.voteType === VOTE_TYPES.BEST_PRESENTATION) {
        if (!presentationByRound.has(vote.roundId)) {
          presentationByRound.set(vote.roundId, new Map());
        }
        const roundVotes = presentationByRound.get(vote.roundId)!;
        const current = roundVotes.get(vote.beerId) || 0;
        roundVotes.set(vote.beerId, current + 1);
      }
    }

    // Build results for each beer in each round
    const results: BeerResult[] = [];

    for (const [roundId, beerIds] of beersByRound) {
      const round = roundMap.get(roundId);
      if (!round) continue;

      const primaryVotes = primaryWeightedByRound.get(roundId) || new Map();
      const presentationVotes = presentationByRound.get(roundId) || new Map();

      // Calculate totals for percentages
      let totalPrimaryWeighted = 0;
      let totalPresentation = 0;

      for (const beerId of beerIds) {
        totalPrimaryWeighted += primaryVotes.get(beerId)?.weighted || 0;
        totalPresentation += presentationVotes.get(beerId) || 0;
      }

      // Build beer entries for this round
      const roundBeers: Array<{
        beerId: string;
        primaryWeighted: number;
        primaryRaw: number;
        primaryPercentage: number;
        presentationVotes: number;
        presentationPercentage: number;
      }> = [];

      for (const beerId of beerIds) {
        const pv = primaryVotes.get(beerId) || { weighted: 0, raw: 0 };
        const presVotes = presentationVotes.get(beerId) || 0;

        roundBeers.push({
          beerId,
          primaryWeighted: Math.round(pv.weighted * 100) / 100,
          primaryRaw: pv.raw,
          primaryPercentage: totalPrimaryWeighted > 0 ? (pv.weighted / totalPrimaryWeighted) * 100 : 0,
          presentationVotes: presVotes,
          presentationPercentage: totalPresentation > 0 ? (presVotes / totalPresentation) * 100 : 0,
        });
      }

      // Sort and assign in-round places for primary votes
      const sortedByPrimary = [...roundBeers].sort((a, b) => b.primaryWeighted - a.primaryWeighted);
      const primaryPlaceMap = new Map<string, number>();
      sortedByPrimary.forEach((b, idx) => primaryPlaceMap.set(b.beerId, idx + 1));

      // Sort and assign in-round places for presentation votes
      const sortedByPresentation = [...roundBeers].sort((a, b) => b.presentationVotes - a.presentationVotes);
      const presentationPlaceMap = new Map<string, number>();
      sortedByPresentation.forEach((b, idx) => presentationPlaceMap.set(b.beerId, idx + 1));

      // Add to results
      for (const rb of roundBeers) {
        const beer = beerMap.get(rb.beerId);
        const reg = registrationMap.get(rb.beerId);

        // Skip if no registration (shouldn't happen, but be safe)
        if (!reg) continue;

        // Handle missing beer data - beer may have been removed from external API
        // but still has votes/registrations in our system
        const beerData = beer || {
          user_id: "unknown",
          submission_id: rb.beerId,
          beername: `[Deleted Beer: ${rb.beerId.substring(0, 8)}...]`,
          brewer: "Unknown",
          style: "Unknown",
        };

        results.push({
          user_id: beerData.user_id,
          submission_id: beerData.submission_id,
          beer_name: beerData.beername,
          brewer: beerData.brewer,
          style: beerData.style,
          startbahn: reg.startbahn,
          reinheitsgebot: reg.reinheitsgebot,
          round_id: roundId,
          round_name: round.name,

          primary_weighted_votes: rb.primaryWeighted,
          primary_raw_votes: rb.primaryRaw,
          primary_percentage_in_round: Math.round(rb.primaryPercentage * 100) / 100,
          primary_place_in_round: primaryPlaceMap.get(rb.beerId) || 0,
          primary_place_overall: 0, // Will be calculated after

          presentation_votes: rb.presentationVotes,
          presentation_percentage_in_round: Math.round(rb.presentationPercentage * 100) / 100,
          presentation_place_in_round: presentationPlaceMap.get(rb.beerId) || 0,
          presentation_place_overall: 0, // Will be calculated after
        });
      }
    }

    // Calculate overall places based on percentage (matches admin-table.tsx logic)
    // Sort by primary percentage descending and assign overall ranks
    const sortedByPrimaryPercentage = [...results].sort(
      (a, b) => b.primary_percentage_in_round - a.primary_percentage_in_round
    );
    sortedByPrimaryPercentage.forEach((r, idx) => {
      const original = results.find(
        (x) => x.submission_id === r.submission_id && x.round_id === r.round_id
      );
      if (original) original.primary_place_overall = idx + 1;
    });

    // Sort by presentation percentage descending and assign overall ranks
    const sortedByPresentationPercentage = [...results].sort(
      (a, b) => b.presentation_percentage_in_round - a.presentation_percentage_in_round
    );
    sortedByPresentationPercentage.forEach((r, idx) => {
      const original = results.find(
        (x) => x.submission_id === r.submission_id && x.round_id === r.round_id
      );
      if (original) original.presentation_place_overall = idx + 1;
    });

    // Sort final results by primary overall place
    results.sort((a, b) => a.primary_place_overall - b.primary_place_overall);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      total_submissions: results.length,
      results,
    });
  } catch (error) {
    console.error("Error exporting results:", error);
    return NextResponse.json(
      { error: "Failed to export results" },
      { status: 500 }
    );
  }
}
