"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toggleVoteForBeer } from "@/lib/actions";
import { VOTE_TYPES, type VoteType } from "@/db/schema";
import { BeerWithRegistration } from "@/lib/beer-data";
import {
  ChevronRight,
  Star,
  Minus,
  CheckCircle,
  XCircle,
  Leaf,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { useState } from "react";

interface VotingDrawerProps {
  beer: BeerWithRegistration;
  isRegistered: boolean;
  bestBeerVoteIds: string[];
  presentationVoteIds: string[];
  votingEnabled?: boolean;
}

export function VotingDrawer({
  beer,
  isRegistered,
  bestBeerVoteIds,
  presentationVoteIds,
  votingEnabled = true,
}: VotingDrawerProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [localBestBeerVoteIds, setLocalBestBeerVoteIds] =
    useState<string[]>(bestBeerVoteIds);
  const [localPresentationVoteIds, setLocalPresentationVoteIds] =
    useState<string[]>(presentationVoteIds);
  const [activeTab, setActiveTab] = useState<string>("best_beer");

  const isBestBeerVote = localBestBeerVoteIds.includes(beer.beerId);
  const isPresentationVote = localPresentationVoteIds.includes(beer.beerId);
  const bestBeerVoteCount = localBestBeerVoteIds.length;
  const voteWeight =
    bestBeerVoteCount > 0 ? (1 / bestBeerVoteCount).toFixed(2) : "1.00";
  const newVoteWeight = isBestBeerVote
    ? bestBeerVoteCount > 1
      ? (1 / (bestBeerVoteCount - 1)).toFixed(2)
      : "0"
    : (1 / (bestBeerVoteCount + 1)).toFixed(2);

  const handleVote = async (voteType: VoteType) => {
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
      const result = await toggleVoteForBeer(beer.beerId, voteType);
      setVoteResult({ success: result.success, message: result.message });
      if (result.bestBeerVotes) {
        setLocalBestBeerVoteIds(result.bestBeerVotes);
      }
      if (result.presentationVotes) {
        setLocalPresentationVoteIds(result.presentationVotes);
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

  // Show indicator if voted for this beer in any category
  const hasAnyVote = isBestBeerVote || isPresentationVote;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className={`h-full w-12 px-3 py-2 shrink-0 flex items-center justify-center rounded-lg transition-colors ${
            hasAnyVote
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "hover:bg-primary/10"
          }`}
          onClick={resetVoteResult}
        >
          {isBestBeerVote && isPresentationVote ? (
            <div className="flex gap-0.5">
              <Star className="h-4 w-4 fill-current" />
              <Trophy className="h-4 w-4 fill-current" />
            </div>
          ) : isBestBeerVote ? (
            <Star className="h-5 w-5 fill-current" />
          ) : isPresentationVote ? (
            <Trophy className="h-5 w-5 fill-current" />
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
          {voteResult && (
            <div className="mb-4">
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
                <span
                  className={`font-medium ${
                    voteResult.success ? "text-success" : "text-destructive"
                  }`}
                >
                  {voteResult.message}
                </span>
              </div>
            </div>
          )}

          {/* Voting Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val);
              setVoteResult(null);
            }}
            className="mb-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="best_beer" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Bestes Bier
              </TabsTrigger>
              <TabsTrigger
                value="best_presentation"
                className="flex items-center gap-2"
              >
                <Trophy className="h-4 w-4" />
                Schaumkrönchen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="best_beer" className="space-y-4 mt-4">
              {/* Current Vote Status */}
              {isBestBeerVote && (
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
              {bestBeerVoteCount > 0 && !isBestBeerVote && (
                <div className="p-4 rounded-xl bg-secondary border border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Aktuelle Stimmen: {bestBeerVoteCount}
                    </span>
                    <span className="font-medium">
                      Neue Gewichtung: {newVoteWeight}
                    </span>
                  </div>
                </div>
              )}

              {/* Vote Info */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p>
                  <strong>Unbegrenzte Stimmen</strong> - Gewichtung wird geteilt
                  (1/N)
                </p>
              </div>

              {/* Vote Button */}
              <Button
                onClick={() => handleVote(VOTE_TYPES.BEST_BEER)}
                disabled={!canVote || isVoting}
                className={`w-full h-14 text-base font-semibold ${
                  isBestBeerVote
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
                size="lg"
              >
                {isBestBeerVote ? (
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
                      : isBestBeerVote
                        ? "Stimme entfernen"
                        : "Stimme hinzufügen"}
              </Button>
            </TabsContent>

            <TabsContent value="best_presentation" className="space-y-4 mt-4">
              {/* Current Vote Status */}
              {isPresentationVote && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30">
                  <Trophy className="h-6 w-6 text-gold fill-gold shrink-0" />
                  <div>
                    <span className="font-medium text-gold">
                      Das goldene Schaumkrönchen
                    </span>
                    <p className="text-muted-foreground text-sm">
                      Deine Wahl für die beste Präsentation
                    </p>
                  </div>
                </div>
              )}

              {/* Presentation Vote Status */}
              {!isPresentationVote &&
                localPresentationVoteIds.length > 0 && (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <p className="text-warning text-sm">
                      Du hast das Schaumkrönchen bereits an ein anderes Bier
                      vergeben. Entferne es dort zuerst.
                    </p>
                  </div>
                )}

              {/* Vote Info */}
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p>
                  <strong>1 Stimme pro Runde</strong> - Wähle die beste
                  Präsentation
                </p>
              </div>

              {/* Vote Button */}
              <Button
                onClick={() => handleVote(VOTE_TYPES.BEST_PRESENTATION)}
                disabled={!canVote || isVoting}
                className={`w-full h-14 text-base font-semibold ${
                  isPresentationVote
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-gold hover:bg-gold/90 text-gold-foreground"
                }`}
                size="lg"
              >
                {isPresentationVote ? (
                  <Minus className="h-5 w-5 mr-2" />
                ) : (
                  <Trophy className="h-5 w-5 mr-2" />
                )}
                {isVoting
                  ? "..."
                  : !votingEnabled
                    ? "Abstimmung geschlossen"
                    : !isRegistered
                      ? "Registrierung erforderlich"
                      : isPresentationVote
                        ? "Schaumkrönchen entfernen"
                        : "Schaumkrönchen vergeben"}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {!votingEnabled && (
            <p className="text-center text-warning text-sm mb-4">
              Die Abstimmung ist derzeit geschlossen
            </p>
          )}

          {votingEnabled && !isRegistered && (
            <p className="text-center text-destructive text-sm mb-4">
              Du musst dich mit einem gültigen Code registrieren, um zu wählen
            </p>
          )}

          {/* Recipe Link */}
          <Button variant="outline" className="w-full" asChild>
            <a href={beer.recipeLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Rezept ansehen
            </a>
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
