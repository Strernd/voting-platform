"use server";

import { exampleBeers } from "@/app/api/beers/examples";
import { getActiveRound, getRegisteredBeers } from "@/lib/actions";

export type Beer = ReturnType<typeof mapBeer>;

export type BeerWithRegistration = Beer & {
  startbahn: number;
  reinheitsgebot: boolean;
};

function mapBeer(beer: (typeof exampleBeers)[number]) {
  return {
    beerId: beer.submission_id,
    name: beer.beername,
    description: beer.description,
    brewer: beer.brewer,
    style: beer.style,
    alcohol: beer.alcohol,
    originalGravity: beer.original_gravity,
    ibu: beer.ibu,
    recipeLink: beer.recipie_link,
  };
}

async function fetchBeers() {
  try {
    const url = process.env.BEERS_ENDPOINT!;
    console.log("fetching beers from", url);
    const res = await fetch(url);
    const data = await res.json();
    return data as typeof exampleBeers;
  } catch (error) {
    console.error("Error fetching beers:", error);
    return [];
  }
}

let cachedBeers: Beer[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function getAllBeers() {
  const now = Date.now();
  if (cachedBeers && now - lastFetch < CACHE_DURATION) {
    return cachedBeers;
  }

  const beers = await fetchBeers();
  cachedBeers = beers.map(mapBeer);
  lastFetch = now;
  return cachedBeers;
}

export async function getBeers(): Promise<BeerWithRegistration[]> {
  const allBeers = await getAllBeers();

  // Get active round
  const activeRound = await getActiveRound();
  if (!activeRound) {
    return []; // No active round, return empty array
  }

  // Get registered beers (only registered beers are visible)
  const registrations = await getRegisteredBeers();

  // Filter to beers registered for the active round
  const activeRegistrations = registrations.filter(
    (reg) => reg.roundId === activeRound.id
  );

  // Create a map for quick lookup
  const registrationMap = new Map(
    activeRegistrations.map((reg) => [reg.beerId, reg])
  );

  // Filter and enrich beers with registration info
  const beersWithRegistration = allBeers
    .filter((beer) => registrationMap.has(beer.beerId))
    .map((beer) => {
      const reg = registrationMap.get(beer.beerId)!;
      return {
        ...beer,
        startbahn: reg.startbahn,
        reinheitsgebot: reg.reinheitsgebot,
      };
    })
    // Sort by Startbahn
    .sort((a, b) => a.startbahn - b.startbahn);

  return beersWithRegistration;
}
