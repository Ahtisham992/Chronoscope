# Theme & style

## Design philosophy

Chronoscope's own UI must disappear. The product's entire value is *old websites looking like old websites* — cluttered 90s tables, gaudy 2000s gradients, flat 2013 minimalism. If Chronoscope's chrome around that content is loud, it fights the thing it's trying to show off. So the rule is:

> **The UI is a museum wall. The archived site is the painting. Walls are neutral; paintings are not.**

Everything Chronoscope-branded is quiet, dark, modern, and out of the way. Everything from the archive is shown exactly as it was — no filters, no "aesthetic" recoloring of old pages.

## Mood references

Think: a film scrubber in a professional video editor, crossed with a planetarium display. Not: a typical SaaS dashboard, not a nostalgia-core meme aesthetic (no CRT scanlines, no fake VHS grain over the *app itself* — that gimmick is for the archived content to earn on its own, not for Chronoscope to fake).

## Color palette

Chronoscope's own interface uses a restrained near-black theme so archived pages (which are usually light-background) pop by contrast.

| Role | Value | Usage |
|---|---|---|
| Canvas | `#0B0B0D` | App background |
| Surface | `#161619` | Cards, panels, scrubber track |
| Surface raised | `#1F1F23` | Hover states, modals |
| Text primary | `#F5F5F3` | Headings, key labels |
| Text secondary | `#9A9A9F` | Metadata, timestamps, captions |
| Accent — Signal amber | `#E8A33D` | Playhead, active tick, primary CTA |
| Accent — Depth teal | `#2FA8A0` | Secondary highlights, snapshot-found markers |
| Border hairline | `#2A2A2E` | 1px dividers only, never decorative |

Rules:
- No gradients on Chronoscope's own chrome. Gradients are reserved entirely for content that happens to come from an archived 2005-era website — that's the one place a garish gradient is *correct*, because it's historically accurate, not because Chronoscope designed it that way.
- Amber is the only "loud" color and it is reserved for exactly one thing: the current position in time. If the playhead is amber, nothing else on screen should compete with it.

## Typography

- **UI type:** a single grotesk/sans (e.g. Inter or a similar neutral sans) at two weights only — 400 and 500. No serif anywhere in the chrome; serif is reserved for a single editorial use — pull-quote captions under a snapshot ("This is the page that shipped the same week the iPhone launched").
- **Never** style the archived page's own text. It renders in whatever font it originally shipped with, inside its own frame. Chronoscope must not inject its own font-face into archived content.

## Motion language

Motion is the entire product, so it gets real design attention, not default CSS transitions.

- **Scrubbing:** dragging the timeline slider cross-fades between the two nearest snapshots in real time, at 1:1 with pointer position — no easing lag. The scrub must feel like moving your finger across film, not like waiting for a page load.
- **Play:** default playback holds each snapshot for a duration inversely proportional to how many total snapshots exist (dense years move faster, sparse years linger longer) so a 300-snapshot site and a 12-snapshot site both finish in roughly the same watch time (~15–20 seconds).
- **Transition style:** a soft 200ms cross-fade between frames by default; an optional "hard cut" mode for a punchier, more meme-able export.
- **Loading states:** never a spinner. Show the nearest available snapshot immediately (even if slightly the wrong year) and swap in the exact one when ready — perceived speed matters more than precision here.

## Iconography

Minimal line icons only (single stroke weight, no fills) for the handful of controls that need them: play, pause, export, share, scrub handles. No icon for "website" or "time" anywhere in the interface — those concepts are communicated by the content itself, not by a clip-art clock or globe.

## Sound (optional, off by default)

If sound is ever added: a single soft mechanical "tick" per year crossed during autoplay, muted by default, opt-in only, and instantly killable. Never autoplay audio.

## Copy tone in the product itself

- Empty state: *"Type any domain. We'll show you what it used to be."*
- Loading: *"Pulling 312 snapshots from 1999 to now."* (real numbers, never "Loading…")
- Export button label: *"Save the movie"* — not "Export video," which reads like a tool; "save the movie" reads like a memory.
