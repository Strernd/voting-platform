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

export function AdminTable() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [beersData, setBeersData] = useState<Map<number, BeerWithVotes[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roundsData = await getRounds();
        setRounds(roundsData);
        
        // Set initial active tab to the active round or first round
        const activeRound = roundsData.find(r => r.active);
        setActiveTab(activeRound ? activeRound.id.toString() : roundsData[0]?.id.toString() || "");

        // Fetch beer data for each round
        const beersMap = new Map<number, BeerWithVotes[]>();
        
        await Promise.all(
          roundsData.map(async (round) => {
            const response = await fetch(`/api/admin/beers-with-votes?roundId=${round.id}`);
            if (!response.ok) {
              throw new Error(`Failed to fetch data for round ${round.id}`);
            }
            const data = await response.json();
            beersMap.set(round.id, data);
          })
        );
        
        setBeersData(beersMap);
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

  const BeerTable = ({ beers }: { beers: BeerWithVotes[] }) => {
    const totalVotes = beers.reduce((sum, beer) => sum + beer.votes, 0);
    const totalRawVotes = beers.reduce((sum, beer) => sum + beer.rawVotes, 0);

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Startbahn</TableHead>
              <TableHead className="w-[250px]">Bier</TableHead>
              <TableHead className="w-[150px]">Brauerei</TableHead>
              <TableHead className="w-[60px]">RHG</TableHead>
              <TableHead className="text-right w-[120px]">
                Gewichtete Punkte
              </TableHead>
              <TableHead className="text-right w-[80px]">Stimmen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/50 font-medium">
              <TableCell colSpan={4} className="font-bold">
                Gesamt
              </TableCell>
              <TableCell className="text-right font-bold">
                {totalVotes.toFixed(2)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {totalRawVotes}
              </TableCell>
            </TableRow>

            {beers.map((beer, index) => {
              const percentage =
                totalVotes > 0 ? (beer.votes / totalVotes) * 100 : 0;
              return (
                <TableRow key={beer.id}>
                  <TableCell className="font-bold text-lg">
                    {beer.startbahn}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{beer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {beer.style}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{beer.brewer}</TableCell>
                  <TableCell>
                    {beer.reinheitsgebot && (
                      <Badge className="bg-green-600 text-xs">Ja</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">{beer.votes.toFixed(2)}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {beer.rawVotes}
                  </TableCell>
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

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {rounds.map((round) => (
          <TabsTrigger key={round.id} value={round.id.toString()} className="inline-flex items-center gap-2">
            {round.id}: {round.name}
            {round.active && <Badge variant="secondary" className="text-xs">Active</Badge>}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {rounds.map((round) => (
        <TabsContent key={round.id} value={round.id.toString()}>
          <BeerTable beers={beersData.get(round.id) || []} />
        </TabsContent>
      ))}
    </Tabs>
  );
}