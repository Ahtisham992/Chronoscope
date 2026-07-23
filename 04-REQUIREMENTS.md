# Requirements

## Functional requirements

### F1. Domain lookup
- User can enter any domain or full URL.
- System queries the CDX API and returns the count and date range of available snapshots before doing any heavy rendering, so the user gets instant feedback ("312 snapshots, 1999–2026") even before the video exists.

### F2. Timeline scrubber
- A horizontal slider spans the full available date range for the domain.
- Dragging the slider updates the displayed frame in real time (cross-fade between nearest two rendered snapshots).
- Tick marks on the slider are denser where snapshot density is higher (visually communicates "this site was captured constantly in 2020, rarely in 2001").

### F3. Autoplay
- A play button animates through the full history automatically, snapshot by snapshot, at a pace that keeps total runtime in a target 15–25 second band regardless of how many total snapshots exist.
- Playback can be paused, resumed, and scrubbed manually mid-play.

### F4. Export
- User can export the current timelapse as an MP4 (primary) or animated GIF (secondary, for easy embedding).
- Export includes required Internet Archive attribution burned into the frame border (not into the historical content itself — see `02-RULES.md`).

### F5. Sharing
- Every generated timelapse gets a permanent, cacheable shareable URL.
- Open Graph / social preview metadata auto-generates a preview thumbnail (first vs. last frame side-by-side) so shared links look good unfurled in Twitter/Discord/iMessage.

### F6. Side-by-side comparison mode
- User can select two domains to play synchronized by date, split-screen, for direct visual comparison.

### F7. Featured gallery
- A curated, pre-rendered set of high-profile domains (Google, Amazon, Reddit, major universities, etc.) is available with zero wait time, for first-time visitors who don't yet have a domain in mind.

### F8. Personal history (optional account tier)
- Logged-in users can save a personal collection of generated timelapses.
- Not required for any part of the core "type a URL and watch" loop.

## Non-functional requirements

### NF1. Performance
- A pre-seeded/cached domain must start playing within 2 seconds of page load.
- A cold domain shows real-time progress ("Fetched 40 of 312 snapshots") rather than a blank loading state, and produces a first playable partial result within 30 seconds even if full rendering continues in the background.

### NF2. Scalability
- The rendering pipeline is queue-based (not a request-blocking synchronous call), horizontally scalable by adding worker instances.
- Storage for rendered frames/videos is content-addressed (hashed by domain + snapshot timestamp) so duplicate requests never re-render.

### NF3. Reliability
- Wayback Machine API failures degrade gracefully — the product shows a clear "archive.org is slow right now, try again shortly" state rather than an unhandled error.
- All external calls (CDX API, screenshot rendering) have timeouts and retries with backoff (see `02-RULES.md` §1.3).

### NF4. Accessibility
- All interactive controls (scrubber, play/pause, export) are keyboard-operable and screen-reader labeled.
- Motion-heavy autoplay respects `prefers-reduced-motion` — falls back to manual scrub-only mode.

### NF5. Cost control
- Screenshot rendering and video encoding are the two most expensive operations — both are cached permanently per snapshot and never redone once generated.
- A per-domain render cap (e.g. max 100 evenly-sampled snapshots even if 1000+ exist) keeps compute bounded for extremely long-lived, heavily-archived domains.

### NF6. Legal/ethical compliance
- All rules in `02-RULES.md` are treated as hard requirements, not aspirational guidelines — CI/review checklist includes explicit sign-off against that document before any public launch.

## Data sources

| Source | Purpose | Cost |
|---|---|---|
| Internet Archive CDX API | List of available snapshot timestamps for a given domain | Free, rate-limited (~1 req/sec) |
| Internet Archive Wayback raw snapshot fetch (`id_` suffix) | Actual archived HTML/assets per snapshot | Free, rate-limited |

## Technology stack (proposed)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) | Server-rendered pages for good social-preview/SEO behavior, plus a rich interactive client for the scrubber |
| Scrubber/player UI | Custom canvas or video-based player | Precise frame-level scrub control that a plain `<video>` scrubber can't offer smoothly |
| Backend API | Node.js (same runtime as frontend, simpler ops) | CDX querying, job queue management |
| Job queue | Redis-backed queue (e.g. BullMQ) | Decouples "user asked for a domain" from "we rendered it" |
| Screenshot rendering | Playwright (headless Chromium) | Modern, reliable, well-maintained headless browser automation |
| Video stitching | ffmpeg | Industry-standard, scriptable, handles cross-fades and encoding |
| Storage | Object storage (S3-compatible) + CDN in front | Cheap, durable storage for immutable rendered assets |
| Database | Postgres | Metadata: domains, snapshot lists, render status, cache keys |
| Cache | Redis | CDX response caching, rate-limit token bucket |

## API surface (internal, high-level)

```
GET  /api/domain/:domain/snapshots        -> list of available snapshot timestamps (from CDX, cached)
POST /api/domain/:domain/render           -> enqueue render job, returns job id
GET  /api/render/:jobId/status            -> progress polling
GET  /api/timelapse/:domain               -> serves cached video/frame manifest if ready
POST /api/timelapse/:domain/export        -> triggers MP4/GIF export generation
GET  /api/compare?a=domainA&b=domainB     -> synchronized dual-domain manifest
```

## Out of scope (explicitly, for v1)

- Live/real-time monitoring of a site's *current* changes (that's a different product — a forward-looking watcher, not a backward-looking archive viewer).
- Mobile native apps — web-first, responsive, installable as a PWA at most.
- Editing/annotating the archived content itself.
