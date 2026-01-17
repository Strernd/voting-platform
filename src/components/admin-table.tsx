"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { getRounds } from "@/lib/actions";
import { VOTE_TYPES } from "@/db/schema";
import { Trophy, Medal, Award, Leaf, Monitor, Printer, Star } from "lucide-react";
import Link from "next/link";
import type { Round } from "@/db/schema";

interface BeerWithVotes {
  id: string;
  name: string;
  brewer: string;
  style: string;
  votes: number;
  rawVotes: number;
  startbahn: number;
  reinheitsgebot: boolean;
}

interface BeerWithPercentage extends BeerWithVotes {
  percentage: number;
  roundId: number;
  roundName: string;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gold/20">
        <Trophy className="h-4 w-4 text-gold" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-silver/20">
        <Medal className="h-4 w-4 text-silver" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bronze/20">
        <Award className="h-4 w-4 text-bronze" />
      </div>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground font-medium">
      {rank}
    </span>
  );
}

export function AdminTable() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [bestBeerData, setBestBeerData] = useState<Map<number, BeerWithVotes[]>>(new Map());
  const [presentationData, setPresentationData] = useState<Map<number, BeerWithVotes[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overall");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roundsData = await getRounds();
        setRounds(roundsData);

        // Fetch beer data for each round and vote type
        const bestBeerMap = new Map<number, BeerWithVotes[]>();
        const presentationMap = new Map<number, BeerWithVotes[]>();

        await Promise.all(
          roundsData.flatMap((round) => [
            // Fetch best beer votes
            fetch(`/api/admin/beers-with-votes?roundId=${round.id}&voteType=${VOTE_TYPES.BEST_BEER}`)
              .then(res => res.json())
              .then(data => bestBeerMap.set(round.id, data)),
            // Fetch presentation votes
            fetch(`/api/admin/beers-with-votes?roundId=${round.id}&voteType=${VOTE_TYPES.BEST_PRESENTATION}`)
              .then(res => res.json())
              .then(data => presentationMap.set(round.id, data)),
          ])
        );

        setBestBeerData(bestBeerMap);
        setPresentationData(presentationMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No rounds found. Create a round first.
      </div>
    );
  }

  // Calculate overall ranking by percentage across all rounds (best beer only)
  const overallRanking: BeerWithPercentage[] = [];

  rounds.forEach((round) => {
    const beers = bestBeerData.get(round.id) || [];
    const totalVotes = beers.reduce((sum, beer) => sum + beer.votes, 0);

    beers.forEach((beer) => {
      const percentage = totalVotes > 0 ? (beer.votes / totalVotes) * 100 : 0;
      overallRanking.push({
        ...beer,
        percentage,
        roundId: round.id,
        roundName: round.name,
      });
    });
  });

  // Sort by percentage descending
  overallRanking.sort((a, b) => b.percentage - a.percentage);

  const OverallTable = () => {
    const maxPercentage = Math.max(...overallRanking.map((b) => b.percentage), 1);

    return (
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead className="w-[70px] text-center">Startbahn</TableHead>
              <TableHead className="min-w-[200px]">Bier</TableHead>
              <TableHead className="w-[120px]">Runde</TableHead>
              <TableHead className="w-[150px] hidden md:table-cell">
                Brauerei
              </TableHead>
              <TableHead className="w-[60px] text-center hidden sm:table-cell">
                RHG
              </TableHead>
              <TableHead className="text-right w-[150px]">Anteil in Runde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overallRanking.map((beer, index) => {
              const rank = index + 1;
              const barWidth = (beer.percentage / maxPercentage) * 100;

              return (
                <TableRow
                  key={`${beer.roundId}-${beer.id}`}
                  className={`${
                    rank <= 3
                      ? "bg-gradient-to-r from-transparent"
                      : ""
                  } ${rank === 1 ? "to-gold/5" : rank === 2 ? "to-silver/5" : rank === 3 ? "to-bronze/5" : ""}`}
                >
                  <TableCell className="text-center">
                    <RankBadge rank={rank} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {beer.startbahn}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{beer.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {beer.style}
                    </div>
                    <div className="md:hidden text-xs text-muted-foreground mt-1">
                      {beer.brewer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {beer.roundName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {beer.brewer}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {beer.reinheitsgebot && (
                      <Badge className="bg-success/10 text-success border-success/30">
                        <Leaf className="h-3 w-3" />
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-lg">
                          {beer.percentage.toFixed(1)}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rank === 1
                              ? "bg-gold"
                              : rank === 2
                                ? "bg-silver"
                                : rank === 3
                                  ? "bg-bronze"
                                  : "bg-primary"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {overallRanking.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Keine Biere registriert
          </div>
        )}
      </div>
    );
  };

  const BeerTable = ({ beers, isPresentation = false }: { beers: BeerWithVotes[]; isPresentation?: boolean }) => {
    const totalVotes = beers.reduce((sum, beer) => sum + beer.votes, 0);
    const totalRawVotes = beers.reduce((sum, beer) => sum + beer.rawVotes, 0);
    const maxVotes = Math.max(...beers.map((b) => b.votes), 1);

    return (
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[50px] text-center">#</TableHead>
              <TableHead className="w-[70px] text-center">Startbahn</TableHead>
              <TableHead className="min-w-[200px]">Bier</TableHead>
              <TableHead className="w-[150px] hidden md:table-cell">
                Brauerei
              </TableHead>
              <TableHead className="w-[60px] text-center hidden sm:table-cell">
                RHG
              </TableHead>
              <TableHead className="text-right w-[180px]">
                {isPresentation ? "Stimmen" : "Punkte"}
              </TableHead>
              {!isPresentation && (
                <TableHead className="text-right w-[80px] hidden sm:table-cell">
                  Stimmen
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Summary Row */}
            <TableRow className="bg-primary/5 hover:bg-primary/10 border-b-2 border-primary/20">
              <TableCell colSpan={2} className="font-bold text-primary">
                Gesamt
              </TableCell>
              <TableCell colSpan={2} className="hidden md:table-cell" />
              <TableCell className="hidden sm:table-cell" />
              <TableCell className="text-right font-bold text-primary text-lg">
                {isPresentation ? totalVotes : totalVotes.toFixed(2)}
              </TableCell>
              {!isPresentation && (
                <TableCell className="text-right font-bold text-muted-foreground hidden sm:table-cell">
                  {totalRawVotes}
                </TableCell>
              )}
            </TableRow>

            {beers.map((beer, index) => {
              const rank = index + 1;
              const percentage =
                totalVotes > 0 ? (beer.votes / totalVotes) * 100 : 0;
              const barWidth = (beer.votes / maxVotes) * 100;

              return (
                <TableRow
                  key={beer.id}
                  className={`${
                    rank <= 3
                      ? "bg-gradient-to-r from-transparent"
                      : ""
                  } ${rank === 1 ? "to-gold/5" : rank === 2 ? "to-silver/5" : rank === 3 ? "to-bronze/5" : ""}`}
                >
                  <TableCell className="text-center">
                    <RankBadge rank={rank} />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <span className="text-lg font-bold text-primary">
                        {beer.startbahn}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold">{beer.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {beer.style}
                    </div>
                    <div className="md:hidden text-xs text-muted-foreground mt-1">
                      {beer.brewer}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {beer.brewer}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {beer.reinheitsgebot && (
                      <Badge className="bg-success/10 text-success border-success/30">
                        <Leaf className="h-3 w-3" />
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-bold text-lg">
                          {isPresentation ? beer.votes : beer.votes.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground text-xs w-12 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            rank === 1
                              ? "bg-gold"
                              : rank === 2
                                ? "bg-silver"
                                : rank === 3
                                  ? "bg-bronze"
                                  : "bg-primary"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  {!isPresentation && (
                    <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                      {beer.rawVotes}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {beers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Keine Biere in dieser Runde registriert
          </div>
        )}
      </div>
    );
  };

  const RoundContent = ({ round }: { round: Round }) => {
    const [categoryTab, setCategoryTab] = useState("best_beer");

    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <Tabs value={categoryTab} onValueChange={setCategoryTab}>
            <TabsList>
              <TabsTrigger value="best_beer" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Bestes Bier
              </TabsTrigger>
              <TabsTrigger value="presentation" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Schaumkrönchen
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Link
              href={`/display/${round.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Monitor className="h-4 w-4" />
              TV-Anzeige
            </Link>
            <Link
              href={`/display/${round.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Printer className="h-4 w-4" />
              Drucken
            </Link>
          </div>
        </div>

        {categoryTab === "best_beer" ? (
          <BeerTable beers={bestBeerData.get(round.id) || []} />
        ) : (
          <BeerTable beers={presentationData.get(round.id) || []} isPresentation />
        )}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground flex-wrap">
        <TabsTrigger value="overall" className="inline-flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Gesamt
        </TabsTrigger>
        {rounds.map((round) => (
          <TabsTrigger key={round.id} value={round.id.toString()} className="inline-flex items-center gap-2">
            {round.id}: {round.name}
            {round.active && <Badge variant="secondary" className="text-xs">Aktiv</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="overall">
        <OverallTable />
      </TabsContent>

      {rounds.map((round) => (
        <TabsContent key={round.id} value={round.id.toString()}>
          <RoundContent round={round} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
