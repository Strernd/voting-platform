import { BeerList } from "@/components/beer-list";
import { getBeers } from "@/lib/beer-data";

export default async function Home() {
  const beers = await getBeers();
  return (
    <div className="dark min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Runde 1: Biere
        </h1>
        <BeerList beers={beers} />
      </div>
    </div>
  );
}
