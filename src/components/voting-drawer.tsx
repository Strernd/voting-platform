"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toggleVoteForBeer } from "@/lib/actions";
import { BeerWithRegistration } from "@/lib/beer-data";
import {
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface VotingDrawerProps {
  beer: BeerWithRegistration;
  isRegistered: boolean;
  currentVoteIds: string[];
  votingEnabled?: boolean;
}

export function VotingDrawer({
  beer,
  isRegistered,
  currentVoteIds,
  votingEnabled = true,
}: VotingDrawerProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<{
    success: boolean;
    message: string;
    votes?: string[];
  } | null>(null);
  const [localVoteIds, setLocalVoteIds] = useState<string[]>(currentVoteIds);

  const isCurrentVote = localVoteIds.includes(beer.beerId);
  const voteCount = localVoteIds.length;
  const voteWeight = voteCount > 0 ? (1 / voteCount).toFixed(2) : "1.00";
  const newVoteWeight = isCurrentVote
    ? voteCount > 1
      ? (1 / (voteCount - 1)).toFixed(2)
      : "0"
    : (1 / (voteCount + 1)).toFixed(2);

  const handleVote = async () => {
    if (!votingEnabled) {
      setVoteResult({
        success: false,
        message: "Die Abstimmung ist derzeit geschlossen",
      });
      return;
    }

    if (!isRegistered) {
      setVoteResult({
        success: false,
        message: "Du musst registriert sein, um zu wahlen",
      });
      return;
    }

    setIsVoting(true);
    try {
      const result = await toggleVoteForBeer(beer.beerId);
      setVoteResult(result);
      if (result.success && result.votes) {
        setLocalVoteIds(result.votes);
      }
    } catch (error) {
      setVoteResult({
        success: false,
        message: "Ein Fehler ist beim Wahlen aufgetreten",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const canVote = isRegistered && votingEnabled;

  const resetVoteResult = () => {
    setVoteResult(null);
  };

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
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {beer.startbahn}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{beer.name}</h2>
                <p className="text-muted-foreground text-sm">{beer.brewer}</p>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              {beer.description}
            </p>

            <div className="flex items-center gap-3 text-sm mb-6 flex-wrap">
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

              {voteResult.success && localVoteIds.length > 0 && (
                <p className="text-muted-foreground text-sm mb-4">
                  Aktuelle Stimmen: {localVoteIds.length} (Gewichtung:{" "}
                  {voteWeight} pro Bier)
                </p>
              )}

              {!voteResult.success && (
                <Button
                  onClick={handleVote}
                  disabled={!canVote || isVoting}
                  className="w-full"
                >
                  {isVoting ? "..." : "Erneut versuchen"}
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
                      Du hast fur dieses Bier gestimmt
                    </span>
                  </div>
                  <p className="text-green-200 text-sm mt-1">
                    Aktuelle Gewichtung: {voteWeight}
                  </p>
                </div>
              )}

              {voteCount > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-blue-950 border border-blue-800">
                  <p className="text-blue-100 text-sm">
                    Deine Stimmen: {voteCount} | Neue Gewichtung pro Bier:{" "}
                    {newVoteWeight}
                  </p>
                </div>
              )}

              <Button
                onClick={handleVote}
                disabled={!canVote || isVoting}
                className="w-full flex items-center gap-2"
                size="lg"
                variant={isCurrentVote ? "destructive" : "default"}
              >
                {isCurrentVote ? (
                  <ThumbsDown className="h-5 w-5" />
                ) : (
                  <ThumbsUp className="h-5 w-5" />
                )}
                {isVoting
                  ? "..."
                  : !votingEnabled
                    ? "Abstimmung geschlossen"
                    : !isRegistered
                      ? "Registrierung erforderlich"
                      : isCurrentVote
                        ? "Stimme entfernen"
                        : "Stimme hinzufugen"}
              </Button>

              {!votingEnabled && (
                <p className="text-yellow-300 text-sm mt-2">
                  Die Abstimmung ist derzeit geschlossen
                </p>
              )}

              {votingEnabled && !isRegistered && (
                <p className="text-red-300 text-sm mt-2">
                  Du musst dich mit einem gultigen Code registrieren, um zu
                  wahlen
                </p>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}