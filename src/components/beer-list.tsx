"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
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

  const filteredBeers = useMemo(() => {
    if (!searchTerm) return beers;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return beers.filter(
      (beer) =>
        beer.name.toLowerCase().includes(lowercaseSearch) ||
        beer.brewer.toLowerCase().includes(lowercaseSearch)
    );
  }, [beers, searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by beer name or brewery..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-white"
        />
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
          No beers found matching "{searchTerm}"
        </p>
      )}
    </div>
  );
}