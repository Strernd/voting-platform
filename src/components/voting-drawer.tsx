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
  Star,
  Minus,
  CheckCircle,
  XCircle,
  Leaf,
  ExternalLink,
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
        message: "Du musst registriert sein, um zu wählen",
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
        message: "Ein Fehler ist beim Wählen aufgetreten",
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
          variant="ghost"
          size="default"
          className={`h-12 w-12 px-3 py-2 shrink-0 flex items-center justify-center rounded-lg transition-colors ${
            isCurrentVote
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-primary/10"
          }`}
          onClick={resetVoteResult}
        >
          {isCurrentVote ? (
            <Star className="h-5 w-5 fill-current" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="border-border bg-card">
        <DrawerTitle className="sr-only">{beer.name}</DrawerTitle>
        <div className="p-6 max-w-lg mx-auto w-full">
          {/* Beer Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-3xl font-bold text-primary-foreground">
                  {beer.startbahn}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight">{beer.name}</h2>
                <p className="text-muted-foreground">{beer.brewer}</p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {beer.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm">
                {beer.style}
              </Badge>
              <Badge variant="secondary">{beer.alcohol}% ABV</Badge>
              <Badge variant="secondary">{beer.ibu} IBU</Badge>
              {beer.reinheitsgebot && (
                <Badge className="bg-success text-success-foreground">
                  <Leaf className="h-3 w-3 mr-1" />
                  RHG
                </Badge>
              )}
            </div>
          </div>

          {/* Vote Result State */}
          {voteResult ? (
            <div className="space-y-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-xl ${
                  voteResult.success
                    ? "bg-success/10 border border-success/30"
                    : "bg-destructive/10 border border-destructive/30"
                }`}
              >
                {voteResult.success ? (
                  <CheckCircle className="h-6 w-6 text-success shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive shrink-0" />
                )}
                <div>
                  <span
                    className={`font-medium ${
                      voteResult.success ? "text-success" : "text-destructive"
                    }`}
                  >
                    {voteResult.message}
                  </span>
                  {voteResult.success && localVoteIds.length > 0 && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {localVoteIds.length}{" "}
                      {localVoteIds.length === 1 ? "Stimme" : "Stimmen"} ·
                      Gewichtung: {voteWeight} pro Bier
                    </p>
                  )}
                </div>
              </div>

              {!voteResult.success && (
                <Button
                  onClick={handleVote}
                  disabled={!canVote || isVoting}
                  className="w-full h-12 text-base"
                >
                  {isVoting ? "..." : "Erneut versuchen"}
                </Button>
              )}

              {/* Recipe Link */}
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a
                  href={beer.recipeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rezept ansehen
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Vote Status */}
              {isCurrentVote && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30">
                  <Star className="h-6 w-6 text-primary fill-primary shrink-0" />
                  <div>
                    <span className="font-medium text-primary">
                      Du hast für dieses Bier gestimmt
                    </span>
                    <p className="text-muted-foreground text-sm">
                      Gewichtung: {voteWeight}
                    </p>
                  </div>
                </div>
              )}

              {/* Vote Weight Preview */}
              {voteCount > 0 && !isCurrentVote && (
                <div className="p-4 rounded-xl bg-secondary border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Aktuelle Stimmen: {voteCount}
                    </span>
                    <span className="font-medium">
                      Neue Gewichtung: {newVoteWeight}
                    </span>
                  </div>
                </div>
              )}

              {/* Vote Button */}
              <Button
                onClick={handleVote}
                disabled={!canVote || isVoting}
                className={`w-full h-14 text-base font-semibold ${
                  isCurrentVote
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
                size="lg"
              >
                {isCurrentVote ? (
                  <Minus className="h-5 w-5 mr-2" />
                ) : (
                  <Star className="h-5 w-5 mr-2" />
                )}
                {isVoting
                  ? "..."
                  : !votingEnabled
                    ? "Abstimmung geschlossen"
                    : !isRegistered
                      ? "Registrierung erforderlich"
                      : isCurrentVote
                        ? "Stimme entfernen"
                        : "Stimme hinzufügen"}
              </Button>

              {/* Status Messages */}
              {!votingEnabled && (
                <p className="text-center text-warning text-sm">
                  Die Abstimmung ist derzeit geschlossen
                </p>
              )}

              {votingEnabled && !isRegistered && (
                <p className="text-center text-destructive text-sm">
                  Du musst dich mit einem gültigen Code registrieren, um zu
                  wählen
                </p>
              )}

              {/* Recipe Link */}
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <a
                  href={beer.recipeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Rezept ansehen
                </a>
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}