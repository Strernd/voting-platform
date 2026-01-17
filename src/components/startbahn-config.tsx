"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getStartbahnConfigs,
  upsertStartbahnConfig,
  deleteStartbahnConfig,
  getCompetitionSettings,
} from "@/lib/actions";
import type { StartbahnConfig } from "@/db/schema";
import { MapPin, X, Check, Loader2 } from "lucide-react";

export function StartbahnConfigCard() {
  const [configs, setConfigs] = useState<StartbahnConfig[]>([]);
  const [startbahnCount, setStartbahnCount] = useState(50);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [savingStates, setSavingStates] = useState<Record<number, "saving" | "saved" | null>>({});
  const debounceTimers = useRef<Record<number, NodeJS.Timeout>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configsData, settings] = await Promise.all([
        getStartbahnConfigs(),
        getCompetitionSettings(),
      ]);
      setConfigs(configsData);
      setStartbahnCount(settings.startbahnCount);

      // Initialize edit values from configs
      const initialValues: Record<number, string> = {};
      configsData.forEach((config) => {
        initialValues[config.startbahn] = config.name;
      });
      setEditValues(initialValues);
    } catch (error) {
      console.error("Error loading startbahn configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = useCallback((startbahn: number, value: string) => {
    setEditValues((prev) => ({ ...prev, [startbahn]: value }));

    // Clear existing timer
    if (debounceTimers.current[startbahn]) {
      clearTimeout(debounceTimers.current[startbahn]);
    }

    // Set saving state
    if (value.trim()) {
      setSavingStates((prev) => ({ ...prev, [startbahn]: "saving" }));

      // Debounce the save
      debounceTimers.current[startbahn] = setTimeout(async () => {
        const result = await upsertStartbahnConfig(startbahn, value);
        if (result.success) {
          setSavingStates((prev) => ({ ...prev, [startbahn]: "saved" }));
          // Clear saved indicator after 2 seconds
          setTimeout(() => {
            setSavingStates((prev) => ({ ...prev, [startbahn]: null }));
          }, 2000);
          // Reload configs
          const newConfigs = await getStartbahnConfigs();
          setConfigs(newConfigs);
        }
      }, 500);
    } else {
      setSavingStates((prev) => ({ ...prev, [startbahn]: null }));
    }
  }, []);

  const handleClear = async (startbahn: number) => {
    // Clear timer if exists
    if (debounceTimers.current[startbahn]) {
      clearTimeout(debounceTimers.current[startbahn]);
    }

    setSavingStates((prev) => ({ ...prev, [startbahn]: "saving" }));

    const result = await deleteStartbahnConfig(startbahn);
    if (result.success) {
      setEditValues((prev) => {
        const newValues = { ...prev };
        delete newValues[startbahn];
        return newValues;
      });
      setSavingStates((prev) => ({ ...prev, [startbahn]: null }));
      // Reload configs
      const newConfigs = await getStartbahnConfigs();
      setConfigs(newConfigs);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-6">Laden...</div>;
  }

  // Create array of startbahns 1 to startbahnCount
  const startbahns = Array.from({ length: startbahnCount }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Startbahn-Namen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Namen/Notizen fur Startbahnen konfigurieren
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {startbahns.map((num) => {
            const hasName = editValues[num]?.trim();
            const savingState = savingStates[num];

            return (
              <div
                key={num}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="w-12 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{num}</span>
                </div>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Name hinzufugen..."
                    value={editValues[num] || ""}
                    onChange={(e) => handleNameChange(num, e.target.value)}
                    className="h-10 pr-8"
                  />
                  {savingState === "saving" && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {savingState === "saved" && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                  )}
                </div>
                {hasName && !savingState && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleClear(num)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Namen werden automatisch gespeichert. Startbahn-Namen sind global fur alle Runden.
        </p>
      </CardContent>
    </Card>
  );
}
