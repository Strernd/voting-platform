import http from "k6/http";
import { sleep, check } from "k6";
import { SharedArray } from "k6/data";
import { Counter, Trend } from "k6/metrics";

// Custom metrics
const registrationDuration = new Trend("registration_duration", true);
const pageLoadDuration = new Trend("page_load_duration", true);
const voteDuration = new Trend("vote_duration", true);
const registrationErrors = new Counter("registration_errors");
const pageLoadErrors = new Counter("page_load_errors");
const voteErrors = new Counter("vote_errors");

const BASE_URL = __ENV.BASE_URL || "https://voting-platform-git-perf-vote-tran-74302a-berndstrehls-projects.vercel.app";
const BYPASS_KEY = __ENV.BYPASS_KEY || "j7FIC2zjnhKCOxn1kBgpyRsRamWOO4rk";

const voterUuids = new SharedArray("voters", function () {
  return JSON.parse(open("./voter-uuids.json"));
});

const defaultHeaders = {
  "x-vercel-protection-bypass": BYPASS_KEY,
};

function extractBeerIds(body) {
  const beerIds = [];
  const matches = body.match(/beerId\\":\\"([a-f0-9-]{36})\\"/g);
  if (matches) {
    for (const m of matches) {
      const id = m.match(/([a-f0-9-]{36})/);
      if (id) beerIds.push(id[1]);
    }
  }
  return [...new Set(beerIds)]; // dedupe
}

export const options = {
  scenarios: {
    // Scenario A: Registration burst
    registration: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 100 },
        { duration: "2m", target: 500 },
        { duration: "1m", target: 0 },
      ],
      exec: "registration",
    },
    // Scenario B: Steady voting (page loads + votes)
    voting: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 250 },
        { duration: "5m", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "1m", target: 0 },
      ],
      startTime: "4m", // starts after registration burst
      exec: "votingLoop",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.01"],
    registration_duration: ["p(95)<2000"],
    page_load_duration: ["p(95)<2000"],
    vote_duration: ["p(95)<1000"],
  },
};

// Scenario A: Registration
export function registration() {
  const vuId = __VU % voterUuids.length;
  const uuid = voterUuids[vuId];

  const res = http.get(`${BASE_URL}/register/${uuid}`, {
    headers: defaultHeaders,
    redirects: 5,
    tags: { name: "registration" },
  });

  const ok = check(res, {
    "registration status 200": (r) => r.status === 200,
  });

  registrationDuration.add(res.timings.duration);
  if (!ok) registrationErrors.add(1);

  sleep(Math.random() * 2 + 1);
}

// Scenario B: Voting loop (register → page load → vote → refresh)
export function votingLoop() {
  const vuId = __VU % voterUuids.length;
  const uuid = voterUuids[vuId];

  // Register to get session cookie
  http.get(`${BASE_URL}/register/${uuid}`, {
    headers: defaultHeaders,
    redirects: 5,
    tags: { name: "register_for_session" },
  });

  // View beer list (main page SSR)
  const pageRes = http.get(`${BASE_URL}/`, {
    headers: defaultHeaders,
    tags: { name: "page_load" },
  });

  const pageOk = check(pageRes, {
    "page loaded 200": (r) => r.status === 200,
    "page has content": (r) => r.body && r.body.length > 1000,
  });

  pageLoadDuration.add(pageRes.timings.duration);
  if (!pageOk) pageLoadErrors.add(1);

  sleep(Math.random() * 10 + 5); // think time 5-15s

  // Cast a vote
  const beerIds = extractBeerIds(pageRes.body);
  if (beerIds.length > 0) {
    const beerId = beerIds[Math.floor(Math.random() * beerIds.length)];

    const voteRes = http.post(
      `${BASE_URL}/api/vote`,
      JSON.stringify({ beerId: beerId, voteType: "best_beer" }),
      {
        headers: {
          ...defaultHeaders,
          "Content-Type": "application/json",
        },
        tags: { name: "vote" },
      }
    );

    const voteOk = check(voteRes, {
      "vote response 200": (r) => r.status === 200,
      "vote success": (r) => {
        try {
          return JSON.parse(r.body).success === true;
        } catch {
          return false;
        }
      },
    });

    voteDuration.add(voteRes.timings.duration);
    if (!voteOk) voteErrors.add(1);
  }

  sleep(Math.random() * 7 + 3); // think time 3-10s

  // Refresh page (see updated state)
  const refreshRes = http.get(`${BASE_URL}/`, {
    headers: defaultHeaders,
    tags: { name: "page_refresh" },
  });

  check(refreshRes, {
    "refresh loaded 200": (r) => r.status === 200,
  });

  pageLoadDuration.add(refreshRes.timings.duration);

  sleep(Math.random() * 15 + 10); // think time 10-25s
}
