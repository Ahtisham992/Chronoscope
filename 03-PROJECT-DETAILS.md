# Project details

## Vision

Every website has a life story, and right now the only way to read it is to manually click through a calendar on archive.org, one snapshot at a time, and mentally stitch the changes together yourself. Chronoscope does that stitching for you and turns it into the thing it always secretly was: a movie.

The bet is simple — **watching** is a fundamentally different (and more shareable) experience than **browsing**. Nobody posts a screenshot of themselves clicking through the Wayback Machine calendar. People do post timelapse videos.

## The core value proposition

> Turn any domain's entire archived history into a 15–20 second, watchable, exportable, shareable timelapse video — with zero technical knowledge required.

## Who this is for

| Audience | Why they'd use it |
|---|---|
| General/non-technical public | Pure nostalgia — "what did MySpace look like the year I joined" |
| Content creators / YouTubers | Ready-made B-roll for "history of X" videos |
| Designers | Visual case studies of how a brand's design language evolved |
| Journalists & researchers | Fast visual due-diligence on a company's messaging history |
| Students / educators | Teaching digital literacy and media history visually |
| Developers (portfolio angle) | A technically real, visually impressive personal project to show off |

## What makes this different from "just using the Wayback Machine"

| Wayback Machine (archive.org) | Chronoscope |
|---|---|
| Click one date at a time on a calendar | Drag a slider or press play — continuous motion |
| Static single-page view per click | Auto-generated video covering the entire history |
| No export format | One-click MP4 export built for sharing |
| Built for lookup/research | Built for watching and posting |
| Interface designed for utility | Interface designed to disappear so the content is the star |

Chronoscope is not a competitor to the Wayback Machine — it's a presentation layer built on top of it, the way a highlight-reel app is not a competitor to raw game footage.

## Signature use cases (what a demo/launch video shows)

1. **"Google, 1998 → 2026"** — from a plain text link list to the modern homepage, in 15 seconds.
2. **"My university's website, the year I was born → now."** — deeply personal, endlessly repeatable per visitor.
3. **"Amazon: bookstore → everything store."**
4. **Side-by-side mode:** two domains playing simultaneously (e.g. Google vs. Yahoo, 1998–2010) as a visual "who won" narrative.

## Differentiators worth calling out explicitly

- **It's an instrument, not a database.** Positioned and named as something you look *through* (a scope), not something you search.
- **Export-first.** The shareable video file, not the web page itself, is the actual growth loop — most competing "wrapper" tools around archive.org stop at an in-browser view and never produce a portable artifact.
- **Zero setup, zero login for the core loop.** Type a URL, watch, download. Account creation (if it exists at all) is only for saving a personal gallery or higher export quality — never a gate on the core "wow" moment.

## Known constraints (stated honestly, not hidden)

- Older snapshots (pre-2005ish) are frequently missing images/CSS due to gaps in what the Wayback Machine originally captured — some early frames in a timelapse will look broken. This is treated as an accepted, even charming, limitation rather than something to engineer around at launch.
- Very low-traffic/rarely-archived domains may only have a handful of snapshots total, producing a short, choppy timelapse rather than a smooth one. The product should gracefully communicate "only 4 snapshots exist for this domain" rather than pretending otherwise.
- Video rendering takes real compute time for a cold (never-before-requested) domain — this is why pre-seeding popular domains (rule 1.4 in `02-RULES.md`) matters so much for first-impression quality.
