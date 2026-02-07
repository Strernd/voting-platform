"use client";

import { VotingDrawer } from "@/components/voting-drawer";
import { BeerWithRegistration } from "@/lib/beer-data";
import { Star, Leaf, Crown } from "lucide-react";

interface BeerCardProps {
  beer: BeerWithRegistration;
  isRegistered: boolean;
  bestBeerVoteIds: string[];
  presentationVoteIds: string[];
  votingEnabled?: boolean;
}

export function BeerCard({
  beer,
  isRegistered,
  bestBeerVoteIds,
  presentationVoteIds,
  votingEnabled = true,
}: BeerCardProps) {
  const isBestBeerVote = bestBeerVoteIds.includes(beer.beerId);
  const isPresentationVote = presentationVoteIds.includes(beer.beerId);
  const hasAnyVote = isBestBeerVote || isPresentationVote;
  const hasBothVotes = isBestBeerVote && isPresentationVote;
  const voteWeight =
    bestBeerVoteIds.length > 0 ? (1 / bestBeerVoteIds.length).toFixed(2) : null;

  // Cycle through accent colors based on startbahn for visual variety
  const accentBgs = ["bg-water/10", "bg-hops/10", "bg-malt/10", "bg-yeast/10"];
  const accentIndex = (beer.startbahn - 1) % accentBgs.length;

  // Voted state: use the vote color for the startbahn area
  const votedStartbahn = hasBothVotes
    ? "bg-gradient-to-b from-malt to-yeast text-white"
    : isBestBeerVote
      ? "bg-malt text-white"
      : "bg-yeast text-white";

  // Card ring + shadow for voted state
  const votedCard = hasBothVotes
    ? "ring-2 ring-malt/40 shadow-lg shadow-malt/10"
    : isBestBeerVote
      ? "ring-2 ring-malt/30 shadow-lg shadow-malt/10"
      : "ring-2 ring-yeast/30 shadow-lg shadow-yeast/10";

  return (
    <div
      className={`w-full rounded-xl bg-card text-card-foreground overflow-hidden transition-all duration-200 ${
        hasAnyVote
          ? votedCard
          : "shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex">
        {/* Startbahn Number */}
        <div
          className={`flex flex-col items-center justify-center px-4 min-w-[70px] ${
            hasAnyVote
              ? votedStartbahn
              : accentBgs[accentIndex]
          }`}
        >
          <span className={`text-3xl font-bold ${hasAnyVote ? "drop-shadow-sm" : "text-[#5C5647]"}`}>
            {beer.startbahn}
          </span>
          {/* Vote indicators */}
          {hasAnyVote && (
            <div className="flex items-center gap-1.5 mt-1">
              {isBestBeerVote && (
                <div className="flex items-center gap-0.5 bg-white/25 rounded-full px-1.5 py-0.5">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-[10px] font-bold">{voteWeight}</span>
                </div>
              )}
              {isPresentationVote && (
                <div className="bg-white/25 rounded-full p-1">
                  <Crown className="h-3 w-3 fill-current" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Beer Info */}
        <div className="flex-1 py-2 px-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base leading-tight line-clamp-2 text-foreground">
                {beer.name}
                <span className="text-muted-foreground font-normal"> · {beer.alcohol ? `${beer.alcohol}%` : "??"} ABV</span>
              </h3>

              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {beer.brewer}
              </p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                  {beer.style.includes(".") ? beer.style.split(".")[1].trim() : beer.style}
                </span>
                {beer.reinheitsgebot && (
                  <span className="text-xs text-hops bg-hops/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Leaf className="h-3 w-3" />
                    RHG
                  </span>
                )}
                {/* Vote type badges in the info area */}
                {isBestBeerVote && (
                  <span className="text-xs text-malt bg-malt/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Star className="h-3 w-3 fill-malt" />
                    Bestes Bier
                  </span>
                )}
                {isPresentationVote && (
                  <span className="text-xs text-yeast bg-yeast/10 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Crown className="h-3 w-3 fill-yeast" />
                    Schaumkrönchen
                  </span>
                )}
              </div>
            </div>

            {/* Vote Button Area */}
            <div className="shrink-0 pl-2 flex items-stretch self-stretch">
              <VotingDrawer
                beer={beer}
                isRegistered={isRegistered}
                bestBeerVoteIds={bestBeerVoteIds}
                presentationVoteIds={presentationVoteIds}
                votingEnabled={votingEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
