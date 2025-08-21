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
import { Beer } from "@/lib/beer-data";
import { ExternalLink } from "lucide-react";

interface BeerCardProps {
  beer: Beer;
  isRegistered: boolean;
  hasVoted: boolean;
  currentVoteBeerId?: string;
}


export function BeerCard({ beer, isRegistered, hasVoted, currentVoteBeerId }: BeerCardProps) {
  const isCurrentVote = currentVoteBeerId === beer.beerId;
  
  return (
    <Card className={`w-full ${isCurrentVote ? 'ring-2 ring-green-500 bg-green-950/30' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
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

            <div className="flex items-center gap-3 text-xs">
              <Badge className="border border-muted-foreground/30 bg-transparent text-foreground text-xs px-2 py-0.5">
                {beer.style}
              </Badge>
              <span className="text-muted-foreground">{beer.alcohol}% ABV</span>
              <span className="text-muted-foreground">{beer.ibu} IBU</span>
            </div>
          </div>

          <VotingDrawer 
            beer={beer} 
            isRegistered={isRegistered} 
            hasVoted={hasVoted}
            currentVoteBeerId={currentVoteBeerId}
          />
        </div>
      </CardContent>
    </Card>
  );
}
