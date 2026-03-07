import http from "k6/http";
import { sleep, check } from "k6";
import { SharedArray } from "k6/data";
import { Trend } from "k6/metrics";

const pageLoadDuration = new Trend("page_load_duration", true);
const voteDuration = new Trend("vote_duration", true);

const BASE_URL = __ENV.BASE_URL || "https://voting-platform-git-perf-vote-tran-74302a-berndstrehls-projects.vercel.app";
const BYPASS_KEY = __ENV.BYPASS_KEY || "j7FIC2zjnhKCOxn1kBgpyRsRamWOO4rk";

const voterUuids = new SharedArray("voters", function () {
  return JSON.parse(open("./voter-uuids.json"));
});

const defaultHeaders = {
  "x-vercel-protection-bypass": BYPASS_KEY,
};

const SMOKE = !!__ENV.SMOKE;

export const options = SMOKE
  ? {
      vus: 1,
      iterations: 1,
      thresholds: {
        http_req_duration: ["p(95)<5000"],
        http_req_failed: ["rate<0.01"],
      },
    }
  : {
      scenarios: {
        spike: {
          executor: "ramping-vus",
          startVUs: 0,
          stages: [
            { duration: "10s", target: 500 }, // ramp to 500 in 10s
            { duration: "30s", target: 500 }, // hold
            { duration: "10s", target: 0 },   // ramp down
          ],
        },
      },
      thresholds: {
        http_req_duration: ["p(95)<2000"],
        http_req_failed: ["rate<0.01"],
      },
    };

export default function () {
  const vuId = __VU % voterUuids.length;
  const uuid = voterUuids[vuId];

  // Step 1: Register to get session cookie
  const regRes = http.get(`${BASE_URL}/register/${uuid}`, {
    headers: defaultHeaders,
    redirects: 5,
    tags: { name: "register" },
  });

  check(regRes, {
    "registered ok": (r) => r.status === 200,
  });

  // Step 2: Load main page and extract beer IDs
  const pageRes = http.get(`${BASE_URL}/`, {
    headers: defaultHeaders,
    tags: { name: "page_load" },
  });

  check(pageRes, {
    "page loaded 200": (r) => r.status === 200,
  });

  pageLoadDuration.add(pageRes.timings.duration);

  // Step 3: Extract beer IDs from page and cast a vote
  const beerIds = [];
  const matches = pageRes.body.match(/beerId\\":\\"([a-f0-9-]{36})\\"/g);
  if (matches) {
    for (const m of matches) {
      const id = m.match(/([a-f0-9-]{36})/);
      if (id) beerIds.push(id[1]);
    }
  }

  if (beerIds.length > 0) {
    // Pick a random beer to vote for
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

    check(voteRes, {
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

    if (SMOKE) {
      console.log(`Voted for beer ${beerId}: ${voteRes.body}`);
    }
  } else if (SMOKE) {
    console.log("No beer IDs found in page - is there an active round with registered beers?");
  }
}
