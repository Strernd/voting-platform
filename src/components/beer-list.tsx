"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeerCard } from "@/components/beer-card";
import { Beer } from "@/lib/beer-data";
import { Search } from "lucide-react";

interface BeerListProps {
  beers: Beer[];
  voterUuid?: string;
  isRegistered: boolean;
  currentVoteBeerId?: string;
}

export function BeerList({ beers, voterUuid, isRegistered, currentVoteBeerId }: BeerListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");

  const styleOptions = useMemo(() => {
    const styleCounts = beers.reduce((acc, beer) => {
      acc[beer.style] = (acc[beer.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const styles = Object.entries(styleCounts)
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
            className="pl-10 text-white"
          />
        </div>
        
        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Nach Stil filtern" />
          </SelectTrigger>
          <SelectContent>
            {styleOptions.map((option) => (
              <SelectItem key={option.style} value={option.style}>
                <div className="flex items-center justify-between w-full">
                  <span className="capitalize">
                    {option.style === "all" ? "Alle Stile" : option.style}
                  </span>
                  <span className="ml-2 border border-muted-foreground/30 px-2 py-0.5 rounded-full text-xs font-medium">
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
            hasVoted={!!currentVoteBeerId}
            currentVoteBeerId={currentVoteBeerId}
          />
        ))}
      </div>
      
      {filteredBeers.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-8">
          Keine Biere gefunden für "{searchTerm}"
        </p>
      )}
    </div>
  );
}