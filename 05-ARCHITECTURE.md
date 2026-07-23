# Architecture

## High-level data flow

```
 User types "amazon.com"
        │
        ▼
 ┌─────────────────┐      cached?      ┌────────────────────┐
 │  Frontend (Next) │ ───────────────► │  Postgres metadata  │
 └─────────────────┘                   │  (domain, snapshots, │
        │  not cached                  │   render status)    │
        ▼                              └────────────────────┘
 ┌─────────────────┐
 │  API: /snapshots │──► Internet Archive CDX API (rate-limited queue)
 └─────────────────┘
        │  list of timestamps
        ▼
 ┌─────────────────┐
 │  Job queue       │  (Redis / BullMQ)
 └─────────────────┘
        │  fan out, N sampled snapshots
        ▼
 ┌─────────────────┐
 │  Render workers  │──► Playwright headless Chromium
 │  (horizontally   │      fetches archived "id_" HTML per snapshot
 │   scalable)      │      screenshots at fixed viewport
 └─────────────────┘
        │  frame images
        ▼
 ┌─────────────────┐
 │  Stitch worker   │──► ffmpeg: cross-fade + encode
 └─────────────────┘
        │  finished MP4 + frame manifest
        ▼
 ┌─────────────────┐
 │  Object storage  │  (S3-compatible, content-addressed keys)
 │  + CDN           │
 └─────────────────┘
        │
        ▼
 ┌─────────────────┐
 │  Frontend player │  scrubber + autoplay + export + share
 └─────────────────┘
```

## Key architectural decisions

### 1. Two independent pipelines, not one monolith
The **fetch/render** pipeline (CDX query → screenshot) and the **stitch/export** pipeline (frames → video) are separate workers communicating only through stored frame manifests. This means:
- Rendering can resume/retry per-snapshot without redoing the whole video.
- The stitching step can be re-run with a different transition style or resolution without re-fetching anything from the Internet Archive.

### 2. Cache-first, always
Every layer checks a cache before doing real work:
- CDX snapshot lists cached in Postgres, refreshed only periodically (new snapshots do get added to old domains over time, but not minute-to-minute).
- Individual rendered frames cached by `hash(domain + timestamp + viewport)` — permanent, since the underlying content is immutable.
- Finished stitched videos cached by `hash(domain + snapshot-set + transition-style)`.

### 3. Progressive delivery, not blocking requests
A cold domain returns an immediate partial response (snapshot count, date range) while the render job runs in the background. The frontend polls job status and starts playing a low-resolution preview as soon as the first handful of frames exist, upgrading to the full video once stitching completes. Nobody stares at a blank spinner.

### 4. Sampling strategy for very dense domains
Domains with thousands of snapshots (e.g. a homepage crawled daily for a decade) are down-sampled to an evenly-spaced maximum (see `04-REQUIREMENTS.md` NF5) rather than rendering every single snapshot — this bounds render cost and keeps the final video a consistent, watchable length.

### 5. Horizontal scaling point
The render worker fleet is the only piece expected to need real horizontal scale (screenshotting is CPU/memory heavy per instance). It's designed stateless — any worker can pick up any queued job — so scaling is just "add more worker instances," no sharding logic required.

## Failure modes and handling

| Failure | Handling |
|---|---|
| CDX API returns 429 | Exponential backoff, job re-queued with delay, user sees "archive.org is busy, retrying" |
| A specific historical snapshot fails to render (missing assets, broken markup) | Skip that single frame, keep the rest of the sequence, log it — don't fail the whole job over one bad frame |
| ffmpeg stitch fails | Retry with a safer/simpler encoding profile before surfacing an error to the user |
| Storage/CDN outage | Serve last-known-good cached asset if available; otherwise clear "try again shortly" state, never a raw 500 page |

## Security notes

- All rendering happens in fully sandboxed, network-egress-limited headless browser instances (the render worker only needs to reach `web.archive.org`, nothing else) — this matters because rendering arbitrary historical HTML in a headless browser is untrusted-content execution and must be isolated accordingly.
- No user-supplied URL is ever rendered directly live from the *current* internet — only through the Wayback Machine's archived copy, which removes an entire class of live-scraping/SSRF risk.
