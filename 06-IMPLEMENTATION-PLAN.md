# Implementation plan — 30 phases

Each phase has a single clear goal and a concrete deliverable. Phases are grouped into six stages. Build in order — later phases assume earlier ones are done and demoable, not just coded.

---

## Stage A — Foundation (Phases 1–5)

**Phase 1: Repo & environment setup**
Goal: A clean, working scaffold.
Tasks: Initialize Next.js frontend + Node backend in a monorepo, set up linting/formatting, environment config, local dev scripts.
Deliverable: `npm run dev` boots an empty homepage locally.

**Phase 2: CDX API client**
Goal: Talk to the Internet Archive reliably.
Tasks: Build a minimal client for the CDX API, implement the 1 req/sec rate-limit queue and exponential backoff from `02-RULES.md`.
Deliverable: A CLI script that, given a domain, prints its full list of snapshot timestamps.

**Phase 3: Snapshot metadata storage**
Goal: Persist what we've learned so we never ask twice.
Tasks: Stand up Postgres, design the `domains` / `snapshots` schema, wire the CDX client to write through it.
Deliverable: Repeated lookups of the same domain hit the DB, not the API.

**Phase 4: Basic domain lookup endpoint**
Goal: First real API surface.
Tasks: Build `GET /api/domain/:domain/snapshots`, returning cached-or-fetched snapshot lists as JSON.
Deliverable: Hitting the endpoint in a browser returns real data for a real domain.

**Phase 5: Bare-bones homepage UI**
Goal: A text box that proves the loop end to end.
Tasks: Single input field + submit, calls Phase 4's endpoint, dumps the raw JSON snapshot list to the page.
Deliverable: Type `google.com`, see a real list of dates. Ugly, but real.

---

## Stage B — Rendering pipeline (Phases 6–10)

**Phase 6: Headless browser screenshot proof of concept**
Goal: Prove one snapshot can become one image.
Tasks: Wire up Playwright, fetch a single archived `id_` URL, screenshot it at a fixed viewport, save to local disk.
Deliverable: One PNG file that is unmistakably an old version of a real website.

**Phase 7: Job queue infrastructure**
Goal: Decouple "requested" from "rendered."
Tasks: Stand up Redis + BullMQ (or equivalent), define a render job schema, build a worker process that consumes jobs.
Deliverable: Enqueuing a job actually gets picked up and logged by a separate worker process.

**Phase 8: Multi-snapshot render worker**
Goal: Turn a whole domain's history into a folder of frames.
Tasks: Given a domain, sample N evenly-spaced snapshots, render each via Phase 6's logic inside Phase 7's queue, handle individual-frame failures gracefully (skip, don't crash the job).
Deliverable: One job produces an ordered folder of PNGs spanning the domain's full history.

**Phase 9: Object storage integration**
Goal: Stop storing frames on local disk.
Tasks: Wire up S3-compatible storage, content-addressed keys (`hash(domain+timestamp+viewport)`), update the render worker to write there directly.
Deliverable: Rendered frames survive a server restart and are fetchable by URL.

**Phase 10: Render status API**
Goal: Let the frontend know what's happening.
Tasks: Build `POST /api/domain/:domain/render` and `GET /api/render/:jobId/status`, track per-frame progress in Postgres.
Deliverable: A CLI or Postman call shows live progress ("40 of 312 frames rendered") for an in-flight job.

---

## Stage C — Video pipeline (Phases 11–15)

**Phase 11: ffmpeg stitching proof of concept**
Goal: Prove frames can become a video.
Tasks: Given a local folder of ordered PNGs, script an ffmpeg command that produces a simple hard-cut slideshow MP4.
Deliverable: A watchable, if crude, MP4 of a real domain's history.

**Phase 12: Cross-fade transitions**
Goal: Make it feel like a movie, not a slideshow.
Tasks: Extend the ffmpeg pipeline to cross-fade between frames, tune duration-per-frame so total runtime lands in the 15–25 second target band regardless of frame count.
Deliverable: A noticeably smoother, more "wow" version of Phase 11's output.

**Phase 13: Stitch worker as its own queued job**
Goal: Decouple stitching from rendering, per the architecture doc.
Tasks: Add a second job type to the queue for "stitch these frames into a video," triggered automatically once all frames for a domain finish rendering.
Deliverable: Full pipeline runs unattended: request domain → frames render → video stitches → stored, no manual steps.

**Phase 14: Video storage & manifest**
Goal: Make finished videos fetchable and cache-checked properly.
Tasks: Store finished MP4s in object storage with content-addressed keys; store a per-domain manifest (frame list + timestamps + video URL) in Postgres.
Deliverable: `GET /api/timelapse/:domain` returns a ready-to-play video URL if one exists.

**Phase 15: End-to-end pipeline test on 10 real domains**
Goal: Stress-test the whole thing before building UI polish on top of it.
Tasks: Run the full pipeline against 10 varied real domains (huge/dense, small/sparse, image-heavy, text-heavy), fix whatever breaks.
Deliverable: 10 real finished timelapse videos, sitting in storage, all playable.

---

## Stage D — Frontend experience (Phases 16–20)

**Phase 16: Real homepage design**
Goal: Apply the visual identity for real.
Tasks: Implement the color palette, typography, and layout from `01-THEME-AND-STYLE.md`; replace the Phase 5 placeholder UI.
Deliverable: A homepage that actually looks like Chronoscope, not a dev scaffold.

**Phase 17: Timeline scrubber component**
Goal: The single most important interaction in the product.
Tasks: Build the draggable scrubber, mapped to snapshot density, cross-fading between the two nearest cached frames in real time as described in `04-REQUIREMENTS.md` F2.
Deliverable: Dragging the slider genuinely feels like scrubbing through time, not clicking through a calendar.

**Phase 18: Autoplay controls**
Goal: The "just hit play" moment.
Tasks: Play/pause button, automatic playback through the finished video (or frame sequence) at the tuned pacing from Phase 12.
Deliverable: Press play, watch a real domain's history unfold unattended.

**Phase 19: Progressive loading UX**
Goal: Nobody should ever see a blank spinner.
Tasks: Wire the frontend to poll render status (Phase 10) and show real progress copy per `01-THEME-AND-STYLE.md` ("Pulling 312 snapshots…"), with a low-res preview appearing as soon as partial frames exist.
Deliverable: A cold domain feels alive and progressing from the first second, never blank.

**Phase 20: Featured gallery + pre-seeding**
Goal: First-time visitors never hit a cold, slow domain.
Tasks: Pick 15–20 high-profile domains, run the full pipeline for them ahead of time via a background/admin job, build the gallery UI surfacing them.
Deliverable: Landing page shows instantly-playable, polished examples with zero wait.

---

## Stage E — Sharing, export, and polish (Phases 21–25)

**Phase 21: MP4/GIF export**
Goal: The actual growth-loop artifact.
Tasks: Build the export endpoint, burn in required Internet Archive attribution per `02-RULES.md` §2 and §4.2, support both MP4 and GIF output formats.
Deliverable: A downloadable file that looks good posted anywhere.

**Phase 22: Shareable permalinks + social previews**
Goal: Make links posted to social platforms look great unfurled.
Tasks: Generate a permanent URL per finished timelapse, auto-generate an Open Graph preview image (first vs. last frame side by side).
Deliverable: Pasting a Chronoscope link into Twitter/Discord/iMessage shows a rich, attractive preview card.

**Phase 23: Side-by-side comparison mode**
Goal: The second signature feature.
Tasks: Build `GET /api/compare`, synchronized dual-domain playback UI, shared scrubber driving both sides at once.
Deliverable: A working "Google vs. Yahoo, 1998–2010" demo.

**Phase 24: Accessibility pass**
Goal: Meet the non-functional requirements for real, not just on paper.
Tasks: Keyboard operability for scrubber/play/export, screen-reader labels, `prefers-reduced-motion` fallback to manual-scrub-only.
Deliverable: Full keyboard-only and screen-reader walkthroughs pass without dead ends.

**Phase 25: Performance & cost hardening**
Goal: Make the product cheap and fast at scale before opening the doors.
Tasks: Verify per-domain render caps, confirm cache-hit rates on repeated domains, load-test the worker fleet's horizontal scaling under concurrent cold-domain requests.
Deliverable: A documented load test showing the system holds up under a simulated launch-day spike.

---

## Stage F — Launch and beyond (Phases 26–30)

**Phase 26: Rules compliance review**
Goal: Formal sign-off against `02-RULES.md` before anything goes public.
Tasks: Walk every rule in that document against the actual shipped implementation; fix any gap (attribution placement, takedown process, content-safety filter on the public gallery, etc.).
Deliverable: A signed-off compliance checklist, no open items.

**Phase 27: Private beta**
Goal: Real users, small blast radius.
Tasks: Invite a small group, collect feedback specifically on the "wow, first 10 seconds" moment, watch for pipeline failures on real-world weird domains.
Deliverable: A prioritized punch-list of pre-launch fixes from real usage.

**Phase 28: Punch-list fixes + launch asset prep**
Goal: Close the gap from beta feedback and prepare the launch moment itself.
Tasks: Fix top beta issues; prepare a launch demo video (ironically, likely a Chronoscope-generated timelapse of a beloved domain) and launch copy.
Deliverable: A polished, demo-ready product plus launch-day marketing assets.

**Phase 29: Public launch**
Goal: Ship it.
Tasks: Flip the switch, post the launch demo (Product Hunt / Hacker News / X / TikTok as appropriate), monitor the pipeline live for the first real traffic spike.
Deliverable: Chronoscope is live and generating real timelapses for real strangers.

**Phase 30: Post-launch iteration loop**
Goal: Turn launch-day learnings into the next roadmap, not a one-off release.
Tasks: Review which domains got requested most (informs future pre-seeding), review any pipeline failures under real load, review social share performance to see which format (MP4 vs. GIF, single vs. side-by-side) actually spread, and scope v2 priorities from real data rather than guesses.
Deliverable: A written v2 roadmap grounded in actual launch data.
