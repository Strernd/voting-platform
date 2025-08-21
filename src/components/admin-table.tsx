"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BeerWithVotes {
  id: string;
  name: string;
  brewer: string;
  style: string;
  votes: number;
}

export function AdminTable() {
  const [beers, setBeers] = useState<BeerWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const response = await fetch("/api/admin/beers-with-votes");
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setBeers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBeers();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Beer Name</TableHead>
            <TableHead className="w-[200px]">Brewer</TableHead>
            <TableHead className="w-[250px]">Style</TableHead>
            <TableHead className="text-right w-[100px]">Votes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {beers.map((beer) => (
            <TableRow key={beer.id}>
              <TableCell className="font-medium">{beer.name}</TableCell>
              <TableCell>{beer.brewer}</TableCell>
              <TableCell className="text-sm">{beer.style}</TableCell>
              <TableCell className="text-right font-semibold">
                {beer.votes}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {beers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No beers found
        </div>
      )}
    </div>
  );
}