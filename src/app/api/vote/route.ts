import { NextRequest, NextResponse } from "next/server";
import { toggleVoteForBeer } from "@/lib/actions";
import { VOTE_TYPES } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { beerId, voteType } = await request.json();

    if (!beerId) {
      return NextResponse.json(
        { error: "beerId is required" },
        { status: 400 }
      );
    }

    const result = await toggleVoteForBeer(
      beerId,
      voteType || VOTE_TYPES.BEST_BEER
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
