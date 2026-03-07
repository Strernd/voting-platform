# Load Testing Plan — Bundes Heimbrau Spiele Voting Platform

**Target:** 500 concurrent homebrewers on event day (Saturday, March 14 2026)

## Architecture

- **Frontend:** Next.js 16 on Vercel (Fluid Compute)
- **Database:** Turso (libSQL, edge SQLite)
- **Auth:** Cookie-based voter sessions (UUID via QR code scan)

## Critical User Flows

| # | Flow | Method | Endpoint | DB Queries |
|---|------|--------|----------|------------|
| 1 | Registration | GET | `/register/[uuid]` | 1 read, 1 cookie set |
| 2 | View beers | GET | `/` (SSR) | 4-5 (session, round, beers, votes, settings) |
| 3 | Cast vote | POST | Server action `toggleVoteForBeer` | 5-6 (now in single transaction) |
| 4 | Admin results | GET | `/api/admin/beers-with-votes` | 2-3 |
| 5 | Beer list API | GET | `/api/beers` | 2 |

## Bottlenecks

1. **Turso DB** — Every page load triggers multiple queries. With 500 users, expect 2500-3000 queries in bursts when voting opens. Check your Turso plan limits (free tier: 9M reads/month).
2. **Vercel concurrency** — `force-dynamic` pages mean no edge caching. Verify your Vercel plan supports enough concurrent function executions.
3. **Vote race conditions** — Mitigated by wrapping `toggleVoteForBeer` in a DB transaction (PR #5).

## Mitigations Already Applied (PR #5)

- `toggleVoteForBeer` wrapped in `db.transaction()` — fewer round-trips, race condition protection
- `getCompetitionSettings()` and `getActiveRound()` cached in-memory with 10s TTL (viable on Fluid Compute)

## Tool: k6

[k6](https://k6.io/) is free for local execution, scriptable in JavaScript, and handles cookie-based sessions well.

Install: `brew install k6`

## Test Setup

### 1. Prepare Test Data

- Deploy a **preview branch** on Vercel (do NOT load test production)
- Point it at a **test Turso database** (or accept the read/write cost)
- Pre-generate 500 voter UUIDs via `/api/admin/voters/generate`
- Export them to `load-test/voter-uuids.json`
- Set up a round with ~20 beers and enable voting

### 2. Test Scenarios

#### Scenario A — Registration Burst

Simulates all 500 users scanning their QR code within a few minutes.

```
500 virtual users ramping up over 5 minutes
Each user: GET /register/{uuid} → follow redirect → store session cookie
```

#### Scenario B — Steady Voting

Simulates normal voting behavior during a round.

```
500 concurrent users, sustained for 10 minutes
Each user loop:
  1. GET /           (view beer list)     — think time 5-15s
  2. POST vote       (toggle vote)        — think time 3-10s
  3. GET /           (see updated state)  — think time 10-30s
```

#### Scenario C — Voting Spike

Simulates the moment voting opens and everyone loads the page at once.

```
500 users all hit GET / within 30 seconds
```

#### Scenario D — Admin + Voters Combined

```
5 admin users polling /api/admin/beers-with-votes every 5s
+ 500 voters running Scenario B simultaneously
```

### 3. k6 Script

```javascript
import http from "k6/http";
import { sleep, check } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = "__VERCEL_PREVIEW_URL__"; // replace with preview deployment URL

const voterUuids = new SharedArray("voters", function () {
  return JSON.parse(open("./voter-uuids.json"));
});

export const options = {
  scenarios: {
    voting: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 250 }, // ramp up
        { duration: "5m", target: 500 }, // full load
        { duration: "2m", target: 500 }, // sustain
        { duration: "1m", target: 0 },   // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95th percentile under 2s
    http_req_failed: ["rate<0.01"],    // less than 1% errors
  },
};

export default function () {
  const vuId = __VU % voterUuids.length;
  const uuid = voterUuids[vuId];

  // Step 1: Register (get session cookie)
  const regRes = http.get(`${BASE_URL}/register/${uuid}`, { redirects: 5 });
  check(regRes, { "registered ok": (r) => r.status === 200 });

  // Step 2: View beer list
  const pageRes = http.get(`${BASE_URL}/`);
  check(pageRes, { "page loaded": (r) => r.status === 200 });
  sleep(Math.random() * 10 + 5);

  // Step 3: Cast a vote (server action)
  // Next.js server actions use POST to the page URL with a Next-Action header.
  // You need to extract the action ID from the built page source.
  // Example (action ID will differ per build):
  //
  // const voteRes = http.post(`${BASE_URL}/`, JSON.stringify({
  //   beerId: "some-beer-id",
  //   voteType: "best_beer"
  // }), {
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Next-Action": "<action-id-from-page-source>",
  //   },
  // });
  // check(voteRes, { "vote ok": (r) => r.status === 200 });

  sleep(Math.random() * 7 + 3);
}
```

### 4. Running

```bash
# Replace URL with your Vercel preview deployment
k6 run --env BASE_URL=https://your-preview.vercel.app load-test/k6-script.js
```

## Success Criteria

| Metric | Target |
|--------|--------|
| p95 response time (page load) | < 2s |
| p95 response time (vote action) | < 1s |
| Error rate | < 1% |
| Lost votes | 0 |
| Duplicate presentation votes | 0 |
| Turso throttling | None |

## Pre-Event Checklist

- [ ] Verify Turso plan supports expected read/write volume
- [ ] Verify Vercel plan concurrent function execution limits
- [ ] Run Scenario C (spike) and confirm p95 < 2s
- [ ] Run Scenario B (steady) for 10 min and confirm no errors
- [ ] Monitor Turso dashboard during tests for throttling
- [ ] Test voting toggle (enable/disable) propagation under load
