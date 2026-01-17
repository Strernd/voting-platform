"use client";

import { VotingDrawer } from "@/components/voting-drawer";
import { BeerWithRegistration } from "@/lib/beer-data";
import { Star, Leaf, Trophy } from "lucide-react";

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
  const voteWeight =
    bestBeerVoteIds.length > 0 ? (1 / bestBeerVoteIds.length).toFixed(2) : null;

  return (
    <div
      className={`w-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 ${
        hasAnyVote
          ? "ring-2 ring-primary shadow-lg shadow-primary/20 bg-primary/5"
          : "hover:border-primary/30"
      }`}
    >
      <div className="flex">
        {/* Startbahn Number - Hero Element */}
        <div
          className={`flex flex-col items-center justify-center px-4 min-w-[70px] ${
            hasAnyVote
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10"
          }`}
        >
          <span
            className={`text-3xl font-bold ${hasAnyVote ? "" : "text-primary"}`}
          >
            {beer.startbahn}
          </span>
          {/* Vote indicators */}
          {hasAnyVote && (
            <div className="flex items-center gap-1 mt-0.5">
              {isBestBeerVote && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs font-medium">{voteWeight}</span>
                </div>
              )}
              {isPresentationVote && (
                <Trophy className="h-3 w-3 fill-current" />
              )}
            </div>
          )}
        </div>

        {/* Beer Info */}
        <div className="flex-1 py-2 px-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base leading-tight line-clamp-2">
                {beer.name}
                <span className="text-muted-foreground font-normal"> · {beer.alcohol ? `${beer.alcohol}%` : "??"} ABV</span>
              </h3>

              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {beer.brewer}
              </p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {beer.style.includes(".") ? beer.style.split(".")[1].trim() : beer.style}
                </span>
                {beer.reinheitsgebot && (
                  <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <Leaf className="h-3 w-3" />
                    RHG
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
