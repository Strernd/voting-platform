import { getBeersByRound } from "@/lib/beer-data";
import { getRounds } from "@/lib/actions";
import { Beer, Leaf } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface DisplayPageProps {
  params: Promise<{ roundId: string }>;
}

export default async function DisplayPage({ params }: DisplayPageProps) {
  const { roundId } = await params;
  const roundIdNum = parseInt(roundId, 10);

  if (isNaN(roundIdNum)) {
    notFound();
  }

  const rounds = await getRounds();
  const round = rounds.find((r) => r.id === roundIdNum);

  if (!round) {
    notFound();
  }

  const beers = await getBeersByRound(roundIdNum);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <Beer className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{round.name}</h1>
              <p className="text-lg text-muted-foreground">
                {beers.length} Biere in dieser Runde
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/display/${roundId}/print`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Druckversion
            </Link>
            {round.active && (
              <span className="px-4 py-2 rounded-full bg-success/20 text-success font-semibold text-lg">
                Aktive Runde
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Beer Grid - Landscape optimized */}
      <main className="p-8">
        {beers.length === 0 ? (
          <div className="text-center py-24">
            <Beer className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">
              Keine Biere in dieser Runde registriert
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {beers.map((beer) => (
              <div
                key={beer.beerId}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                {/* Startbahn Header */}
                <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
                  <span className="text-4xl font-bold text-primary">
                    {beer.startbahn}
                  </span>
                  {beer.reinheitsgebot && (
                    <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded text-sm">
                      <Leaf className="h-4 w-4" />
                      RHG
                    </span>
                  )}
                </div>

                {/* Beer Info */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg leading-tight line-clamp-2">
                    {beer.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {beer.brewer}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {beer.style.includes(".")
                        ? beer.style.split(".")[1].trim()
                        : beer.style}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {beer.alcohol}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Round Navigation */}
      {rounds.length > 1 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-8 py-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm text-muted-foreground shrink-0">
              Runden:
            </span>
            {rounds.map((r) => (
              <Link
                key={r.id}
                href={`/display/${r.id}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  r.id === roundIdNum
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {r.name}
                {r.active && " (Aktiv)"}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
