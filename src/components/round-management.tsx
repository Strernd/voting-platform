"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createRound, setActiveRound, assignBeersToRound, getRounds, getBeersInRound, getAllAssignedBeerIds } from "@/lib/actions";
import { getAllBeers } from "@/lib/beer-data";
import type { Round } from "@/db/schema";
import type { Beer } from "@/lib/beer-data";

export function RoundManagement() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [availableBeers, setAvailableBeers] = useState<Beer[]>([]);
  const [newRoundName, setNewRoundName] = useState("");
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedBeers, setSelectedBeers] = useState<Set<string>>(new Set());
  const [beersInRounds, setBeersInRounds] = useState<Map<number, string[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [roundsData, beersData, assignedBeerIds] = await Promise.all([
        getRounds(),
        getAllBeers(),
        getAllAssignedBeerIds()
      ]);
      
      setRounds(roundsData);
      setAllBeers(beersData);
      
      // Filter to only show unassigned beers
      const unassignedBeers = beersData.filter(beer => !assignedBeerIds.has(beer.beerId));
      setAvailableBeers(unassignedBeers);
      
      // Load beers for each round
      const beersMap = new Map<number, string[]>();
      for (const round of roundsData) {
        const beerRounds = await getBeersInRound(round.id);
        beersMap.set(round.id, beerRounds.map(br => br.beerId));
      }
      setBeersInRounds(beersMap);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) return;
    
    const result = await createRound(newRoundName.trim());
    if (result.success) {
      setNewRoundName("");
      await loadData();
    } else {
      alert(result.message);
    }
  };

  const handleSetActiveRound = async (roundId: number) => {
    const result = await setActiveRound(roundId);
    if (result.success) {
      await loadData();
    } else {
      alert(result.message);
    }
  };

  const handleBeerToggle = (beerId: string) => {
    const newSelected = new Set(selectedBeers);
    if (newSelected.has(beerId)) {
      newSelected.delete(beerId);
    } else {
      newSelected.add(beerId);
    }
    setSelectedBeers(newSelected);
  };

  const handleAssignBeers = async () => {
    if (selectedRound === null) return;
    
    const result = await assignBeersToRound(selectedRound, Array.from(selectedBeers));
    if (result.success) {
      setSelectedBeers(new Set());
      await loadData();
    } else {
      alert(result.message);
    }
  };

  const selectRoundForAssignment = (roundId: number) => {
    setSelectedRound(roundId);
    const existingBeers = beersInRounds.get(roundId) || [];
    setSelectedBeers(new Set(existingBeers));
  };

  if (loading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create New Round */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Round</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Round name"
              value={newRoundName}
              onChange={(e) => setNewRoundName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateRound()}
            />
            <Button onClick={handleCreateRound} disabled={!newRoundName.trim()}>
              Create Round
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rounds List */}
      <Card>
        <CardHeader>
          <CardTitle>Rounds Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rounds.map((round, index) => (
              <div key={round.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{index + 1}: {round.name}</span>
                  {round.active && <Badge variant="default">Active</Badge>}
                  <span className="text-sm text-muted-foreground">
                    ({beersInRounds.get(round.id)?.length || 0} beers)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectRoundForAssignment(round.id)}
                  >
                    Assign Beers
                  </Button>
                  {!round.active && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSetActiveRound(round.id)}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {rounds.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No rounds created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Beer Assignment */}
      {selectedRound !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              Assign Beers to #{rounds.findIndex(r => r.id === selectedRound) + 1}: {rounds.find(r => r.id === selectedRound)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedBeers.size} beers selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelectedBeers(new Set())}>
                    Clear All
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedBeers(new Set(availableBeers.map(b => b.beerId)))}>
                    Select All Available
                  </Button>
                  <Button onClick={handleAssignBeers}>
                    Save Assignment
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {/* Show currently assigned beers for this round first */}
                {beersInRounds.get(selectedRound)?.map(beerId => {
                  const beer = allBeers.find(b => b.beerId === beerId);
                  if (!beer) return null;
                  return (
                    <div
                      key={beer.beerId}
                      className="p-2 border rounded bg-primary/10 border-primary"
                    >
                      <div className="font-medium">{beer.name} (Currently Assigned)</div>
                      <div className="text-sm text-muted-foreground">
                        {beer.brewer} - {beer.style}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show available (unassigned) beers */}
                {availableBeers.map((beer) => (
                  <div
                    key={beer.beerId}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedBeers.has(beer.beerId)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleBeerToggle(beer.beerId)}
                  >
                    <div className="font-medium">{beer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {beer.brewer} - {beer.style}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}