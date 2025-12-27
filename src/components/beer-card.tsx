"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { VotingDrawer } from "@/components/voting-drawer";
import { BeerWithRegistration } from "@/lib/beer-data";
import { ExternalLink } from "lucide-react";

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
    <Card
      className={`w-full ${isCurrentVote ? "ring-2 ring-green-500 bg-green-950/30" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {beer.startbahn}
                </span>
              </div>
              {isCurrentVote && voteWeight && (
                <div className="absolute -bottom-1 -right-1 bg-green-600 text-white text-xs px-1 rounded">
                  {voteWeight}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-2">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="text-left">
                    <h3 className="font-semibold text-sm truncate hover:text-blue-400 transition-colors">
                      {beer.name}
                    </h3>
                  </button>
                </SheetTrigger>
                <SheetContent className="px-6 border-border">
                  <SheetHeader>
                    <SheetTitle>{beer.name}</SheetTitle>
                    <SheetDescription className="text-left">
                      {beer.description}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Startbahn:
                    </span>
                    <Badge variant="outline" className="text-lg font-bold">
                      {beer.startbahn}
                    </Badge>
                    {beer.reinheitsgebot && (
                      <Badge className="bg-green-600">RHG</Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <Button asChild className="w-full">
                      <a
                        href={beer.recipeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Rezept ansehen
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <p className="text-xs text-muted-foreground">{beer.brewer}</p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Badge className="border border-muted-foreground/30 bg-transparent text-foreground text-xs px-2 py-0.5">
                {beer.style}
              </Badge>
              {beer.reinheitsgebot && (
                <Badge className="bg-green-600 text-xs px-2 py-0.5">RHG</Badge>
              )}
              <span className="text-muted-foreground">{beer.alcohol}% ABV</span>
              <span className="text-muted-foreground">{beer.ibu} IBU</span>
            </div>
          </div>

          <VotingDrawer
            beer={beer}
            isRegistered={isRegistered}
            currentVoteIds={currentVoteIds}
            votingEnabled={votingEnabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
