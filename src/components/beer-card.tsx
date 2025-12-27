"use client";

import { VotingDrawer } from "@/components/voting-drawer";
import { BeerWithRegistration } from "@/lib/beer-data";
import { Star, Leaf } from "lucide-react";

interface BeerCardProps {
  beer: BeerWithRegistration;
  isRegistered: boolean;
  currentVoteIds: string[];
  votingEnabled?: boolean;
}

export function BeerCard({
  beer,
  isRegistered,
  currentVoteIds,
  votingEnabled = true,
}: BeerCardProps) {
  const isCurrentVote = currentVoteIds.includes(beer.beerId);
  const voteWeight =
    currentVoteIds.length > 0 ? (1 / currentVoteIds.length).toFixed(2) : null;

  return (
    <div
      className={`w-full rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 ${
        isCurrentVote
          ? "ring-2 ring-primary shadow-lg shadow-primary/20 bg-primary/5"
          : "hover:border-primary/30"
      }`}
    >
      <div className="flex">
        {/* Startbahn Number - Hero Element */}
        <div
          className={`flex flex-col items-center justify-center px-4 min-w-[70px] ${
            isCurrentVote
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10"
          }`}
        >
          <span
            className={`text-3xl font-bold ${isCurrentVote ? "" : "text-primary"}`}
          >
            {beer.startbahn}
          </span>
          {isCurrentVote && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">{voteWeight}</span>
            </div>
          )}
        </div>

        {/* Beer Info */}
        <div className="flex-1 py-2 px-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base leading-tight line-clamp-2">
                {beer.name}
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
                <span className="text-xs text-muted-foreground">
                  {beer.alcohol}%
                </span>
              </div>
            </div>

            {/* Vote Button Area */}
            <div className="shrink-0 pl-2">
              <VotingDrawer
                beer={beer}
                isRegistered={isRegistered}
                currentVoteIds={currentVoteIds}
                votingEnabled={votingEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
