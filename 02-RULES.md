# Rules

These are non-negotiable constraints. Any implementation decision that conflicts with a rule here loses, regardless of how much nicer it would make the feature.

## 1. Data source rules (Internet Archive respect)

1. **Cache aggressively, fetch once.** Archived content is immutable — a 2005 snapshot of a page will never change. Once Chronoscope fetches and renders a snapshot, it is stored permanently in Chronoscope's own storage/CDN. The Internet Archive is never re-hit for the same snapshot twice.
2. **Respect rate limits.** CDX API calls are capped at roughly 1 request/second per the community-observed limit. All CDX calls go through a single rate-limited queue, never fired in parallel bursts per user request.
3. **Exponential backoff on 429/503.** Any throttling response triggers backoff starting at 3 seconds, doubling, with a hard ceiling — never hammer retries.
4. **Pre-seed, don't cold-fetch popular domains.** The top N most-requested domains (Google, Amazon, Wikipedia, major social platforms) are pre-rendered and cached ahead of time via a background job, not fetched live on a user's first request.
5. **Never scrape or mirror the Internet Archive's own infrastructure or brand.** Chronoscope is a client of the CDX/Wayback API, not a replacement for or reskin of archive.org. Attribution to the Internet Archive as the underlying data source is required, visibly, on every rendered timelapse.

## 2. Content rules

1. **No manipulation of historical content.** Snapshots are rendered exactly as archived — no cropping out embarrassing sections, no color-correcting, no injecting commentary into the frame itself. Editorial commentary (captions, callouts) lives in the UI chrome around the frame, never inside it.
2. **Respect takedowns.** If the Internet Archive itself has removed or restricted a snapshot (per a robots.txt exclusion or a legal takedown), Chronoscope must not attempt to route around that restriction through caching or mirrors. If IA says no, Chronoscope says no.
3. **No adult, illegal, or clearly malicious historical content is rendered.** A basic content-safety filter runs on generated frames before they're cached publicly; flagged content is excluded from the public gallery (a private/logged-in personal view may still show it, since it's just historical fact, but it is never surfaced to anonymous or shared views).
4. **Private and sensitive domains get a lighter touch.** Domains that are personal blogs, small businesses, or clearly non-public-figure personal sites are still fair game (the Wayback Machine already made them public), but Chronoscope does not proactively promote or feature "gotcha" timelapses of small/private domains — the featured gallery favors large, well-known, or already-public brands.

## 3. Engineering rules

1. **The pipeline is idempotent.** Re-running the fetch-render-stitch pipeline for the same domain must never produce duplicate storage or duplicate billing for compute — every step checks cache state before doing work.
2. **Rendering is queued, never synchronous on a user request.** A cold (never-seen) domain returns "we're building this now" immediately and streams progress; it never makes a user's browser hang on a blocking request for minutes.
3. **One screenshot pipeline, one video pipeline, cleanly separated.** The headless-browser screenshot step and the ffmpeg stitching step are independent, swappable services — neither should assume implementation details of the other, so either can be replaced (e.g. swapping Playwright for a different renderer) without touching the other.
4. **No client-side heavy lifting.** All screenshot capture, image processing, and video encoding happens server-side/in a worker. The browser client only ever plays back pre-rendered frames/video — it never renders archived HTML live in an iframe (see rule 3.5 below).
5. **Never iframe live archive.org content directly into the product surface.** Beyond the legal/reliability risk of depending on IA's uptime for a live embed, directly iframing also breaks the "seamless movie" experience (different domains can't smoothly cross-fade against each other). Chronoscope always renders its own screenshot, once, and owns the resulting asset.

## 4. Legal & ethical rules

1. **No claim of ownership over archived content.** Chronoscope owns its own code, UI, and generated video files; it does not claim ownership over the underlying webpages, trademarks, or brand assets shown within them.
2. **Clear, permanent attribution.** Every export and every shared timelapse includes visible attribution: "Historical data via the Internet Archive's Wayback Machine."
3. **Right-to-be-forgotten respected end to end.** If a takedown request is received directly (not just from IA), the affected domain's cached renders are removed within a defined SLA (target: 72 hours), and the domain is added to a do-not-render list.
4. **No dark patterns.** No fake urgency, no disguised ads, no auto-play with sound, no cookie-consent dodges. Exporting and sharing a timelapse must never require creating an account for the free tier's basic use.

## 5. Brand rules

1. Chronoscope's own name and mark never appear watermarked on top of the archived content itself (rule 2.1 extends here) — attribution and branding live in the frame *around* the video, never burned into the pixels of the historical page.
2. The word "Wayback" is never used in Chronoscope's own marketing headlines (to avoid implied endorsement by or confusion with the Internet Archive) — it's fine in factual attribution text, never in taglines.
