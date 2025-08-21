"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { voteForBeer } from "@/lib/actions";
import { Beer } from "@/lib/beer-data";
import { ChevronRight, ThumbsUp, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface VotingDrawerProps {
  beer: Beer;
  isRegistered: boolean;
  hasVoted: boolean;
  currentVoteBeerId?: string;
}


export function VotingDrawer({ beer, isRegistered, hasVoted, currentVoteBeerId }: VotingDrawerProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleVote = async () => {
    if (!isRegistered) {
      setVoteResult({
        success: false,
        message: "Du musst registriert sein, um zu wählen",
      });
      return;
    }

    setIsVoting(true);
    try {
      const result = await voteForBeer(beer.beerId);
      setVoteResult(result);
    } catch (error) {
      setVoteResult({
        success: false,
        message: "Ein Fehler ist beim Wählen aufgetreten",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const resetVoteResult = () => {
    setVoteResult(null);
  };

  const isCurrentVote = currentVoteBeerId === beer.beerId;
  const hasVotedForOtherBeer = hasVoted && !isCurrentVote;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="h-10 w-12 px-3 py-2 shrink-0 bg-transparent flex items-center justify-center"
          onClick={resetVoteResult}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-border">
        <DrawerTitle className="sr-only">{beer.name}</DrawerTitle>
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">{beer.name}</h2>
            <p className="text-muted-foreground text-sm mb-1">{beer.brewer}</p>
            <p className="text-muted-foreground text-sm mb-4">
              {beer.description}
            </p>
            
            <div className="flex items-center gap-3 text-sm mb-6">
              <Badge className="border border-muted-foreground/30 bg-transparent text-foreground text-xs px-2 py-0.5">
                {beer.style}
              </Badge>
              <span className="text-muted-foreground">{beer.alcohol}% ABV</span>
              <span className="text-muted-foreground">{beer.ibu} IBU</span>
            </div>
          </div>

          {voteResult ? (
            <div className="text-center">
              <div
                className={`inline-flex items-center gap-2 p-4 rounded-lg mb-4 ${
                  voteResult.success
                    ? "bg-green-950 border border-green-800"
                    : "bg-red-950 border border-red-800"
                }`}
              >
                {voteResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span
                  className={
                    voteResult.success ? "text-green-100" : "text-red-100"
                  }
                >
                  {voteResult.message}
                </span>
              </div>
              
              {!voteResult.success && (
                <Button
                  onClick={handleVote}
                  disabled={!isRegistered || isVoting}
                  className="w-full"
                >
                  {isVoting ? "Wähle..." : "Erneut versuchen"}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center">
              {isCurrentVote && (
                <div className="mb-4 p-3 rounded-lg bg-green-950 border border-green-800">
                  <div className="flex items-center gap-2 justify-center">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-green-100 font-medium">
                      Das ist deine aktuelle Stimme
                    </span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleVote}
                disabled={!isRegistered || isVoting}
                className="w-full flex items-center gap-2"
                size="lg"
                variant={isCurrentVote ? "secondary" : "default"}
              >
                <ThumbsUp className="h-5 w-5" />
                {isVoting
                  ? "Wähle..."
                  : !isRegistered
                  ? "Registrierung erforderlich"
                  : isCurrentVote
                  ? "Du hast für dieses Bier gestimmt"
                  : hasVotedForOtherBeer
                  ? "Stimme zu diesem Bier ändern"
                  : "Für dieses Bier stimmen"}
              </Button>
              
              {!isRegistered && (
                <p className="text-red-300 text-sm mt-2">
                  Du musst dich mit einem gültigen Code registrieren, um zu wählen
                </p>
              )}
              
              {hasVotedForOtherBeer && (
                <p className="text-yellow-300 text-sm mt-2">
                  Eine Stimme für dieses Bier ändert deine aktuelle Wahl
                </p>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}