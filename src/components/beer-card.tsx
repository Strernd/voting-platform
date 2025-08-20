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

function getStyleBadgeColor(style: string): string {
  const lowerStyle = style.toLowerCase();

  if (lowerStyle.includes("lager")) {
    return "bg-blue-500 hover:bg-blue-600";
  } else if (
    lowerStyle.includes("ale") ||
    lowerStyle.includes("ipa") ||
    lowerStyle.includes("porter") ||
    lowerStyle.includes("stout")
  ) {
    return "bg-orange-500 hover:bg-orange-600";
  } else if (
    lowerStyle.includes("wild") ||
    lowerStyle.includes("sour") ||
    lowerStyle.includes("lambic")
  ) {
    return "bg-green-500 hover:bg-green-600";
  }

  return "bg-gray-500 hover:bg-gray-600";
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
                        View Recipe
                      </a>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <p className="text-xs text-muted-foreground">{beer.brewer}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Badge
                className={`${getStyleBadgeColor(
                  beer.style
                )} text-white text-xs px-2 py-0.5`}
              >
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
