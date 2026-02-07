"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeerCard } from "@/components/beer-card";
import { BeerWithRegistration } from "@/lib/beer-data";
import { Search } from "lucide-react";

interface BeerListProps {
  beers: BeerWithRegistration[];
  voterUuid?: string;
  isRegistered: boolean;
  bestBeerVoteIds: string[];
  presentationVoteIds: string[];
  votingEnabled?: boolean;
}

export function BeerList({
  beers,
  voterUuid,
  isRegistered,
  bestBeerVoteIds,
  presentationVoteIds,
  votingEnabled = true,
}: BeerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");

  const styleOptions = useMemo(() => {
    const styleCounts = beers.reduce((acc, beer) => {
      const style = beer.style || "Unbekannt";
      acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const styles = Object.entries(styleCounts)
      .filter(([style]) => style !== "")
      .map(([style, count]) => ({ style, count }))
      .sort((a, b) => a.style.localeCompare(b.style));

    return [
      { style: "all", count: beers.length },
      ...styles
    ];
  }, [beers]);

  const filteredBeers = useMemo(() => {
    let filtered = beers;

    if (selectedStyle !== "all") {
      filtered = filtered.filter(beer => beer.style === selectedStyle);
    }

    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (beer) =>
          beer.name.toLowerCase().includes(lowercaseSearch) ||
          beer.brewer.toLowerCase().includes(lowercaseSearch) ||
          beer.style.toLowerCase().includes(lowercaseSearch)
      );
    }

    return filtered;
  }, [beers, searchTerm, selectedStyle]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Suche nach Biername, Brauerei oder Stil..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger className="w-full bg-card">
            <SelectValue placeholder="Nach Stil filtern" />
          </SelectTrigger>
          <SelectContent>
            {styleOptions.map((option) => (
              <SelectItem key={option.style} value={option.style}>
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize">
                    {option.style === "all" ? "Alle Stile" : option.style}
                  </span>
                  <span className="ml-2 border border-border px-2 py-0.5 rounded-full text-xs font-bold">
                    {option.count}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredBeers.map((beer) => (
          <BeerCard
            key={beer.beerId}
            beer={beer}
            isRegistered={isRegistered}
            bestBeerVoteIds={bestBeerVoteIds}
            presentationVoteIds={presentationVoteIds}
            votingEnabled={votingEnabled}
          />
        ))}
      </div>

      {filteredBeers.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-8">
          Keine Biere gefunden für &quot;{searchTerm}&quot;
        </p>
      )}
    </div>
  );
}
