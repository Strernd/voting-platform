"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface OperationsData {
  claimedCount: number;
  unclaimedCount: number;
  totalCount: number;
  claimsOverTime: { time: string; count: number; cumulative: number }[];
  duplicates: {
    ip: string;
    userAgent: string;
    voterIds: string[];
    count: number;
  }[];
}

export function OperationsDashboard() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/operations", {
        credentials: "include",
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      console.error("Error fetching operations data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Lade Daten...
      </div>
    );
  }

  if (!data) return null;

  const claimedPercent =
    data.totalCount > 0
      ? Math.round((data.claimedCount / data.totalCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registriert</p>
                <p className="text-3xl font-bold">{data.claimedCount}</p>
                <p className="text-xs text-muted-foreground">
                  {claimedPercent}% aller Codes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <UserX className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Offen</p>
                <p className="text-3xl font-bold">{data.unclaimedCount}</p>
                <p className="text-xs text-muted-foreground">
                  {100 - claimedPercent}% aller Codes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-3xl font-bold">{data.totalCount}</p>
                <p className="text-xs text-muted-foreground">Voter-Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Over Time Chart */}
      {data.claimsOverTime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registrierungen über Zeit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.claimsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Gesamt"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Neu (5 min)"
                    stroke="hsl(var(--success))"
                    fill="hsl(var(--success))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate Fingerprints */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-5 w-5 ${data.duplicates.length > 0 ? "text-warning" : "text-muted-foreground"}`}
            />
            <CardTitle>
              Mehrfach-Registrierungen
              {data.duplicates.length > 0 && (
                <span className="ml-2 text-sm font-normal text-warning">
                  ({data.duplicates.length} verdächtig)
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {data.duplicates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Keine IP + User-Agent Kombinationen mit mehreren Registrierungen
              gefunden.
            </p>
          ) : (
            <div className="space-y-4">
              {data.duplicates.map((dup, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border bg-warning/5 border-warning/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <p className="font-mono text-sm">
                        <span className="text-muted-foreground">IP:</span>{" "}
                        {dup.ip || "unbekannt"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-lg">
                        UA: {dup.userAgent || "unbekannt"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-warning bg-warning/10 px-2 py-1 rounded">
                      {dup.count}x
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dup.voterIds.map((id) => (
                      <code
                        key={id}
                        className="text-xs bg-muted px-2 py-1 rounded font-mono"
                      >
                        {id.slice(0, 8)}...
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
