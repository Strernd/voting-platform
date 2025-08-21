"use server";

import { exampleBeers } from "@/app/api/beers/examples";
import { getActiveRound, getBeersInRound } from "@/lib/actions";

export type Beer = ReturnType<typeof mapBeer>;

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

export async function getBeers() {
  const allBeers = await getAllBeers();
  
  // Get active round
  const activeRound = await getActiveRound();
  if (!activeRound) {
    return []; // No active round, return empty array
  }
  
  // Get beers assigned to active round
  const beerRounds = await getBeersInRound(activeRound.id);
  const activeBeerIds = new Set(beerRounds.map(br => br.beerId));
  
  // Filter beers to only show those assigned to active round
  return allBeers.filter(beer => activeBeerIds.has(beer.beerId));
}
