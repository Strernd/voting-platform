"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  registerBeer,
  getRegisteredBeers,
  getAvailableStartbahns,
  getRounds,
  unregisterBeer,
} from "@/lib/actions";
import { getAllBeers, type Beer } from "@/lib/beer-data";
import type { Round, BeerRegistration as BeerRegistrationType } from "@/db/schema";
import { Search, Check, X, Trash2 } from "lucide-react";

export function BeerRegistration() {
  const [allBeers, setAllBeers] = useState<Beer[]>([]);
  const [registrations, setRegistrations] = useState<BeerRegistrationType[]>(
    []
  );
  const [rounds, setRounds] = useState<Round[]>([]);
  const [availableStartbahns, setAvailableStartbahns] = useState<number[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedStartbahn, setSelectedStartbahn] = useState<string>("");
  const [reinheitsgebot, setReinheitsgebot] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRound) {
      loadAvailableStartbahns(parseInt(selectedRound));
    }
  }, [selectedRound]);

  const loadData = async () => {
    try {
      const [beersData, registrationsData, roundsData] = await Promise.all([
        getAllBeers(),
        getRegisteredBeers(),
        getRounds(),
      ]);
      setAllBeers(beersData);
      setRegistrations(registrationsData);
      setRounds(roundsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStartbahns = async (roundId: number) => {
    try {
      const startbahns = await getAvailableStartbahns(roundId);
      setAvailableStartbahns(startbahns);
      setSelectedStartbahn("");
    } catch (error) {
      console.error("Error loading available startbahns:", error);
    }
  };

  const registeredBeerIds = useMemo(
    () => new Set(registrations.map((r) => r.beerId)),
    [registrations]
  );

  const unregisteredBeers = useMemo(
    () => allBeers.filter((beer) => !registeredBeerIds.has(beer.beerId)),
    [allBeers, registeredBeerIds]
  );

  const filteredUnregisteredBeers = useMemo(() => {
    if (!searchTerm) return unregisteredBeers;
    const lowercaseSearch = searchTerm.toLowerCase();
    return unregisteredBeers.filter(
      (beer) =>
        beer.name.toLowerCase().includes(lowercaseSearch) ||
        beer.brewer.toLowerCase().includes(lowercaseSearch) ||
        beer.style.toLowerCase().includes(lowercaseSearch)
    );
  }, [unregisteredBeers, searchTerm]);

  const registeredBeersWithDetails = useMemo(() => {
    return registrations
      .map((reg) => {
        const beer = allBeers.find((b) => b.beerId === reg.beerId);
        const round = rounds.find((r) => r.id === reg.roundId);
        return { ...reg, beer, round };
      })
      .sort((a, b) => {
        if (a.roundId !== b.roundId) return a.roundId - b.roundId;
        return a.startbahn - b.startbahn;
      });
  }, [registrations, allBeers, rounds]);

  const handleSelectBeer = (beer: Beer) => {
    setSelectedBeer(beer);
  };

  const handleRegister = async () => {
    if (!selectedBeer || !selectedRound || !selectedStartbahn) return;

    setRegistering(true);
    try {
      const result = await registerBeer(
        selectedBeer.beerId,
        parseInt(selectedStartbahn),
        parseInt(selectedRound),
        reinheitsgebot
      );
      if (result.success) {
        setSelectedBeer(null);
        setSelectedStartbahn("");
        setReinheitsgebot(false);
        await loadData();
        if (selectedRound) {
          await loadAvailableStartbahns(parseInt(selectedRound));
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error registering beer:", error);
      alert("Fehler beim Registrieren des Biers");
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async (beerId: string) => {
    if (!confirm("Registrierung wirklich entfernen?")) return;

    try {
      const result = await unregisterBeer(beerId);
      if (result.success) {
        await loadData();
        if (selectedRound) {
          await loadAvailableStartbahns(parseInt(selectedRound));
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error unregistering beer:", error);
    }
  };

  if (loading) {
    return <div className="text-center py-6">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bier registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Runde auswahlen</label>
                <Select value={selectedRound} onValueChange={setSelectedRound}>
                  <SelectTrigger>
                    <SelectValue placeholder="Runde wahlen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((round) => (
                      <SelectItem key={round.id} value={round.id.toString()}>
                        {round.id}: {round.name}
                        {round.active && " (Aktiv)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Startbahn</label>
                <Select
                  value={selectedStartbahn}
                  onValueChange={setSelectedStartbahn}
                  disabled={!selectedRound || availableStartbahns.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedRound
                          ? "Erst Runde wahlen"
                          : availableStartbahns.length === 0
                            ? "Keine verfugbar"
                            : "Startbahn wahlen..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStartbahns.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Startbahn {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRound && (
                  <p className="text-xs text-muted-foreground">
                    {availableStartbahns.length} Startbahnen verfugbar
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Reinheitsgebot:</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={reinheitsgebot ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReinheitsgebot(true)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Ja
                </Button>
                <Button
                  type="button"
                  variant={!reinheitsgebot ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReinheitsgebot(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Nein
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Bier suchen ({unregisteredBeers.length} nicht registriert)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nach Biername, Brauerei oder Stil suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {selectedBeer && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedBeer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedBeer.brewer} - {selectedBeer.style}
                    </p>
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={
                      registering || !selectedRound || !selectedStartbahn
                    }
                  >
                    {registering ? "Registriere..." : "Registrieren"}
                  </Button>
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {filteredUnregisteredBeers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {searchTerm
                    ? "Keine Biere gefunden"
                    : "Alle Biere sind registriert"}
                </p>
              ) : (
                <div className="divide-y">
                  {filteredUnregisteredBeers.map((beer) => (
                    <div
                      key={beer.beerId}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedBeer?.beerId === beer.beerId
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => handleSelectBeer(beer)}
                    >
                      <p className="font-medium">{beer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {beer.brewer} - {beer.style}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrierte Biere ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {registeredBeersWithDetails.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Noch keine Biere registriert
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Startbahn</TableHead>
                    <TableHead>Bier</TableHead>
                    <TableHead>Brauerei</TableHead>
                    <TableHead>Runde</TableHead>
                    <TableHead className="w-20">RHG</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredBeersWithDetails.map((item) => (
                    <TableRow key={item.beerId}>
                      <TableCell className="font-bold text-lg">
                        {item.startbahn}
                      </TableCell>
                      <TableCell>{item.beer?.name || item.beerId}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.beer?.brewer || "-"}
                      </TableCell>
                      <TableCell>
                        {item.round ? (
                          <Badge variant={item.round.active ? "default" : "secondary"}>
                            {item.round.id}: {item.round.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.reinheitsgebot ? "default" : "secondary"
                          }
                          className={
                            item.reinheitsgebot
                              ? "bg-green-600"
                              : "bg-gray-600"
                          }
                        >
                          {item.reinheitsgebot ? "Ja" : "Nein"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnregister(item.beerId)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
