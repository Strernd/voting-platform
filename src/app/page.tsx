import { BeerList } from "@/components/beer-list";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentVotes,
  getActiveRound,
  isVotingEnabled,
} from "@/lib/actions";
import { getBeers } from "@/lib/beer-data";
import { getVoterSession } from "@/lib/session";
import { Star, AlertCircle, CheckCircle2, XCircle, Crown } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function Home() {
  const beers = await getBeers();
  const voterUuid = await getVoterSession();
  const isRegistered = !!voterUuid;
  const currentVotes = await getCurrentVotes();
  const activeRound = await getActiveRound();
  const votingEnabled = await isVotingEnabled();

  const bestBeerVoteIds = currentVotes.bestBeer;
  const presentationVoteIds = currentVotes.presentation;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
        {/* Four-stripe accent bar */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-water" />
          <div className="flex-1 bg-hops" />
          <div className="flex-1 bg-malt" />
          <div className="flex-1 bg-yeast" />
        </div>
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/bhs_logo.png"
                alt="Bundes Heimbrau Spiele"
                width={64}
                height={64}
                className="shrink-0"
              />
              <div>
                <h1 className="text-lg font-bold text-foreground uppercase tracking-wide">
                  {activeRound ? activeRound.name : "Heimbrau Spiele"}
                </h1>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {isRegistered ? (
                <Badge
                  variant="outline"
                  className="bg-hops/10 text-hops border-hops/30"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Registriert
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Nicht registriert
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl flex-1">
        {/* Voting Status Banner */}
        {!votingEnabled && (
          <div className="mb-6 p-4 rounded-xl bg-malt/10 border border-malt/30 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-malt shrink-0" />
            <div>
              <p className="font-bold text-foreground">
                Abstimmung geschlossen
              </p>
              <p className="text-sm text-muted-foreground">
                Die Abstimmung ist derzeit nicht aktiv.
              </p>
            </div>
          </div>
        )}

        {/* Registration Prompt */}
        {!isRegistered && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-muted-foreground">
              Scanne deinen QR-Code um dich zu registrieren und abstimmen zu
              konnen.
            </p>
          </div>
        )}

        {/* Vote Count & Weight Display */}
        {(bestBeerVoteIds.length > 0 || presentationVoteIds.length > 0) && (
          <div className="mb-6 space-y-2">
            {/* Best Beer Votes */}
            {bestBeerVoteIds.length > 0 && (
              <div className="p-4 rounded-xl bg-malt/10 border border-malt/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-malt fill-malt" />
                    <span className="font-bold text-foreground">
                      Bestes Bier: {bestBeerVoteIds.length}{" "}
                      {bestBeerVoteIds.length === 1 ? "Stimme" : "Stimmen"}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono bg-malt/20 text-foreground">
                    {(1 / bestBeerVoteIds.length).toFixed(2)} Gewichtung
                  </Badge>
                </div>
              </div>
            )}
            {/* Presentation Vote */}
            {presentationVoteIds.length > 0 && (
              <div className="p-4 rounded-xl bg-yeast/10 border border-yeast/30">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yeast fill-yeast" />
                  <span className="font-bold text-foreground">
                    Schaumkrönchen: 1/1
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Active Round */}
        {!activeRound && (
          <div className="text-center py-12">
            <Image
              src="/bhs_logo.png"
              alt="Bundes Heimbrau Spiele"
              width={80}
              height={80}
              className="mx-auto mb-4 opacity-40"
            />
            <h2 className="text-xl font-bold mb-2 uppercase">Keine aktive Runde</h2>
            <p className="text-muted-foreground">
              Derzeit ist keine Abstimmungsrunde aktiv.
            </p>
          </div>
        )}

        {/* Beer List */}
        {activeRound && (
          <BeerList
            beers={beers}
            voterUuid={voterUuid}
            isRegistered={isRegistered}
            bestBeerVoteIds={bestBeerVoteIds}
            presentationVoteIds={presentationVoteIds}
            votingEnabled={votingEnabled}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-4 py-3 max-w-2xl">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Gebaut von Lagerbernd</span>
            <a
              href="https://brewforge.sh/m/hbcon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-water hover:underline font-bold"
            >
              30% Rabatt auf Brewforge
            </a>
          </div>
        </div>
        {/* Four-stripe accent bar */}
        <div className="flex h-1 w-full">
          <div className="flex-1 bg-water" />
          <div className="flex-1 bg-hops" />
          <div className="flex-1 bg-malt" />
          <div className="flex-1 bg-yeast" />
        </div>
      </footer>
    </div>
  );
}
