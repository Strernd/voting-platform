"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCompetitionSettings,
  updateCompetitionSettings,
} from "@/lib/actions";
import { Play, Pause, Hash, Save } from "lucide-react";
import type { CompetitionSettings as CompetitionSettingsType } from "@/db/schema";

export function CompetitionSettings() {
  const [settings, setSettings] = useState<CompetitionSettingsType | null>(
    null
  );
  const [startbahnCount, setStartbahnCount] = useState<string>("50");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getCompetitionSettings();
      setSettings(data);
      setStartbahnCount(data.startbahnCount.toString());
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoting = async () => {
    if (!settings) return;

    setUpdating(true);
    try {
      const result = await updateCompetitionSettings({
        votingEnabled: !settings.votingEnabled,
      });
      if (result.success) {
        await loadSettings();
      } else {
        alert(result.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStartbahnCount = async () => {
    const count = parseInt(startbahnCount, 10);
    if (isNaN(count) || count < 1 || count > 200) {
      alert("Startbahn-Anzahl muss zwischen 1 und 200 liegen");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateCompetitionSettings({
        startbahnCount: count,
      });
      if (result.success) {
        await loadSettings();
      } else {
        alert(result.message);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Fehler beim Laden der Einstellungen
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Voting Status Card - Prominent */}
      <Card
        className={`border-2 ${
          settings.votingEnabled
            ? "border-success/50 bg-success/5"
            : "border-muted"
        }`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  settings.votingEnabled
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {settings.votingEnabled ? (
                  <Play className="h-8 w-8" />
                ) : (
                  <Pause className="h-8 w-8" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {settings.votingEnabled
                    ? "Abstimmung ist aktiv"
                    : "Abstimmung ist pausiert"}
                </h2>
                <p className="text-muted-foreground">
                  {settings.votingEnabled
                    ? "Benutzer können Stimmen abgeben."
                    : "Benutzer können keine Stimmen abgeben."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleToggleVoting}
              disabled={updating}
              size="lg"
              className={`h-14 px-8 text-lg font-semibold ${
                settings.votingEnabled
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-success hover:bg-success/90 text-success-foreground"
              }`}
            >
              {settings.votingEnabled ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  {updating ? "..." : "Abstimmung stoppen"}
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {updating ? "..." : "Abstimmung starten"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Startbahn Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Startbahn-Einstellungen</CardTitle>
              <p className="text-sm text-muted-foreground">
                Anzahl verfügbarer Startbahn-Nummern pro Runde
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium mb-2">
                Anzahl der Startbahnen
              </label>
              <Input
                type="number"
                min="1"
                max="200"
                value={startbahnCount}
                onChange={(e) => setStartbahnCount(e.target.value)}
                className="h-12 text-lg font-medium"
              />
            </div>
            <Button
              onClick={handleUpdateStartbahnCount}
              disabled={
                updating ||
                parseInt(startbahnCount) === settings.startbahnCount
              }
              className="h-12"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Aktuell: <span className="font-medium">{settings.startbahnCount}</span> Startbahnen verfügbar (1-{settings.startbahnCount})
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
