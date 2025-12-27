"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getCompetitionSettings,
  updateCompetitionSettings,
} from "@/lib/actions";
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
    return <div className="text-center py-6">Laden...</div>;
  }

  if (!settings) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Fehler beim Laden der Einstellungen
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Abstimmungsstatus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge
                variant={settings.votingEnabled ? "default" : "secondary"}
                className={
                  settings.votingEnabled
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {settings.votingEnabled ? "Aktiv" : "Geschlossen"}
              </Badge>
              <span className="text-muted-foreground">
                {settings.votingEnabled
                  ? "Die Abstimmung ist derzeit aktiv. Benutzer konnen Stimmen abgeben."
                  : "Die Abstimmung ist geschlossen. Benutzer konnen keine Stimmen abgeben."}
              </span>
            </div>
            <Button
              onClick={handleToggleVoting}
              disabled={updating}
              variant={settings.votingEnabled ? "destructive" : "default"}
              size="lg"
            >
              {updating
                ? "..."
                : settings.votingEnabled
                  ? "Abstimmung stoppen"
                  : "Abstimmung starten"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Startbahn-Einstellungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Anzahl der Startbahnen
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="200"
                  value={startbahnCount}
                  onChange={(e) => setStartbahnCount(e.target.value)}
                  className="w-32"
                />
                <Button
                  onClick={handleUpdateStartbahnCount}
                  disabled={
                    updating ||
                    parseInt(startbahnCount) === settings.startbahnCount
                  }
                  variant="outline"
                >
                  Speichern
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Aktuell: {settings.startbahnCount} Startbahnen verfugbar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
