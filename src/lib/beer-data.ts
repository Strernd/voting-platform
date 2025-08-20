"use server";

import { exampleBeers } from "@/app/api/beers/examples";

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
  const res = await fetch("http://localhost:3001/api/beers");
  const data = await res.json();
  return data as typeof exampleBeers;
}

let cachedBeers: Beer[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function getBeers() {
  const now = Date.now();
  if (cachedBeers && now - lastFetch < CACHE_DURATION) {
    return cachedBeers;
  }

  const beers = await fetchBeers();
  cachedBeers = beers.map(mapBeer);
  lastFetch = now;
  return cachedBeers;
}
