# PadelScore — Live Score Backend Specification

## Overview

This document describes the backend API required to support three new features:

1. **Web scoreboard** — a browser-accessible page showing the live score for a court
2. **Secondary watch mode** — additional Apple Watches on the court display the live score in read-only mode
3. **Primary watch** — the existing scoring watch pushes score updates to the backend after every point

All three features share the same infrastructure, keyed by **court code**.

---

## Architecture

```
Primary Watch  ──► POST /courts/:code/score ──► Server
                                                    │
                         ┌──────────────────────────┤
                         │                          │
                   GET /courts/:code/score    Web Scoreboard
                   (Secondary Watches)        (SSE or polling)
```

The court code is already used in the app to fetch player data. The same code becomes the identifier for live score state.

---

## API Endpoints

### 1. Push score update

**`POST /courts/:code/score`**

Called by the primary watch after every point, game, or set change. This replaces/extends the current `ScoreboardService` which sends to a local IP.

**Request headers:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "courtCode": "ABC123",
  "timestamp": "2026-05-12T10:30:00Z",

  "players": {
    "A": "EM",
    "B": "JO",
    "C": "MA",
    "D": "LU"
  },

  "servingPlayer": "B",
  "servingTeam": 1,

  "game": {
    "team1Points": "30",
    "team2Points": "15",
    "isTiebreak": false
  },

  "tiebreak": null,

  "currentSet": {
    "team1Games": 3,
    "team2Games": 2,
    "isTiebreak": false
  },

  "sets": [
    { "team1Games": 6, "team2Games": 4, "winner": 1 },
    { "team1Games": 3, "team2Games": 2, "winner": null }
  ],

  "matchScore": {
    "team1Sets": 1,
    "team2Sets": 0
  },

  "team1Side": "L",

  "isCompleted": false,
  "winner": null
}
```

**Field notes:**
- `players` — initials keyed by position code (A, B = team 1; C, D = team 2)
- `game.team1Points` — string values: `"0"`, `"15"`, `"30"`, `"40"`, `"Ad"` (advantage)
- `tiebreak` — null during regular play, object with `{ team1: int, team2: int }` during tiebreak
- `sets` — full history of all sets including the current one
- `team1Side` — `"L"` or `"R"`, indicates which side of the court team 1 is on
- `winner` — null while in progress, `1` or `2` when match is completed

**Response:**
```json
{ "ok": true }
```

---

### 2. Get current score

**`GET /courts/:code/score`**

Polled by secondary watches and the web scoreboard to get the latest state.

**Response:**

Same shape as the POST body above, plus:
```json
{
  "updatedAt": "2026-05-12T10:30:00Z"
}
```

Returns `404` if no score has been pushed for this court code yet.

---

### 3. Live score stream (optional but recommended)

**`GET /courts/:code/score/stream`**

Server-Sent Events (SSE) endpoint. The server pushes an event every time a new score is received via POST. The web scoreboard and secondary watches connect to this to get instant updates without polling.

**Event format:**
```
event: score
data: { ...same shape as GET response... }
```

If SSE is not implemented initially, secondary watches and the web page can poll `GET /courts/:code/score` every 2 seconds as a fallback.

---

## Data Storage

The server only needs to store the **latest score per court code** — no history is required (the watch app maintains full match history locally).

A simple key-value store is sufficient:

```
key:   score:{courtCode}
value: JSON blob (the POST body)
TTL:   24 hours (auto-expire after a day of inactivity)
```

---

## Web Scoreboard Page

**`GET /courts/:code`**

A browser-accessible page that displays the live score for a court.

### What to display

```
┌─────────────────────────────────────┐
│  EM / JO          MA / LU           │
│  (Team 1)         (Team 2)          │
│                                     │
│     30        -        15           │
│   (game score)                      │
│                                     │
│      3        -        2            │
│   (current set)                     │
│                                     │
│   Set 1: 6-4  ●                     │
│                                     │
│  ● = serving indicator              │
└─────────────────────────────────────┘
```

### Behavior
- Connects to `GET /courts/:code/score/stream` (SSE) for real-time updates
- Falls back to polling `GET /courts/:code/score` every 2 seconds if SSE is unavailable
- Auto-refreshes layout when sides switch (new set)
- Shows "Match completed — Team X wins" when `isCompleted: true`
- No authentication required — the court code acts as the access token

---

## Secondary Watch Mode

### How it works

A secondary watch enters **viewer mode** by entering the same court code as the primary watch. It then polls the backend for score updates and displays them read-only.

### Watch app changes required

1. **New entry point** — on the main menu, add a "Join as Viewer" option alongside "New Match"
2. **Court code entry** — same court code input already used for player fetching
3. **Viewer screen** — displays the live score (game, set, match, serving indicator) with no tap targets for scoring
4. **Polling** — calls `GET /courts/:code/score` every 2 seconds; switches to SSE if available
5. **Disconnect handling** — shows "Waiting for score..." if the court code returns 404 or the last update is older than 30 seconds

### Viewer screen layout (Watch)

Mirrors the primary watch score display but:
- Score buttons are non-interactive (display only)
- Shows a small **"Viewing"** label to distinguish from primary mode
- No Stop Match / menu options that affect the match

---

## Primary Watch Changes

The existing `ScoreboardService` currently sends to a local IP address. The new cloud scoreboard runs in parallel — both can be active at the same time.

### Changes to `ScoreboardService`

Add a second send path alongside the existing local IP path:

```
sendScore() {
    if localScoreboardEnabled → POST to local IP (existing)
    if cloudScoreboardEnabled → POST to /courts/:code/score (new)
}
```

### Score push trigger points

The score should be pushed to the backend at the same points it is currently sent to the local scoreboard:
- After every point scored
- After every game completed (with updated set score)
- After serve selection confirmed
- After match completed

### Settings

Add a toggle in the app's Settings screen:
- **"Cloud Scoreboard"** on/off
- Uses the existing `watchCode` (court code) as the identifier — no separate configuration needed

---

## Authentication & Security

- The court code acts as a shared secret — anyone with the code can view the score
- No user authentication is required for the score endpoints
- The POST endpoint may optionally require a simple header token per court (e.g. set when the match is created via the coordinator) to prevent spoofing from non-primary watches
- HTTPS required for all endpoints

---

## Summary of New Endpoints

| Method | Path | Called by |
|--------|------|-----------|
| `POST` | `/courts/:code/score` | Primary watch (after every point) |
| `GET` | `/courts/:code/score` | Secondary watches, web page (polling) |
| `GET` | `/courts/:code/score/stream` | Secondary watches, web page (SSE) |
| `GET` | `/courts/:code` | Browser (web scoreboard page) |

The first three are pure JSON API endpoints. The last one returns an HTML page.

---

## Open Questions for Backend Team

1. Should the POST endpoint validate that the court code exists (i.e. was created via the coordinator), or accept any string?
2. Is SSE feasible with the current server stack, or should we start with polling only?
3. Should score history (per point) be stored, or only the latest state?
4. What is the base URL for the new endpoints — same server as the coordinator, or separate?
