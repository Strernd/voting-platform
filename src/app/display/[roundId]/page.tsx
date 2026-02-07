import { getBeersByRound } from "@/lib/beer-data";
import { getRounds } from "@/lib/actions";
import { Leaf } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const ACCENT_COLORS = [
  { bg: "bg-water", text: "text-water", light: "bg-water/10" },
  { bg: "bg-hops", text: "text-hops", light: "bg-hops/10" },
  { bg: "bg-malt", text: "text-malt", light: "bg-malt/10" },
  { bg: "bg-yeast", text: "text-yeast", light: "bg-yeast/10" },
];

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        {/* Four-stripe accent bar */}
        <div className="flex h-2 w-full">
          <div className="flex-1 bg-water" />
          <div className="flex-1 bg-hops" />
          <div className="flex-1 bg-malt" />
          <div className="flex-1 bg-yeast" />
        </div>
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Image
              src="/bhs_logo.png"
              alt="Bundes Heimbrau Spiele"
              width={72}
              height={72}
            />
            <div>
              <h1 className="text-4xl font-bold uppercase tracking-wide">{round.name}</h1>
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
              <span className="px-5 py-2 rounded-full bg-hops text-white font-bold text-lg">
                Aktive Runde
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Beer Grid */}
      <main className="p-6">
        {beers.length === 0 ? (
          <div className="text-center py-24">
            <Image
              src="/bhs_logo.png"
              alt="Bundes Heimbrau Spiele"
              width={100}
              height={100}
              className="mx-auto mb-4 opacity-40"
            />
            <p className="text-xl text-muted-foreground">
              Keine Biere in dieser Runde registriert
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {beers.map((beer, index) => {
              const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
              return (
                <div
                  key={beer.beerId}
                  className="rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  {/* Startbahn Header - cycling brand color */}
                  <div className={`${accent.bg} px-4 py-3 flex items-center justify-between`}>
                    <span className="text-4xl font-bold text-white">
                      {beer.startbahn}
                    </span>
                    {beer.reinheitsgebot && (
                      <span className="flex items-center gap-1 text-white/90 bg-white/20 px-2 py-1 rounded text-sm font-bold">
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
                      <span className={`text-xs ${accent.text} ${accent.light} px-2 py-1 rounded font-bold`}>
                        {beer.style.includes(".")
                          ? beer.style.split(".")[1].trim()
                          : beer.style}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold">
                        {beer.alcohol}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Round Navigation */}
      {rounds.length > 1 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-8 py-4 shadow-lg">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-sm text-muted-foreground shrink-0 font-bold uppercase tracking-wide">
              Runden:
            </span>
            {rounds.map((r, index) => {
              const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
              const isActive = r.id === roundIdNum;
              return (
                <Link
                  key={r.id}
                  href={`/display/${r.id}`}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors shrink-0 ${
                    isActive
                      ? `${accent.bg} text-white`
                      : `${accent.light} ${accent.text} hover:opacity-80`
                  }`}
                >
                  {r.name}
                  {r.active && " (Aktiv)"}
                </Link>
              );
            })}
          </div>
        </footer>
      )}
    </div>
  );
}
