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
  createRound,
  setActiveRound,
} from "@/lib/actions";
import { getAllBeers, type Beer as BeerType } from "@/lib/beer-data";
import type { Round, BeerRegistration as BeerRegistrationType } from "@/db/schema";
import { Search, Check, X, Trash2, Beer, Leaf, CheckCircle, Plus, Layers, RefreshCw, Edit2 } from "lucide-react";

export function BeerRegistration() {
  const [allBeers, setAllBeers] = useState<BeerType[]>([]);
  const [registrations, setRegistrations] = useState<BeerRegistrationType[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [availableStartbahns, setAvailableStartbahns] = useState<number[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeer, setSelectedBeer] = useState<BeerType | null>(null);
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [selectedStartbahn, setSelectedStartbahn] = useState<string>("");
  const [reinheitsgebot, setReinheitsgebot] = useState<boolean>(false);

  // Re-check-in mode
  const [editingBeer, setEditingBeer] = useState<BeerRegistrationType | null>(null);

  // Round management
  const [newRoundName, setNewRoundName] = useState("");
  const [creatingRound, setCreatingRound] = useState(false);

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
      // Don't reset startbahn if we're editing and it's the same round
      if (!editingBeer || editingBeer.roundId !== roundId) {
        setSelectedStartbahn("");
      }
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

  const handleSelectBeer = (beer: BeerType) => {
    setSelectedBeer(beer);
    setEditingBeer(null);
  };

  const handleReCheckin = (registration: BeerRegistrationType) => {
    const beer = allBeers.find((b) => b.beerId === registration.beerId);
    if (beer) {
      setSelectedBeer(beer);
      setEditingBeer(registration);
      setSelectedRound(registration.roundId.toString());
      setSelectedStartbahn(registration.startbahn.toString());
      setReinheitsgebot(registration.reinheitsgebot);
      // Add current startbahn to available list for editing
      loadAvailableStartbahns(registration.roundId);
    }
  };

  const handleRegister = async () => {
    if (!selectedBeer || !selectedRound || !selectedStartbahn) return;

    setRegistering(true);
    try {
      // If re-checking in, first unregister
      if (editingBeer) {
        await unregisterBeer(editingBeer.beerId);
      }

      const result = await registerBeer(
        selectedBeer.beerId,
        parseInt(selectedStartbahn),
        parseInt(selectedRound),
        reinheitsgebot
      );
      if (result.success) {
        setSelectedBeer(null);
        setEditingBeer(null);
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

  const handleCreateRound = async () => {
    if (!newRoundName.trim()) return;

    setCreatingRound(true);
    try {
      const result = await createRound(newRoundName.trim());
      if (result.success) {
        setNewRoundName("");
        await loadData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error creating round:", error);
    } finally {
      setCreatingRound(false);
    }
  };

  const handleSetActiveRound = async (roundId: number) => {
    try {
      const result = await setActiveRound(roundId);
      if (result.success) {
        await loadData();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Error setting active round:", error);
    }
  };

  const cancelEdit = () => {
    setSelectedBeer(null);
    setEditingBeer(null);
    setSelectedStartbahn("");
    setReinheitsgebot(false);
  };

  if (loading) {
    return <div className="text-center py-6">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Round Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Runden</CardTitle>
              <p className="text-sm text-muted-foreground">
                Runden verwalten und aktivieren
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Create new round */}
            <div className="flex gap-2">
              <Input
                placeholder="Neue Runde erstellen..."
                value={newRoundName}
                onChange={(e) => setNewRoundName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRound()}
                className="h-11"
              />
              <Button
                onClick={handleCreateRound}
                disabled={!newRoundName.trim() || creatingRound}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
            </div>

            {/* Rounds list */}
            {rounds.length > 0 && (
              <div className="space-y-3">
                {rounds.map((round) => {
                  const roundBeers = registrations.filter(r => r.roundId === round.id);
                  const beersWithDetails = roundBeers.map(reg => {
                    const beer = allBeers.find(b => b.beerId === reg.beerId);
                    return { ...reg, beer };
                  }).sort((a, b) => a.startbahn - b.startbahn);

                  return (
                    <div
                      key={round.id}
                      className={`rounded-lg border overflow-hidden ${
                        round.active
                          ? "border-primary/30"
                          : "border-border"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between p-3 ${
                          round.active
                            ? "bg-primary/10"
                            : "bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">
                            {round.id}: {round.name}
                          </span>
                          {round.active && (
                            <Badge className="bg-primary">Aktiv</Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {roundBeers.length} Biere
                          </span>
                        </div>
                        {!round.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActiveRound(round.id)}
                          >
                            Aktivieren
                          </Button>
                        )}
                      </div>

                      {/* Show assigned beers */}
                      {beersWithDetails.length > 0 && (
                        <div className="px-3 py-2 bg-card border-t border-border">
                          <div className="flex flex-wrap gap-2">
                            {beersWithDetails.map((item) => (
                              <div
                                key={item.beerId}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-sm"
                              >
                                <span className="font-bold text-primary">
                                  {item.startbahn}
                                </span>
                                <span className="text-muted-foreground">
                                  {item.beer?.name || item.beerId}
                                </span>
                                {item.reinheitsgebot && (
                                  <Leaf className="h-3 w-3 text-success" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {rounds.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Noch keine Runden erstellt
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Form Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              editingBeer ? "bg-warning/10" : "bg-primary/10"
            }`}>
              {editingBeer ? (
                <RefreshCw className="h-5 w-5 text-warning" />
              ) : (
                <Beer className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle>
                {editingBeer ? "Re-Check-In" : "Bier registrieren"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {editingBeer
                  ? "Startbahn oder Runde ändern"
                  : "Check-In für den Wettbewerb"}
              </p>
            </div>
            {editingBeer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="ml-auto"
              >
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {/* Round and Startbahn Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Runde auswählen</label>
                <Select value={selectedRound} onValueChange={setSelectedRound}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Runde wählen..." />
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
                  <SelectTrigger className="h-11">
                    <SelectValue
                      placeholder={
                        !selectedRound
                          ? "Erst Runde wählen"
                          : availableStartbahns.length === 0
                            ? "Keine verfügbar"
                            : "Startbahn wählen..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Show current startbahn first if editing */}
                    {editingBeer && editingBeer.roundId === parseInt(selectedRound) && (
                      <SelectItem value={editingBeer.startbahn.toString()}>
                        Startbahn {editingBeer.startbahn} (aktuell)
                      </SelectItem>
                    )}
                    {availableStartbahns.map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Startbahn {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRound && (
                  <p className="text-xs text-muted-foreground">
                    {availableStartbahns.length} Startbahnen verfügbar
                  </p>
                )}
              </div>
            </div>

            {/* Reinheitsgebot Toggle */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">Reinheitsgebot</p>
                    <p className="text-xs text-muted-foreground">
                      Entspricht das Bier dem Reinheitsgebot?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={reinheitsgebot ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReinheitsgebot(true)}
                    className={
                      reinheitsgebot
                        ? "bg-success hover:bg-success/90 text-success-foreground"
                        : ""
                    }
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
            </div>

            {/* Selected Beer Card */}
            {selectedBeer && (
              <div className={`p-4 rounded-xl border-2 ${
                editingBeer
                  ? "bg-warning/10 border-warning"
                  : "bg-primary/10 border-primary"
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`h-6 w-6 shrink-0 ${
                      editingBeer ? "text-warning" : "text-primary"
                    }`} />
                    <div>
                      <p className="font-semibold">{selectedBeer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedBeer.brewer} · {selectedBeer.style}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRegister}
                    disabled={
                      registering || !selectedRound || !selectedStartbahn
                    }
                    className="shrink-0"
                  >
                    {registering
                      ? "..."
                      : editingBeer
                        ? "Aktualisieren"
                        : "Registrieren"}
                  </Button>
                </div>
              </div>
            )}

            {/* Beer Search - only show when not editing */}
            {!editingBeer && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Bier suchen
                    <span className="text-muted-foreground font-normal ml-2">
                      ({unregisteredBeers.length} nicht registriert)
                    </span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nach Biername, Brauerei oder Stil suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                {/* Beer List */}
                <div className="max-h-72 overflow-y-auto border rounded-xl bg-card">
                  {filteredUnregisteredBeers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      {searchTerm
                        ? "Keine Biere gefunden"
                        : "Alle Biere sind registriert"}
                    </p>
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredUnregisteredBeers.map((beer) => (
                        <div
                          key={beer.beerId}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedBeer?.beerId === beer.beerId
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleSelectBeer(beer)}
                        >
                          <p className="font-medium">{beer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {beer.brewer} · {beer.style}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registered Beers Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <CardTitle>Registrierte Biere</CardTitle>
              <p className="text-sm text-muted-foreground">
                {registrations.length} Biere im Wettbewerb
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {registeredBeersWithDetails.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Noch keine Biere registriert
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-20 text-center">Startbahn</TableHead>
                    <TableHead>Bier</TableHead>
                    <TableHead className="hidden md:table-cell">Brauerei</TableHead>
                    <TableHead>Runde</TableHead>
                    <TableHead className="w-16 text-center">RHG</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registeredBeersWithDetails.map((item) => (
                    <TableRow
                      key={item.beerId}
                      className={
                        editingBeer?.beerId === item.beerId
                          ? "bg-warning/10"
                          : ""
                      }
                    >
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                          <span className="text-lg font-bold text-primary">
                            {item.startbahn}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.beer?.name || item.beerId}</div>
                        <div className="md:hidden text-xs text-muted-foreground">
                          {item.beer?.brewer || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {item.beer?.brewer || "-"}
                      </TableCell>
                      <TableCell>
                        {item.round ? (
                          <Badge
                            variant={item.round.active ? "default" : "secondary"}
                            className={item.round.active ? "bg-primary" : ""}
                          >
                            {item.round.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.reinheitsgebot && (
                          <Badge className="bg-success/10 text-success border-success/30">
                            <Leaf className="h-3 w-3" />
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReCheckin(item)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnregister(item.beerId)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
